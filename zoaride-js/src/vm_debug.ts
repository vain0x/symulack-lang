// デバッガーに情報を公開するサーバー

import { Server, createServer } from "net"
import { VmContext } from "./vm_context"
import { writeTrace } from "./util_trace"

export class VmDebugServer {
    private port: number
    private server: Server
    private v: VmContext

    public constructor(port: number, v: VmContext) {
        this.port = port
        this.v = v

        this.server = createServer(socket => {
            socket.on("data", data => {
                const text = data.toString().trim()
                writeTrace("data: " + text)

                if (text === "pause") {
                    socket.write("ok\r\n")
                    return
                }
                if (text === "variables") {
                    const value = this.v.getGlobals().get("n")!.value
                    socket.write(`${value}\r\n`)
                    return
                }
                if (text === "terminate") {
                    v.terminate()
                    return
                }
            })
            socket.on("end", () => {
                writeTrace("disconnected")
            })

            setTimeout(() => {
                socket.write("stopped\r\n")
            }, 1000)
        })
    }

    public start() {
        this.server.listen(this.port, "0.0.0.0", () => {
            writeTrace("listening")
        })
    }

    public stop() {
        writeTrace("debugServer closing")
        this.server.close()
    }
}
