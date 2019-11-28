import { LspServerSender, ZoarideLspServer } from "./lsp_server"
import { parseLspMessage } from "./lsp_parse"
import { serializeLspMessage } from "./lsp_serialize"

const sendLspMessage = (obj: any) => {
    console.error(serializeLspMessage(obj))
    process.stdout.write(serializeLspMessage(obj))
}

const sendRequest = (id: number, method: string, params: any) => {
    sendLspMessage({ id, method, params })
}

const sendResponse = (id: number, result: any) => {
    sendLspMessage({ id, result })
}

const sendNotify = (method: string, params: any) => {
    sendLspMessage({ method, params })
}

const lspServerSender: LspServerSender = {
    publishDiagnostics: params => {
        sendNotify("textDocument/publishDiagnostics", params)
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

        const result = parseLspMessage(buffer)
        if (!result) {
            return
        }

        const { msg, rest } = result
        buffer = rest

        const { method, id, params } = msg

        switch (method) {
            case "initialize": {
                const result = server.initialize(params)
                sendResponse(id, result)
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
                sendResponse(id, result)
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
                console.error("WARN: unknown method " + method)
                return
            }
        }
    })
}

const lspMain = () => {
    listen(new ZoarideLspServer(lspServerSender))
}

lspMain()
