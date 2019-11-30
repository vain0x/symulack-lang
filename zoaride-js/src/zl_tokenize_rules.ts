// 字句解析の規則を定義する。

import {
    charIsAsciiWhitespace,
    charIsError,
    charIsIdent,
    charIsIdentFirst,
} from "./zl_tokenize_chars"
import { TokenizeContext } from "./zl_tokenize_context"

/**
 * スペースを字句解析する。
 */
const tokenizeSpace = (t: TokenizeContext) => {
    while (charIsAsciiWhitespace(t.next())) {
        t.bump()
    }

    if (t.isDirty()) {
        t.commit("T_SPACE")
    }
}

/**
 * 識別子を字句解析する。
 */
const tokenizeIdent = (t: TokenizeContext) => {
    if (!charIsIdentFirst(t.next())) {
        return
    }

    while (charIsIdent(t.next())) {
        t.bump()
    }

    if (t.isDirty()) {
        t.commit("T_IDENT")
    }
}

/**
 * 約物 (記号) を字句解析する。
 */
const tokenizePun = (t: TokenizeContext) => {
    if (t.eat("++")) {
        t.commit("T_PLUS_PLUS")
    }
}

/**
 * 解釈できない文字を字句解析する。
 */
const tokenizeError = (t: TokenizeContext) => {
    while (!t.atEof() && charIsError(t.next())) {
        t.bump()
    }

    if (t.isDirty()) {
        t.commit("T_ERROR")
    }
}

/**
 * ソースコード全体を字句解析する。
 */
export const tokenizeAll = (text: string) => {
    const t = new TokenizeContext(text)

    while (!t.atEof()) {
        const startIndex = t.currentIndex()

        tokenizeSpace(t)
        tokenizeIdent(t)
        tokenizePun(t)
        tokenizeError(t)

        if (t.currentIndex() === startIndex) {
            throw new Error("字句解析が無限ループしました。")
        }
    }

    return t.finish()
}
