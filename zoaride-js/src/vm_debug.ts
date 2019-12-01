// デバッグ機能

import { Server, createServer } from "net"
import { EXIT_SUCCESS } from "./vm_error"
import { VmContext } from "./vm_context"
import { VmQueue } from "./vm_queue"
import { promisify } from "util"
import { writeTrace } from "./util_trace"

/**
 * デバッガーにバーチャルマシンの情報を公開するための TCP サーバー
 */
export class VmDebugServer {
    private port: number

    private server: Server

    private vm: VmContext

    public constructor(port: number, vm: VmContext, queue: VmQueue) {
        this.port = port
        this.vm = vm

        this.server = createServer(async socket => {
            socket.on("data", data => {
                const text = data.toString().trim()
                writeTrace("data: " + text)

                if (text === "terminate") {
                    vm.terminate(EXIT_SUCCESS)
                    return
                }
                if (text === "continue") {
                    queue.emit({ kind: "VM_CONTINUE" })
                    socket.write("ok\r\n")
                    return
                }
                if (text === "pause") {
                    queue.emit({ kind: "VM_PAUSE" })
                    socket.write("ok\r\n")
                    return
                }
                if (text === "stepIn") {
                    queue.emit({ kind: "VM_STEP_IN" })
                    socket.write("ok\r\n")
                    return
                }
                if (text === "variables") {
                    const value = JSON.stringify(this.vm.getGlobals().get("n"))
                    socket.write(`${value}\r\n`)
                    return
                }
            })

            socket.on("end", () => {
                writeTrace("disconnected")
            })

            // 起動時に停止する。
            socket.write("stopped:1\r\n")

            const nextMsg = queue.listen()
            while (true) {
                const msg = await nextMsg()

                switch (msg.kind) {
                    case "VM_TERMINATE":
                        socket.write("terminated\r\n")
                        break

                    case "VM_CONTINUED":
                        socket.write("continued\r\n")
                        continue

                    case "VM_STOPPED":
                        socket.write(`stopped:${msg.line}\r\n`)
                        continue

                    case "VM_OUTPUT": {
                        writeTrace("output", msg.output)
                        continue
                    }
                    default:
                        continue
                }
            }
        })
    }

    public async start() {
        await promisify(this.server.listen)(this.port)
        writeTrace("デバッグサーバー起動")
    }

    public async stop() {
        await promisify(this.server.close)()
        writeTrace("デバッグサーバー停止")
    }
}
