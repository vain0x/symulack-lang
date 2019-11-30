import { enableTrace, writeTrace } from "./vm_trace"
import { VmContext } from "./vm_context"
import { VmDebugServer } from "./vm_debug"

// バーチャルマシン (ランタイム) のメイン

let debugPort: number | null = null
let debugServer: VmDebugServer | null = null

const deactivate = () => {
    if (debugServer) {
        debugServer.stop()
        debugServer = null
    }
}

const vmMain = () => {
    enableTrace(process.cwd())

    writeTrace("launching", {
        argv: process.argv.slice(2),
    })

    const argv = process.argv.slice(2)

    if (argv[0].startsWith("--debug-port=")) {
        debugPort = Number.parseInt(argv[0].slice("--debug-port=".length), 10)
        argv.shift()
    }

    // 実行するソースファイルのパス。
    const sourcePath = argv.shift() || ""
    // if (!sourcePath) {
    //     throw new Error("ソースパスが指定されていません。")
    // }

    const v = new VmContext(sourcePath, deactivate)

    if (debugPort) {
        debugServer = new VmDebugServer(debugPort, v)
        debugServer.start()

        writeTrace("debugServer started")
    }

    v.start()
}

vmMain()
