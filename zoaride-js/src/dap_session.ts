// 参考: [vscode-mock-debug](https://github.com/Microsoft/vscode-mock-debug)
// FIXME: Node.js がない環境でも DAP を動作させるサンプルにするため、vscode-debugadapter に依存しないようにしたい。

import * as fs from "fs"
import * as path from "path"
import { ChildProcess, spawn } from "child_process"
import {
    InitializedEvent,
    LoggingDebugSession,
    OutputEvent,
    TerminatedEvent,
} from "vscode-debugadapter"
import { enableTrace, getTraceFilePath, writeTrace } from "./dap_trace"
import { DebugProtocol } from "vscode-debugprotocol"

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

const fileExists = (fileName: string) =>
    new Promise<boolean>(resolve =>
        fs.stat(fileName, err => resolve(!err)))

export class ZoarideDebugSession extends LoggingDebugSession {
    /**
     * デバッグ実行のために起動したランタイムのプロセス
     */
    private debuggeeProcess: ChildProcess | null = null

    constructor() {
        super(getTraceFilePath())

        writeTrace("----------------------")
        writeTrace("New Session", {
            cwd: process.cwd(),
            args: process.argv,
        })
        writeTrace("----------------------")
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
        if (args && args.trace && args.outDir) {
            enableTrace(args.outDir)
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

        // ランタイムを起動・監視する。
        writeTrace("デバッギーの実行を開始します。")

        // FIXME: ゾアライドランタイムを起動する。
        this.debuggeeProcess = spawn(
            "node",
            [
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
    }

    /**
     * デバッグの停止が要求されたとき
     */
    public terminateRequest(response: DebugProtocol.TerminateResponse, args: DebugProtocol.TerminateArguments) {
        writeTrace("terminate", args)
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
    }
}
