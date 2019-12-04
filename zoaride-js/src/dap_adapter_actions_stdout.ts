import { DapAdapterActions, OutputEventBody, StoppedEventBody } from "./dap_adatper_actions_interface"
import { serializeDapEvent } from "./dap_serialize"

/**
 * DapAdapterActions の実装。
 *
 * イベントをシリアライズして標準出力に流す。
 */
export class StdoutDapAdapterActions implements DapAdapterActions {
    private lastSeq: number = 0

    private sendEvent(event: string, body: any) {
        this.lastSeq++
        const seq = this.lastSeq

        process.stdout.write(serializeDapEvent(seq, event, body))
    }

    public sendInitializedEvent(): void {
        this.sendEvent("initialized", null)
    }

    public sendTerminatedEvent(): void {
        this.sendEvent("terminated", null)
    }

    public sendExitedEvent(exitCode: number): void {
        this.sendEvent("exited", { exitCode })
    }

    public sendContinuedEvent(): void {
        this.sendEvent("continued", {})
    }

    public sendStoppedEvent(args: StoppedEventBody): void {
        this.sendEvent("stopped", args)
    }

    public sendOutputEvent(args: OutputEventBody): void {
        this.sendEvent("output", args)
    }
}
