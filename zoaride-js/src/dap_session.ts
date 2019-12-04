// 参考: [vscode-mock-debug](https://github.com/Microsoft/vscode-mock-debug)
// FIXME: Node.js がない環境でも DAP を動作させるサンプルにするため、vscode-debugadapter に依存しないようにしたい。

import * as path from "path"
import { ChildProcess, spawn } from "child_process"
import {
    ContinuedEvent,
    DebugSession,
    InitializedEvent,
    OutputEvent,
    StoppedEvent,
    TerminatedEvent,
    Thread,
} from "vscode-debugadapter"
import { Socket, connect } from "net"
import { enableTrace, writeTrace } from "./util_trace"
import { DebugProtocol } from "vscode-debugprotocol"
import { promisify } from "util"

/**
 * デバッグの開始時にクライアントから渡されるデータ。
 *
 * zoaride-vscode の ZoarideConfigProvider の config に相当する。
 */
interface LaunchRequestArguments extends DebugProtocol.LaunchRequestArguments {
    /**
     * 実行するファイルのパス
     */
    program: string

    /**
     * outDir のパス
     *
     * 注意: VSCode の場合、実行時のカレントディレクトリは VSCode があるディレクトリのパスになる。
     */
    outDir: string

    /**
     * [開発用] デバッグログを出力するか？
     */
    trace?: boolean
}

/**
 * デバッガーが立てるサーバーのポート
 */
const DEBUG_PORT = 50001

const THREAD_ID = 1

const GLOBALS_REFERENCE = 1

export class ZoarideDebugSession extends DebugSession {
    /**
     * デバッグ実行のために起動したランタイムのプロセス
     */
    private debuggeeProcess: ChildProcess | null = null

    /**
     * ランタイムが立てているサーバーとの接続
     */
    private connection: Socket | null = null

    private program: string | null = null

    private currentLine: number = 0

    constructor() {
        super()

        enableTrace("dap")

        writeTrace("New Session", {
            cwd: process.cwd(),
            args: process.argv,
        })
    }

    /**
     * デバッガーの初期化
     *
     * まだデバッグ実行は開始しない。
     */
    public initializeRequest(response: DebugProtocol.InitializeResponse, args: DebugProtocol.InitializeRequestArguments): void {
        writeTrace("initialize", args)

        response.body = response.body || {}

        this.sendResponse(response)

        this.sendEvent(new InitializedEvent())
    }

    private async _doLaunch(args: LaunchRequestArguments): Promise<[boolean, string]> {
        if (args && args.trace) {
            enableTrace("dap")
        }

        writeTrace("launch", args)

        // 正しく引数が渡されたか検査する。(デバッグ用)
        const { program, outDir } = args

        if (typeof program !== "string" || program === "") {
            writeTrace("bad argument: program")
            return [false, "デバッガーの起動に失敗しました。(launch の args.program が不正です。)"]
        }

        if (typeof outDir !== "string" || outDir === "") {
            writeTrace("bad argument: outDir")
            return [false, "デバッガーの起動に失敗しました。(launch の args.outDir が不正です。)"]
        }

        this.program = program

        // ランタイムを起動・監視する。
        writeTrace("デバッギーの実行を開始します。")

        // ランタイムをデバッグモードで起動する。
        this.debuggeeProcess = spawn(
            "node",
            [
                path.resolve(args.outDir, "vm_main.js"),
                `--debug-port=${DEBUG_PORT}`,
                args.program,
            ],
            {
                cwd: path.dirname(program),
                stdio: "pipe",
                windowsHide: false,
            })

        this.debuggeeProcess.stdout!.on("data", data => {
            writeTrace("stdout", data.toString())
        })

        this.debuggeeProcess.stderr!.on("data", data => {
            writeTrace("stderr", data.toString())
            this.sendEvent(new OutputEvent(data.toString()))
        })

        this.debuggeeProcess.on("close", exitCode => {
            writeTrace("デバッギーが停止しました。", { exitCode })
            this.doShutdown({ exitCode })
        })

        this.debuggeeProcess.on("error", err => {
            writeTrace("デバッギーがエラーを報告しました。", { err })
            this.doShutdown({ err })
        })

        writeTrace("デバッギーが起動しました。")

        this.connection = connect(DEBUG_PORT, "localhost", () => {
            writeTrace("ランタイムと接続しました。")
        })
        return [true, ""]
    }

    /**
     * デバッグの開始が要求されたとき
     */
    public async launchRequest(response: DebugProtocol.LaunchResponse, args: LaunchRequestArguments) {
        const [success, message] = await this._doLaunch(args).catch(err => [false, err.toString()])

        response.success = success
        response.message = message
        this.sendResponse(response)

        if (this.connection) {
            this.connection.on("data", data => {
                const text = data.toString().trim()
                writeTrace("from vm: " + text)

                if (text === "terminated") {
                    this.sendEvent(new TerminatedEvent())
                    return
                }

                if (text === "continued") {
                    this.sendEvent(new ContinuedEvent(THREAD_ID))
                    return
                }

                if (text.startsWith("stopped:")) {
                    const line = +text.slice("stopped:".length)
                    if (!Number.isSafeInteger(line)) {
                        writeTrace("bad protocol")
                        return
                    }

                    this.currentLine = line
                    this.sendEvent(new StoppedEvent("step", THREAD_ID))
                    return
                }
            })
        }

        // stop on entry
        this.sendEvent(new StoppedEvent("entry", THREAD_ID))
    }

    public threadsRequest(response: DebugProtocol.ThreadsResponse) {
        writeTrace("threads")

        response.body = {
            threads: [
                {
                    id: THREAD_ID,
                    name: "main thread",
                },
            ],
        }

        this.sendResponse(response)
    }

    public stackTraceRequest(response: DebugProtocol.StackTraceResponse, args: DebugProtocol.StackTraceArguments) {
        writeTrace("stackTrace", args)

        response.body = {
            totalFrames: 1,
            stackFrames: [
                {
                    id: 1,
                    name: "top level",
                    source: this.program !== null ? {
                        path: this.program,
                    } : undefined,
                    line: this.currentLine + 1,
                    column: 1,
                },
            ],
        }

        this.sendResponse(response)
    }

    public scopesRequest(response: DebugProtocol.ScopesResponse, args: DebugProtocol.ScopesArguments) {
        writeTrace("scopes", args)

        response.body = {
            scopes: [
                {
                    name: "globals",
                    variablesReference: GLOBALS_REFERENCE,
                    expensive: false,
                },
            ],
        }

        this.sendResponse(response)
    }

    public variablesRequest(response: DebugProtocol.VariablesResponse, args: DebugProtocol.VariablesArguments) {
        writeTrace("variables", args)

        if (!this.connection) {
            response.body.variables = []
            response.success = false
            this.sendResponse(response)
            return
        }

        this.connection.once("data", data => {
            const text = data.toString().trim()

            response.body = {
                variables: [
                    {
                        variablesReference: 0,
                        name: "n",
                        type: "number",
                        value: text,
                    },
                ],
            }
            this.sendResponse(response)
        })

        this.connection.write("variables")
    }

    public continueRequest(response: DebugProtocol.ContinueResponse, _args: DebugProtocol.ContinueArguments) {
        writeTrace("continue")

        if (!this.connection) {
            response.success = false
            this.sendResponse(response)
            return
        }

        response.body = {}

        this.connection.once("data", () => {
            this.sendResponse(response)
            return
        })

        this.connection.write("continue\r\n")
    }

    public pauseRequest(response: DebugProtocol.PauseResponse, _args: DebugProtocol.PauseArguments) {
        writeTrace("pause")

        if (!this.connection) {
            response.success = false
            this.sendResponse(response)
            return
        }


        this.connection.once("data", () => {
            this.sendResponse(response)
            return
        })

        this.connection.write("pause\r\n")
    }

    public nextRequest(response: DebugProtocol.NextResponse, _args: DebugProtocol.NextArguments) {
        writeTrace("next")

        if (!this.connection) {
            response.success = false
            this.sendResponse(response)
            return
        }


        this.connection.once("data", () => {
            this.sendResponse(response)
            return
        })

        this.connection.write("stepIn\r\n")
    }

    public stepInRequest(response: DebugProtocol.StepInResponse, _args: DebugProtocol.StepInArguments) {
        writeTrace("stepIn")

        if (!this.connection) {
            response.success = false
            this.sendResponse(response)
            return
        }


        this.connection.once("data", () => {
            this.sendResponse(response)
            return
        })

        this.connection.write("stepIn\r\n")
    }

    /**
     * デバッグの停止が要求されたとき
     */
    public async terminateRequest(response: DebugProtocol.TerminateResponse, args: DebugProtocol.TerminateArguments) {
        writeTrace("terminate", args)

        if (this.connection) {
            await promisify(this.connection.write)("terminate\r\n")
        }

        const process = this.debuggeeProcess
        if (process) {
            writeTrace("kill")
            process.kill()
            this.debuggeeProcess = null
        }

        response.success = true
        this.sendResponse(response)
    }

    /**
     * デバッグを停止する。
     */
    private doShutdown(data: unknown) {
        writeTrace("shutdown", data)

        this.sendEvent(new TerminatedEvent())
        this.debuggeeProcess = null

        if (this.connection) {
            this.connection.end()
            this.connection = null
        }
    }
}
