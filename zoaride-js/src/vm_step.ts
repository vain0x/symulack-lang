import { TestSuiteFun } from "./test_types"
import { VmQueue } from "./vm_queue"

export type StepEvent =
    | "STEP_EVENT_CONTINUED"
    | "STEP_EVENT_STOPPED"

type StepState =
    | "STEP_STATE_CONTINUE"
    | "STEP_STATE_PAUSED"
    | "STEP_STATE_STEP_IN"

type ContinueFun = () => void

/**
 * ステップ実行を制御するもの
 */
export class VmStep {
    private state: StepState = "STEP_STATE_CONTINUE"

    private line: number = 0

    private continueFuns: ContinueFun[] = []

    public constructor(
        private readonly queue: VmQueue,
    ) {
    }

    private doContinue() {
        while (true) {
            const f = this.continueFuns.pop()
            if (!f) {
                break
            }
            f()
        }
    }

    private raiseContinuedEvent() {
        this.queue.emit({
            kind: "VM_CONTINUED",
        })
    }

    private raiseStoppedEvent() {
        this.queue.emit({
            kind: "VM_STOPPED",
            line: this.line,
        })
    }

    public continue() {
        if (this.state === "STEP_STATE_CONTINUE") {
            return
        }

        this.state = "STEP_STATE_CONTINUE"

        this.doContinue()
        this.raiseContinuedEvent()
    }

    public pause() {
        if (this.state === "STEP_STATE_PAUSED") {
            return
        }

        this.state = "STEP_STATE_PAUSED"

        this.raiseStoppedEvent()
    }

    public stepIn() {
        this.state = "STEP_STATE_STEP_IN"

        this.doContinue()
    }

    public async next(line: number) {
        this.line = line

        if (this.state !== "STEP_STATE_CONTINUE") {
            await new Promise(resolve => {
                this.continueFuns.push(resolve)

                this.raiseStoppedEvent()
            })
        }
    }

    public async start() {
        const nextMsg = this.queue.listen()

        while (true) {
            const msg = await nextMsg()
            switch (msg.kind) {
                case "VM_CONTINUE":
                    this.continue()
                    continue

                case "VM_PAUSE":
                    this.pause()
                    continue

                case "VM_STEP_IN":
                    this.stepIn()
                    continue

                case "VM_TERMINATE":
                    break

                default:
                    continue
            }
        }
    }
}

export const vmStepTest: TestSuiteFun = ({ test }) => {
    const nextTick = ()=> new Promise(resolve => setTimeout(resolve, 1))

    test("ステップ実行する", async ({ is }) => {
        const queue = new VmQueue()
        const step = new VmStep(queue)

        step.pause()

        let line = 0
        const execute = async () => {
            for (let i = 0; i < 10; i++) {
                await step.next(line)
                line++
            }
        }

        const executionPromise = execute()

        // 実行は止まっている。
        await nextTick()
        is(line, 0)

        // ステップインを指示すると、実行が開始される。
        step.stepIn()
        await nextTick()
        is(line, 1)

        // 実行はまだ止まっている。
        await nextTick()
        is(line, 1)

        // 次のステップインでもう1周進む。
        step.stepIn()
        await nextTick()
        is(line, 2)

        // 実行を再開すると最後まで進む。
        step.continue()

        await executionPromise
        is(line, 10)
    })
}
