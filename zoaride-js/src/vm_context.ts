import { EXIT_FAILURE, ExitError } from "./vm_error"
import { RedElement } from "./zl_syntax"
import { VmStep } from "./vm_step"
import { VmValue } from "./vm_value"
import { writeTrace } from "./util_trace"

/**
 * バーチャルマシンの状態を管理するもの
 */
export class VmContext {
    private globals = new Map<string, VmValue>()

    public constructor(
        public readonly step: VmStep,
    ) {
    }

    public terminate(exitCode: number): never {
        throw new ExitError(exitCode)
    }

    public fatal(msg: string, data?: unknown): never {
        writeTrace("FATAL: " + msg, data)
        throw new ExitError(EXIT_FAILURE)
    }

    /**
     * ステップ実行中なら実行を中断して、次にステップインや再開ボタンが押されるまで待つ。
     */
    public async debug(element: RedElement): Promise<void> {
        const currentLine = element.range.start.line
        return await this.step.next(currentLine)
    }

    public getGlobals() {
        return this.globals
    }
}
