// デバッグ用のログ出力ライブラリ

import * as fs from "fs"
import * as path from "path"

let currentName: string | null = null

const getCurrentFilePath = () => {
    if (!currentName) {
        return null
    }

    let dir = __dirname
    for (let i = 0; i < 4; i++) {
        if (path.basename(dir) !== "zoaride-lang") {
            dir = path.dirname(dir)
        }
    }

    return path.join(dir, `zoaride-js/trace.log`)
}

const getCurrentTimestamp = () =>
    new Date()
        .toISOString()
        .replace("T", " ")
        .substr(0, "yyyy-MM-dd HH:mm:ss".length)

const serializeData = (data: unknown) => {
    // 例外オブジェクト
    if (data != null && data instanceof Error) {
        return data.toString()
    }

    // バイナリではない文字列
    if (typeof data === "string" && !data.includes("\0")) {
        return data
    }

    try {
        return JSON.stringify(data, undefined, 2)
    } catch (_err) {
        return String(data)
    }
}

const buildMessage = (msg: string, data: unknown) => {
    const timestamp = getCurrentTimestamp()

    if (data !== undefined) {
        msg += "\ndata: " + serializeData(data)
    }

    return `[${timestamp}] [TRACE] ${currentName} - ${msg}\r\n\r\n`
}

/**
 * デバッグログの出力を有効化する。
 */
export const enableTrace = (name: string) => {
    currentName = name
}

/**
 * デバッグ用にログを出力する。
 */
export const writeTrace = (msg: string, data?: unknown) => {
    const filePath = getCurrentFilePath()
    if (!filePath) {
        // ログ出力が有効化されていない。
        return
    }

    fs.appendFileSync(filePath, buildMessage(msg, data))
}
