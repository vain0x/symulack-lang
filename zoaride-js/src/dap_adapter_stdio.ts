import * as path from "path"
import { ChildProcess, spawn } from "child_process"
import { ContinueResponseBody, DapAdapterReactions, InitializeResponseBody, StackTraceResponseBody } from "./dap_adapter_reactions_interface"
import { Socket, connect } from "net"
import { enableTrace, writeTrace } from "./util_trace"
import { DapAdapterActions } from "./dap_adatper_actions_interface"
import { DebugProtocol } from "vscode-debugprotocol"
import { promisify } from "util"
import { StdoutDapAdapterActions } from "./dap_adapter_actions_stdout"
import { ZoarideDapAdapterReactions } from "./dap_adapter_reactions_zoaride"
import { parseDapMessage } from "./dap_parse"

type ErrorFun = (err: unknown) => void

export const startDapAdapterServer = () => {
    const actions = new StdoutDapAdapterActions()
    const reactions = new ZoarideDapAdapterReactions(actions)

    let lastSeq = 0
    let data = new Uint8Array()

    const sendResponse = (requestSeq, responseBody) => {
        process.stdout.write(Buffer.sendR)
    }

    process.stdin.on("data", chunk => {
        data = Buffer.concat([data, chunk])

        const { msg, rest }= parseDapMessage(data)
        data = rest

        if (!msg) {
            return
        }

        if (msg.type === "request") {
            const { seq, body } = msg

            switch (msg.request) {
                case "initialize":
                    reactions.onInitializeRequest(body)
                        .then(responseBody => {

                        })
            }

            return
        }

        if (msg.type === "notification") {
            return
        }

        writeTrace("不明なメッセージ", msg)
    })
}

/**
 * DapAdapterReactions のラッパー実装
 *
 * レスポンスを標準入力に流す。
 */
export class StdinDapAdapterServer {
    private errorFun: ErrorFun

    constructor() {
        this.errorFun = err => writeTrace("error", err)


    }

    private sendResponse(body: )

    // デバッグの開始・終了系

    public async onInitializeRequest(args: DebugProtocol.InitializeRequestArguments): Promise<InitializeResponseBody> {
        this.inner.onInitializeRequest(args)
            .then(body => )
        writeTrace("initialize", args)

        return {
            capabilities: {},
        }
    }

    public async onLaunchRequest(args: DebugProtocol.LaunchRequestArguments): Promise<void> {

    }

    public async onTerminateRequest(args: DebugProtocol.TerminateArguments): Promise<void> {

    }

    // 実行制御系

    public async onContinueRequest(args: DebugProtocol.ContinueArguments): Promise<ContinueResponseBody> {
        return {}
    }

    public async onPauseRequest(args: DebugProtocol.PauseArguments): Promise<void> {

    }

    public async onNextRequest(args: DebugProtocol.NextArguments): Promise<void> {

    }

    public async onStepInRequest(args: DebugProtocol.StepInArguments): Promise<void> {

    }

    // データ取得系

    public async onThreadsRequest(): Promise<DebugProtocol.Thread[]> {
        return []
    }

    public async onStackTraceRequest(args: DebugProtocol.StackTraceArguments): Promise<StackTraceResponseBody> {
        return {
            stackFrames: [],
        }
    }

    public async onScopesRequest(args: DebugProtocol.ScopesArguments): Promise<DebugProtocol.Scope[]> {
        return []
    }

    public async onVariablesRequest(args: DebugProtocol.VariablesArguments): Promise<DebugProtocol.Variable[]> {
        return []
    }
}
