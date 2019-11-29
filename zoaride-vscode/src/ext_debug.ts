import * as path from "path"
import {
    commands,
    debug,
    ExtensionContext,
} from "vscode"
import { ZOARIDE_LAUNCH_DEBUG } from "./ext_constants"
import { ZoarideDebugConfigurationProvider } from "./ext_debug_config_provider"

const adapterExecutable = (outDir: string) => async () => {
    // DAP プログラムの起動コマンド
    return {
        command: "node",
        args: [
            path.join(outDir, "dap_main.js"),
        ],
    }
}

/**
 * 拡張機能の起動時
 */
export const setUpDebugger = (context: ExtensionContext) => {
    // ./out への絶対パス
    const outDir = context.asAbsolutePath("./out")

    const debugConfigProvider = new ZoarideDebugConfigurationProvider(outDir)
    context.subscriptions.push(
        debug.registerDebugConfigurationProvider(
            ZOARIDE_LAUNCH_DEBUG,
            debugConfigProvider
        ))

    context.subscriptions.push(
        commands.registerCommand(
            "zoaride.adapterExecutableCommand",
            adapterExecutable(outDir),
        ))
}

/**
 * 拡張機能の終了時
 */
export const tearDownDebugger = () => {
    // Pass.
}
