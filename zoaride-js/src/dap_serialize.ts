// DAP メッセージの文字列化

import { Response } from "vscode-debugadapter"
import { TextEncoder } from "util"

const encoder = new TextEncoder()

const serialize = (obj: any) => {
    // デバッグ用に見やすいフォーマットで文字列化する。
    const body = JSON.stringify(obj, undefined, 2) + "\r\n"

    const bodyUtf8 = encoder.encode(body)
    const contentLength = bodyUtf8.length

    const headerUtf8 = encoder.encode(`Content-Length: ${contentLength}\r\n\r\n`)
    return Buffer.concat([headerUtf8, bodyUtf8])
}

export const serializeDapRequest = (seq: number, command: string, args?: unknown): Uint8Array =>
    serialize({ seq, type: "request", command, arugments: args })

export const serializeDapEvent = (seq: number, event: string, body?: unknown): Uint8Array =>
    serialize({ seq, type: "event", event, body })

export const serializeDapResponse = (response: Response): Uint8Array =>
    serialize({
        ...response,
        type: "response",
    })
