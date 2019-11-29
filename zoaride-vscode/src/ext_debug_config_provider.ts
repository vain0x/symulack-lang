import {
    CancellationToken,
    DebugConfiguration,
    DebugConfigurationProvider,
    ProviderResult,
    WorkspaceFolder,
    window,
} from "vscode"
import { ZOARIDE_LANGUAGE_ID, ZOARIDE_LAUNCH_DEBUG } from "./ext_constants"

/**
 * デバッガーの設定を構成する。
 *
 * ここでの設定が "launch" リスエストに渡される。
 */
const doResolveDebugConfiguration = async (config: DebugConfiguration, outDir: string) => {
    // launch.json ファイルがないか、デバッグ構成がないとき
    if (!config.type && !config.request) {
        const editor = window.activeTextEditor
        if (editor && editor.document.languageId === ZOARIDE_LANGUAGE_ID) {
            config.type = ZOARIDE_LAUNCH_DEBUG
            config.request = "launch"
            config.name = "ゾアライド デバッグ実行"
        }
    }

    if (!config.program) {
        const editor = window.activeTextEditor
        if (editor && editor.document.languageId === ZOARIDE_LANGUAGE_ID) {
            config.program = editor.document.fileName
        }
    }

    if (!config.type || !config.request || !config.program) {
        window.showWarningMessage("zoaride でデバッグ可能なファイルではありません。")
        return null
    }


    config.outDir = outDir
    return config
}

export class ZoarideDebugConfigurationProvider implements DebugConfigurationProvider {
    private outDir: string

    public constructor(outDir:string) {
        this.outDir = outDir
    }

    public resolveDebugConfiguration(
        _folder: WorkspaceFolder | undefined,
        config: DebugConfiguration,
        _token?: CancellationToken
    ): ProviderResult<DebugConfiguration> {
        return doResolveDebugConfiguration(config, this.outDir)
    }
}
