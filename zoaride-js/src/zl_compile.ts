// コンパイル機能

import { Ast, astGen } from "./zl_ast"
import { redElementNewRoot, redElementToErrors } from "./zl_syntax_red"
import { ParseError } from "./zl_syntax"
import { parse } from "./zl_parse_main"
import { tokenize } from "./zl_tokenize_main"

interface CompilationResult {
    success: boolean,
    ast: Ast | null,
    errors: ParseError[],
}

/**
 * ソースコードをコンパイルする。
 */
export const compile = (sourceCode: string): CompilationResult => {
    const tokens = tokenize(sourceCode)
    const greenRoot = parse(tokens)
    const redRoot = redElementNewRoot(greenRoot)

    const errors = redElementToErrors(redRoot)
    if (errors.length >= 1) {
        return {
            success: false,
            ast: null,
            errors,
        }
    }

    const astRoot = astGen(redRoot)
    return {
        success: true,
        ast: astRoot,
        errors: [],
    }
}
