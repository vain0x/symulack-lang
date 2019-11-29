import { ExtensionContext } from "vscode"
import { setUpDebugger, tearDownDebugger } from "./ext_debug"
import { setUpLsp, tearDownLsp } from "./ext_lsp"

// VSCode 拡張機能のエントリーポイント

/**
 * 拡張機能が開始したとき
 */
export const activate = (context: ExtensionContext) => {
    setUpDebugger(context)
    setUpLsp(context)
}

/**
 * 拡張機能が停止するとき
 */
export const deactivate = (): Thenable<void> | undefined => {
    tearDownDebugger()
    return tearDownLsp()
}
