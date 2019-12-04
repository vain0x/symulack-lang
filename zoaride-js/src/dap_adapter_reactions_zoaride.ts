// 参考: [vscode-mock-debug](https://github.com/Microsoft/vscode-mock-debug)

import * as path from "path"
import { ChildProcess, spawn } from "child_process"
import { ContinueResponseBody, DapAdapterReactions, InitializeResponseBody, StackTraceResponseBody } from "./dap_adapter_reactions_interface"
import { Socket, connect } from "net"
import { enableTrace, writeTrace } from "./util_trace"
import { DapAdapterActions } from "./dap_adatper_actions_interface"
import { DebugProtocol } from "vscode-debugprotocol"
import { promisify } from "util"

/**
 * デバッグの開始時に開発ツール (IDE) から渡されるデータ。
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
 * デバッグサーバーのポート
 */
const DEBUG_PORT = 50001

/**
 * DAP で使うスレッドの識別子。当面はシングルスレッドのみ考えるので固定。
 */
const THREAD_ID = 1

/**
 * グローバル変数からなるスコープの variableReference 値
 */
const GLOBALS_REFERENCE = 1

export class ZoarideDapAdapterReactions implements DapAdapterReactions {
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

    constructor(
        private readonly actions: DapAdapterActions,
    ) {
        enableTrace("dap")

        writeTrace("constructor", {
            cwd: process.cwd(),
            args: process.argv,
        })
    }

    // デバッグの開始・終了系

    public async onInitializeRequest(args: DebugProtocol.InitializeRequestArguments): Promise<InitializeResponseBody> {
        writeTrace("initialize", args)

        this.actions.sendInitializedEvent()

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
