import { DebugProtocol } from "vscode-debugprotocol"

export interface InitializeResponseBody {
    capabilities: DebugProtocol.Capabilities
}

export interface ContinueResponseBody {
    allThreadsContinued?: boolean
}

export interface StackTraceResponseBody {
    stackFrames: DebugProtocol.StackFrame[]
    totalFrames?: number
}

/**
 * デバッグアダプタープロトコル (DAP) に基づいて動作するデバッグアダプターの
 * 開発ツール (IDE) からのリクエストに対する応答を定める。
 */
export interface DapAdapterReactions {
    // デバッグの開始・終了系

    /**
     * initialize リクエストに応答する。
     *
     * このリクエストはデバッグの開始時に通知されて、デバッグアダプターとデバッガーの間でのデータ交換の開始を表している。
     * まだデバッグは開始しない。(デバッギーの起動やデバッギーへの接続は後に来る launch/attach のタイミングで行う。)
     */
    onInitializeRequest(args: DebugProtocol.InitializeRequestArguments): Promise<InitializeResponseBody>

    /**
     * launch リクエストに応答する。デバッグアダプターはデバッギーを起動する。
     *
     * (VSCode は拡張機能の ConfigurationProvider が作成したオブジェクトを args として渡す。)
     */
    onLaunchRequest(args: DebugProtocol.LaunchRequestArguments): Promise<void>

    /**
     * terminate リクエストに応答する。デバッグアダプターは自身を終了させる。
     *
     * (VSCode は ■ ボタンを押されたときに送る。)
     */
    onTerminateRequest(args: DebugProtocol.TerminateArguments): Promise<void>

    // 実行制御系

    /**
     * continue リクエストに応答する。
     *
     * デバッギーの実行を再開させる。このリクエストにレスポンスを返しただけでは、デバッギーが実行を再開したとはみなされない。
     * デバッギーが実行を再開したのなら、別途 continued イベントを発行しなければいけない。
     */
    onContinueRequest(args: DebugProtocol.ContinueArguments): Promise<ContinueResponseBody>

    /**
     * pause リクエストに応答する。
     *
     * デバッギーの実行を中断させる。このリクエストにレスポンスを返しただけでは、デバッギーが中断したとはみなされない。
     * デバッギーが中断したのなら、別途 stopped イベントを発行しなければいけない。
     */
    onPauseRequest(args: DebugProtocol.PauseArguments): Promise<void>

    /**
     * next リクエストに応答する。
     *
     * デバッギーの実行を1ステップ進める。
     *
     * (VSCode はステップオーバーボタンを押されたときに送る。)
     */
    onNextRequest(args: DebugProtocol.NextArguments): Promise<void>

    /**
     * stepIn リクエストに応答する。
     *
     * デバッギーの実行を、指定されたターゲットに入るまで進める。
     * ターゲットに入れないときは next リクエストと同様にふるまう。
     * 指定されたターゲットは stepInTargets の結果から選択される。
     */
    onStepInRequest(args: DebugProtocol.StepInArguments): Promise<void>

    // データ取得系

    /**
     * threads リクエストに応答する。
     *
     * デバッギーのスレッドのリストを返す。
     */
    onThreadsRequest(): Promise<DebugProtocol.Thread[]>

    /**
     * stackTrace リクエストに応答する。
     *
     * 指定されたスレッドのスタックトレースの一部を返す。
     */
    onStackTraceRequest(args: DebugProtocol.StackTraceArguments): Promise<StackTraceResponseBody>

    /**
     * scopes リクエストに応答する。
     *
     * 指定されたスタックフレームに対応するスコープのリストを返す。
     *
     * (スコープは変数の入れ物。イメージとしていえば、ある関数の呼び出しに対応するスタックフレームに対応するスコープは、
     * その関数の内部のローカル変数や、その関数が (クロージャとして) キャプチャした変数などを含むものが考えられる。)
     */
    onScopesRequest(args: DebugProtocol.ScopesArguments): Promise<DebugProtocol.Scope[]>

    /**
     * variables リクエストに応答する。
     *
     * 指定された variableReference に対応する変数のリストを返す。
     *
     * 変数の型や値は整数であろうと何であろうと文字列で表す。
     *
     * (私見でいうと、DAP のいう variable はローカル変数やフィールドなどにとどまらず、
     * 配列の要素や連想配列のキーと値のペアのような、オブジェクトが格納される場所のことと考えられる。)
     */
    onVariablesRequest(args: DebugProtocol.VariablesArguments): Promise<DebugProtocol.Variable[]>

    // その他は略
}
