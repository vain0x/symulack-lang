// プログラムの動作の定義

import { VALUE_ZERO, VmValue } from "./vm_value"
import { Ast } from "./zl_ast"
import { TestSuiteFun } from "./test_types"
import { VmContext } from "./vm_context"
import { VmQueue } from "./vm_queue"
import { VmStep } from "./vm_step"
import { never } from "./util_never"

const MAX_DEREFERENCE_COUNT = 100

/**
 * グローバル変数への参照を作る。変数がなければ作る。
 */
const touchGlobal = (ident: string, vm: VmContext): VmValue => {
    if (!vm.getGlobals().has(ident)) {
        vm.getGlobals().set(ident, VALUE_ZERO)
    }

    return {
        kind: "V_REF",
        ident,
    }
}

/**
 * 変数への参照から値を取り出し、参照でない値に変換する。
 */
const dereference = (value: VmValue, vm: VmContext): VmValue => {
    for (let i = 0; i < MAX_DEREFERENCE_COUNT; i++) {
        if (value.kind !== "V_REF") {
            return value
        }

        value = vm.getGlobals().get(value.ident)!
    }

    return vm.fatal("循環参照？", value)
}

export const evalAst = async (ast: Ast, vm: VmContext): Promise<VmValue> => {
    switch (ast.kind) {
        case "A_NAME": {
            return touchGlobal(ast.ident, vm)

        }
        case "A_INC_STMT": {
            // 文頭で停止
            await vm.debug(ast.red)

            const value = await evalAst(ast.left, vm)

            if (value.kind !== "V_REF") {
                return vm.fatal("変数が必要です。", ast)
            }

            const oldValue = dereference(value, vm)
            if (oldValue.kind !== "V_NUMBER") {
                return vm.fatal("変数は整数型でなければいけません。", oldValue)
            }

            const newValue: VmValue = {
                kind: "V_NUMBER",
                value: oldValue.value + 1,
            }

            vm.getGlobals().set(value.ident, newValue)
            return value
        }
        case "A_SEMI": {
            for (const child of ast.children) {
                await evalAst(child, vm)
            }
            return VALUE_ZERO
        }
        default:
            return never(ast)
    }
}

export const vmEvalTest: TestSuiteFun = ({ test }) => {
    test("変数をインクリメントする", ({ is }) => {
        const queue = new VmQueue()
        const step = new VmStep(queue)
        const vm = new VmContext(step)
    })
}
