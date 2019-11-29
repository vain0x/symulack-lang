// VSCode 拡張機能のエントリーポイント

import {
    ExtensionContext,
    workspace,
} from "vscode"
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
} from "vscode-languageclient"
import { setUpDebugger, tearDownDebugger } from "./ext_debug"

let client: LanguageClient

const startLspClient = (context: ExtensionContext) => {
    // LSP サーバーの起動コマンド
    let serverOptions: ServerOptions = {
        command: "node",
        args: [
            context.asAbsolutePath("./out/lsp_main.js")
        ],
    }

    let clientOptions: LanguageClientOptions = {
        documentSelector: [
            // ゾアライド言語のファイルが開かれたら LSP を起動するという設定
            {
                scheme: "file",
                language: "zoaride",
            },
        ],
        synchronize: {
            fileEvents: workspace.createFileSystemWatcher("**/.clientrc"),
        },
    }

    // LSP クライアントとサーバーを起動する。
    const client = new LanguageClient(
        "zoaride",
        "zoaride lsp",
        serverOptions,
        clientOptions
    )
    client.start()

    return client
}

/**
 * 拡張機能が開始したとき
 */
export const activate = (context: ExtensionContext) => {
    setUpDebugger(context)

    client = startLspClient(context)
}

/**
 * 拡張機能が停止するとき
 */
export const deactivate = (): Thenable<void> | undefined => {
    tearDownDebugger()

    if (client) {
        return client.stop()
    }
}
