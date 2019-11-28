import { TextEncoder } from "util"

const encoder = new TextEncoder()

export const serializeLspMessage = (obj: any) => {
    // デバッグ用に見やすいフォーマットで文字列化する。
    const body = JSON.stringify({ jsonrpc: "2.0", ...obj }, undefined, 2) + "\r\n"

    const bodyUtf8 = encoder.encode(body)
    const contentLength = bodyUtf8.length

    const headerUtf8 = encoder.encode(`Content-Length: ${contentLength}\r\n\r\n`)
    return Buffer.concat([headerUtf8, bodyUtf8])
}
