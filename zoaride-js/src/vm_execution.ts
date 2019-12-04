// バーチャルマシンの実行手順

import { EXIT_SUCCESS } from "./vm_error"
import { VmContext } from "./vm_context"
import { compile } from "./zl_compile"
import { evalAst } from "./vm_eval"
import { writeTrace } from "./util_trace"

export const execute = async (sourceCode: string, vm: VmContext) => {
    const compilationResult = compile(sourceCode)
    if (!compilationResult.success || !compilationResult.ast) {
        writeTrace("コンパイル失敗", compilationResult.errors)
        return vm.fatal("コンパイルエラーが発生しました。")
    }

    writeTrace("コンパイル成功", compilationResult.ast)

    writeTrace("実行開始")
    await evalAst(compilationResult.ast, vm)
    writeTrace("実行終了")

    return vm.terminate(EXIT_SUCCESS)
}
