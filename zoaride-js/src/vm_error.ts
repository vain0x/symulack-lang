/**
 * プロセスを停止するエラー。
 */
export class ExitError extends Error {
    public constructor(
        public readonly exitCode: number,
    ) {
        super()
    }
}

/**
 * 正常終了時の終了コード
 */
export const EXIT_SUCCESS = 0

/**
 * 異常終了時の終了コード
 */
export const EXIT_FAILURE = 1
