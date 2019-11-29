// 拡張機能の LSP に関する部分

import {
    ExtensionContext,
    workspace,
} from "vscode"
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
} from "vscode-languageclient"
import { ZOARIDE_LANGUAGE_ID } from "./ext_constants"

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
                language: ZOARIDE_LANGUAGE_ID,
            },
        ],
        synchronize: {
            fileEvents: workspace.createFileSystemWatcher("**/.clientrc"),
        },
    }

    // LSP クライアントとサーバーを起動する。
    const client = new LanguageClient(
        ZOARIDE_LANGUAGE_ID,
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
export const setUpLsp = (context: ExtensionContext) => {
    client = startLspClient(context)
}

/**
 * 拡張機能が停止するとき
 */
export const tearDownLsp = (): Thenable<void> | undefined => {
    if (client) {
        return client.stop()
    }
}
