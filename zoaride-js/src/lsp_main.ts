import { LspServerSender, ZoarideLspServer } from "./lsp_server"
import { serializeNotify, serializeRequest, serializeResponse } from "./lsp_serialize"
import { TextDecoder } from "util"
import { parseLspMessage } from "./lsp_parse"

const decoder = new TextDecoder()

const sendMessage = (data: Uint8Array) => {
    // デバッグ用
    console.error(decoder.decode(data))

    process.stdout.write(data)
}

const lspServerSender: LspServerSender = {
    publishDiagnostics: params => {
        sendMessage(serializeNotify("textDocument/publishDiagnostics", params))
    },
}

/**
 * LSP クライアントから標準入力に渡されるメッセージを受け取り、
 * メッセージが来たらサーバーに通知する。
 */
const listen = (server: ZoarideLspServer) => {
    let buffer = new Uint8Array()

    process.stdin.on("data", (data: Buffer) => {
        buffer = Buffer.concat([buffer, data])

        const { msg, rest } = parseLspMessage(buffer)
        buffer = rest

        if (!msg) {
            return
        }

        const { method, id, params } = msg

        switch (method) {
            case "initialize": {
                const result = server.initialize(params)
                sendMessage(serializeResponse(id, result))
                return
            }
            case "initialized": {
                server.initialized(params)
                return
            }
            case "exit": {
                server.exit()
                return
            }
            case "shutown": {
                server.shutdown()
                sendMessage(serializeResponse(id, null))
                return
            }
            case "textDocument/didOpen": {
                server.textDocumentDidOpen(params)
                return
            }
            case "textDocument/didChange": {
                server.textDocumentDidChange(params)
                return
            }
            case "textDocument/didClose": {
                server.textDocumentDidClose(params)
                return
            }
            default: {
                console.error("WARN: 不明なメッセージ " + method)
                return
            }
        }
    })
}

const lspMain = () => {
    listen(new ZoarideLspServer(lspServerSender))
}

lspMain()
