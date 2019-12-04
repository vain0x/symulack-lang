// DAP メッセージ文字列の解析
// LSP と同じ

import * as assert from "assert"
import { TextDecoder, TextEncoder } from "util"
import { TestSuiteFun } from "./test_types"

interface DapMessageParseResult {
    msg: any | null
    rest: Uint8Array
}

const CHAR_TAB = '\t'.charCodeAt(0)
const CHAR_SPACE = ' '.charCodeAt(0)
const CHAR_COLON = ':'.charCodeAt(0)
const CHAR_CR = '\r'.charCodeAt(0)
const CHAR_LF = '\n'.charCodeAt(0)

const decoder = new TextDecoder()

const byteIsAsciiWhitespace = (byte: number) =>
    byte === CHAR_TAB || byte == CHAR_SPACE

const skipSpaces = (data: Uint8Array, startIndex: number) => {
    let i = startIndex
    while (i < data.length && byteIsAsciiWhitespace(data[i])) {
        i++
    }
    return i
}

const findByte = (data: Uint8Array, startIndex: number, theByte: number) => {
    let i = startIndex
    while (i < data.length && data[i] !== theByte) {
        i++
    }
    return i
}

/**
 * クライアントから受信したメッセージを
 * DAP メッセージとしてパースする。
 */
export const parseDapMessage = (data: Uint8Array): DapMessageParseResult => {
    let index = 0
    let contentLength: number | null = null
    let hasBody = false

    while (index < data.length) {
        const keyStart = skipSpaces(data, index)
        const keyEnd = Math.min(
            findByte(data, keyStart, CHAR_COLON),
            findByte(data, keyStart, CHAR_CR),
        )

        assert.ok(0 <= index)
        assert.ok(index <= keyStart)
        assert.ok(keyStart <= keyEnd)
        assert.ok(keyEnd <= data.length)

        // ボディー直前の \r\n のとき
        if (keyStart === keyEnd) {
            hasBody = true
            index = Math.min(keyEnd + "\r\n".length, data.length)
            break
        }

        // ':' の前で切れているとき
        if (keyEnd === data.length || data[keyEnd] === CHAR_CR) {
            break
        }
        assert.ok(data[keyEnd] === CHAR_COLON)

        const valueStart = skipSpaces(data, keyEnd + 1)
        const valueEnd = findByte(data, valueStart, CHAR_CR)

        assert.ok(keyEnd <= valueStart)
        assert.ok(valueStart <= valueEnd)
        assert.ok(valueEnd <= data.length)

        // CR の前で切れているとき
        if (valueEnd === data.length) {
            break
        }
        assert.ok(data[valueEnd] === CHAR_CR && data[valueEnd + 1] === CHAR_LF)

        // ヘッダーの解釈ができる。
        const key = decoder.decode(data.slice(keyStart, keyEnd))
        const value = decoder.decode(data.slice(valueStart, valueEnd))

        index = Math.min(valueEnd + "\r\n".length, data.length)

        switch (key) {
            case "Content-Length":
                contentLength = Number.parseInt(value.trim(), 10)
                assert.ok(Number.isSafeInteger(contentLength))
                continue

            default:
                console.error(`WARN: 不明なヘッダーをスキップします。(${key})`)
                continue
        }
    }

    if (!hasBody) {
        // ヘッダーをまだ受信しきっていない。
        return { msg: null, rest: data }
    }

    if (contentLength === null) {
        throw new Error("Content-Length がありません。")
    }

    if (data.length < index + contentLength) {
        // ボディーをまだ受信しきっていない。
        return { msg: null, rest: data }
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

export const dapParseTest: TestSuiteFun = ({ test }) => {
    const encoder = new TextEncoder()

    test("空の入力をパースする", ({ is }) => {
        const data = encoder.encode("")

        const { msg, rest } = parseDapMessage(data)
        is(msg, null)
        is(rest, data)
    })

    test("ヘッダーが途中で切れている入力をパースする", ({ is }) => {
        const data = encoder.encode("Content-Length")

        const { msg, rest } = parseDapMessage(data)
        is(msg, null)
        is(rest, data)
    })

    test("ボディーが途中で切れている入力をパースする", ({ is }) => {
        const data = encoder.encode("Content-Length: 1000\r\n{ ...")

        const { msg, rest } = parseDapMessage(data)
        is(msg, null)
        is(rest, data)
    })

    test("ぴったりの入力をパースする", ({ is }) => {
        let text = `Content-Length: 119

{
    "seq": 153,
    "type": "request",
    "command": "next",
    "arguments": {
        "threadId": 3
    }
}`

        text = text.split(/\r\n|\n/).join("\r\n")
        const data = encoder.encode(text)

        const { msg, rest } = parseDapMessage(data)
        is(msg, {
            seq: 153,
            type: "request",
            command: "next",
            arguments: {
                threadId: 3,
            },
        })
        is(rest.length, 0)
    })

    test("Unicode 文字列を含むメッセージをパースする", ({ is }) => {
        let text = `Content-Length: 77

{
    "seq": 1,
    "type": "event",
    "body": { "output": "你好" }
}`

        text = text.split(/\r\n|\n/).join("\r\n")
        const data = encoder.encode(text)

        const { msg, rest } = parseDapMessage(data)

        is(msg, {
            seq: 1,
            type: "event",
            body: {
                output: "你好",
            },
        })
        is(rest.length, 0)
    })

    test("複数のメッセージが含まれる入力をパースする", ({ is }) => {
        let text = `Content-Length: 121

{
    "seq": 153,
    "type": "request",
    "command": "next",
    "arguments": {
        "threadId": 3
    }
}
Content-Length: 119

{
    "seq": 154,
    "type": "request",
    "command": "next",
    "arguments": {
        "threadId": 3
    }
}`

        text = text.split(/\r\n|\n/).join("\r\n")
        let data = encoder.encode(text)

        {
            const { msg, rest } = parseDapMessage(data)
            is(msg, {
                seq: 153,
                type: "request",
                command: "next",
                arguments: {
                    threadId: 3,
                },
            })
            is(rest.length < data.length, true)

            data = rest
        }

        {
            const { msg, rest } = parseDapMessage(data)
            is(msg, {
                seq: 154,
                type: "request",
                command: "next",
                arguments: {
                    threadId: 3,
                },
            })
            is(rest.length, 0)
        }
    })
}
