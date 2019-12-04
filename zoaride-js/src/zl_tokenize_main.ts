import { tokenizeAll } from "./zl_tokenize_rules"

/**
 * 字句解析を行う。
 */
export const tokenize = (text: string) => {
    return tokenizeAll(text)
}
