import { GreenToken } from "./zl_syntax"
import { tokenizeAll } from "./zl_tokenize_rules"

/**
 * 字句解析を行う。
 */
export const tokenize = (text: string): GreenToken[] => {
    return tokenizeAll(text)
}
