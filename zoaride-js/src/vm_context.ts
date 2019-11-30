// バーチャルマシンの状態管理

type VmValue =
    | {
        kind: "V_NUMBER"
        value: number
    }

type OnExitFn = (exitCode: number) => void

export class VmContext {
    private sourcePath: string

    private globals = new Map<string, VmValue>()

    private onExit: OnExitFn

    public constructor(sourcePath: string, onExit: OnExitFn) {
        this.sourcePath = sourcePath
        this.onExit = onExit

        this.globals.set("n", {
            kind: "V_NUMBER",
            value: 1,
        })
    }

    public start() {
        // setTimeout(() => {
        //     this.end()
        // }, 3000)
    }

    public terminate() {
        this.onExit(0)
    }

    public getGlobals() {
        return this.globals
    }
}
