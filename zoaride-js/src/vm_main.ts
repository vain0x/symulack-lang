// バーチャルマシン (ランタイム) のエントリポイント

import * as fs from "fs"
import { EXIT_FAILURE, ExitError } from "./vm_error"
import { enableTrace, writeTrace } from "./util_trace"
import { VmContext } from "./vm_context"
import { VmDebugServer } from "./vm_debug"
import { VmQueue } from "./vm_queue"
import { VmStep } from "./vm_step"
import { execute } from "./vm_execution"

const vmMain = async (): Promise<never> => {
    let debugPort = null as number | null

    let debugServer = null as VmDebugServer | null

    let exitCode = EXIT_FAILURE

    const queue = new VmQueue()

    try {
        enableTrace("vm")

        // コマンドライン引数の解析
        const argv = process.argv.slice(2)

        writeTrace("起動開始", { argv })

        if (argv[0].startsWith("--debug-port=")) {
            debugPort = Number.parseInt(argv[0].slice("--debug-port=".length), 10)
            argv.shift()
        }

        const sourcePath = argv.shift()
        if (!sourcePath) {
            throw new Error("ソースパスが指定されていません。")
        }

        // 実行開始
        const step = new VmStep(queue)
        const vm = new VmContext(step)

        if (debugPort) {
            debugServer = new VmDebugServer(debugPort, vm, queue)
            await debugServer.start()
        }

        const sourceCode = fs.readFileSync(sourcePath).toString()

        // 停止状態で開始する。
        step.pause()

        await Promise.all([
            step.start(),
            execute(sourceCode, vm),
        ])
    } catch (err) {
        if (err != null && err instanceof ExitError) {
            exitCode = err.exitCode
        } else {
            writeTrace("ランタイムエラー", err)
        }
    } finally {
        queue.emit({ kind: "VM_TERMINATE" })

        if (debugServer) {
            await debugServer.stop()
            debugServer = null
        }

        writeTrace("終了", { exitCode })
    }
    return process.exit(exitCode)
}

vmMain()
