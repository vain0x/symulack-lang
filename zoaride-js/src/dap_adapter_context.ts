class DapAdapterContext {
    private lastSeq: number = 0

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

    private readFun: (callback: (data: Uint8Array) => void) => void

    private writeFun: (data: Uint8Array) => void
}
