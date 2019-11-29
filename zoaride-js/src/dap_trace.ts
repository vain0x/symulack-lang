// デバッグアダプターのデバッグのためのトレース出力

import * as fs from "fs"
import * as path from "path"

const TRACE_FILE_NAME = "zoaride-debug-log.txt"

/**
 * [開発用] ファイルにログ出力するか？
 *
 * デバッグ版では true、リリース版では false にする。(手動)
 */
let trace_is_enabled = true

let trace_file_path = trace_is_enabled
    ? path.join(__dirname, TRACE_FILE_NAME)
    : TRACE_FILE_NAME

export const getTraceFilePath = () =>
    trace_file_path

/**
 * デバッグ出力を有効化する。
 */
export const enableTrace = (outDir: string) => {
    trace_is_enabled = true
    trace_file_path = path.join(outDir, TRACE_FILE_NAME)
}

/**
 * デバッグ用にログを出力する。
 */
export const writeTrace = (msg: string, data?: unknown) => {
    if (!trace_is_enabled) {
        return
    }

    if (data !== undefined) {
        if (data != null && data instanceof Error) {
            data = data.toString()
        }

        if (typeof data !== "string" || data.includes("\0")) {
            data = JSON.stringify(data, undefined, 2)
        }

        msg += "\ndata: " + data
    }

    msg += "\n\n"

    fs.appendFileSync(trace_file_path, msg)
}
