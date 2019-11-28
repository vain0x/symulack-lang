import { TextDecoder, TextEncoder } from "util"
import { TestSuiteFun } from "./test_types"

const MAX_HEADER_COUNT = 3

const decoder = new TextDecoder()

/**
 * クライアントから受信したメッセージを
 * LSP メッセージとしてパースする。
 */
export const parseLspMessage = (data: Uint8Array) => {
    let index = 0
    let contentLength = null as number | null
    let hasBody = false

    const text = decoder.decode(data)

    const lines = text.split("\r\n", MAX_HEADER_COUNT)
    for (const line of lines) {
        index += line.length + "\r\n".length

        if (line === "") {
            hasBody = true
            break
        }

        const [key, value] = line.split(":", 2)
        if (key === "Content-Length") {
            contentLength = +value.trim()
            continue
        }

        if (key === "Content-Type") {
            // 無視
            continue
        }

        console.error("不明なヘッダーをスキップします。")
    }

    if (!hasBody) {
        // ヘッダーをまだ受信しきっていない。
        return null
    }

    if (contentLength === null) {
        throw new Error("WARN: Content-Length がありません")
    }

    if (data.length < index + contentLength) {
        // body をまだ受信しきっていない。
        return null
    }

    const body = decoder.decode(data.slice(index, index + contentLength))
    const rest = data.slice(index + contentLength)

    let msg: any
    try {
        msg = JSON.parse(body)
    } catch (_err) {
        throw new Error("JSON として解釈できません。")
    }

    return { msg, rest }
}

export const lspParseTest: TestSuiteFun = ({ test }) => {
    const encoder = new TextEncoder()

    const table = [
        {
            title: "ぴったりパースできるケース",
            source: `Content-Length: 56\r\nContent-Type: application/vscode-jsonrpc; charset=utf-8\r\n\r\n{"jsonrpc":2.0,"id":1,"method":"shutdown","params":null}`,
            expected: {
                msg: {
                    jsonrpc: 2,
                    id: 1,
                    method: "shutdown",
                    params: null,
                },
                rest: "",
            },
        },
        {
            title: "ボディーを受信しきっていないケース",
            source: `Content-Length: 21\r\n`,
            expected: null,
        },
    ]

    for (const { title, source, expected } of table) {
        test(title, ({ is }) => {
            const data = encoder.encode(source)
            const result = parseLspMessage(data)
            const rest = result ? decoder.decode(result.rest) : null

            is((result ? { ...result, rest } : null), expected)
        })
    }
}
