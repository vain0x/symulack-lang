import { DebugProtocol } from "vscode-debugprotocol"

/**
 * stopped イベントの引数
 */
export interface StoppedEventBody {
    reason: string;
    description?: string
    threadId?: number
    preserveFocusHint?: boolean
    text?: string
    allThreadsStopped?: boolean
}

/**
 * output イベントの引数
 */
export interface OutputEventBody {
    category?: string
    output: string;
    variablesReference?: number
    source?: DebugProtocol.Source
    line?: number
    column?: number
    data?: any
}

/**
 * デバッグアダプタープロトコル (DAP) に基づくデバッグアダプターが
 * 開発ツール (IDE) に対して通知できるイベントを定める。
 */
export interface DapAdapterActions {
    // デバッグの開始・終了系

    /**
     * デバッグアダプターがデバッグ設定 (ブレークポイントの配置など) を受け取る準備が整ったことを通知する。
     *
     * デバッグアダプターは、InitializedRequest を受け取った後にこのイベントを1回通知する必要がある。
     */
    sendInitializedEvent(): void

    /**
     * デバッグが終了したことを通知する。
     *
     * (デバッギーやデバッガーが停止したとは限らない。)
     */
    sendTerminatedEvent(): void

    /**
     * デバッギーが終了したことを通知する。
     */
    sendExitedEvent(exitCode: number): void

    // 実行制御系

    /**
     * デバッギーが実行を再開したことを通知する。
     */
    sendContinuedEvent(): void

    /**
     * デバッギーが実行を中断したことを通知する。
     */
    sendStoppedEvent(args: StoppedEventBody): void

    // その他

    /**
     * デバッギーが何らかの出力を行ったことを通知する。
     *
     * (VSCode では output がデバッグコンソールに表示される。)
     */
    sendOutputEvent(args: OutputEventBody): void

    // その他は略
}
