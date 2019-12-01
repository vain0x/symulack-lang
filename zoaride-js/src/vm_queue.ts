import { TestSuiteFun } from "./test_types"

export type VmMsg =
    | {
        kind: "VM_TERMINATE"
    }
    | {
        kind: "VM_CONTINUED"
    }
    | {
        kind: "VM_STOPPED"
        line: number
    }
    | {
        kind: "VM_CONTINUE"
    }
    | {
        kind: "VM_PAUSE"
    }
    | {
        kind: "VM_STEP_IN"
    }
    | {
        kind: "VM_OUTPUT"
        output: string
    }

type ResolveFun = () => void

export class VmQueue {
    private readonly allMsg: VmMsg[] = []

    private readonly listeners: {
        queue: VmMsg[],
        next: ResolveFun | null,
    }[] = []

    public emit(msg: VmMsg) {
        this.allMsg.push(msg)

        for (const listener of this.listeners) {
            listener.queue.push(msg)

            const next = listener.next
            if (next) {
                next()
            }
        }
    }

    public listen() {
        const id = this.listeners.length

        this.listeners.push({
            queue: this.allMsg.slice(),
            next: null,
        })

        const poll = async (): Promise<VmMsg> => {
            const msg = this.listeners[id].queue.shift()
            if (msg) {
                return msg
            }

            return await new Promise<VmMsg>(resolve => {
                this.listeners[id].next = resolve
            })
        }

        return poll
    }
}

export const vmQueueTest: TestSuiteFun = ({ test }) => {
    const nextTick = () => new Promise(resolve => setTimeout(resolve, 1))

    test("メッセージを受け取る", async ({ is }) => {
        const queue = new VmQueue()
        const events = queue.listen()

        queue.emit({ kind: "VM_TERMINATE" })
        const nextMsg = await events()

        is(nextMsg.kind, "VM_TERMINATE")
    })

    test("メッセージがないときは resolve されない", async ({ is }) => {
        const queue = new VmQueue()
        const events = queue.listen()

        const ok = await Promise.race([
            events().then(() => false),
            nextTick().then(() => true),
        ])

        is(ok, true)
    })

    test("複数のリスナーが同じメッセージを受け取る", async ({ is }) => {
        const queue = new VmQueue()
        const first = queue.listen()
        const second = queue.listen()

        const msg: VmMsg = { kind: "VM_TERMINATE" }

        queue.emit(msg)

        is(await first(), msg)
        is(await second(), msg)
    })

    test("後から来たリスナーも同じメッセージを受け取る", async ({ is }) => {
        const queue = new VmQueue()
        const msg: VmMsg = { kind: "VM_TERMINATE" }

        queue.emit(msg)

        const events = queue.listen()
        is(await events(), msg)
    })

    test("複数のメッセージを受け取る", async ({ is }) => {
        const queue = new VmQueue()
        const events = queue.listen()

        queue.emit({ kind: "VM_STOPPED", line: 1 })
        queue.emit({ kind: "VM_STOPPED", line: 2 })

        is(await events(), { kind: "VM_STOPPED", line: 1 })
        is(await events(), { kind: "VM_STOPPED", line: 2 })
    })
}
