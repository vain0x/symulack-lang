// 字句解析の規則

import {
    charIsIdent,
    charIsIdentFirst,
    charIsNumeric,
    charIsOther,
    charIsSpace,
} from "./zl_tokenize_chars"
import { SIGN_TABLE } from "./zl_syntax"
import { TokenizeContext } from "./zl_tokenize_context"

/**
 * 改行を字句解析する。
 */
const tokenizeEol = (t: TokenizeContext) => {
    if (t.eat("\n")) {
        t.commit("T_EOL")
    }
}

/**
 * スペースを字句解析する。
 */
const tokenizeSpace = (t: TokenizeContext) => {
    if (!charIsSpace(t.next())) {
        return
    }

    while (charIsSpace(t.next())) {
        t.bump()
    }

    t.commit("T_SPACE")
}

/**
 * コメントを字句解析する。
 */
const tokenizeComment = (t: TokenizeContext) => {
    if (t.eat("//")) {
        while (!t.atEof() && t.next() !== "\n") {
            t.bump()
        }

        t.commit("T_COMMENT")
    }
}

/**
 * 数値リテラルを字句解析する。
 */
const tokenizeNumber = (t: TokenizeContext) => {
    if (!charIsNumeric(t.next())) {
        return
    }

    while (charIsNumeric(t.next())) {
        t.bump()
    }

    t.commit("T_NUMBER")
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

    t.commit("T_IDENT")
}

/**
 * 約物を字句解析する。
 */
const tokenizeSign = (t: TokenizeContext) => {
    for (const [kind, word] of SIGN_TABLE) {
        if (t.eat(word)) {
            t.commit(kind)
        }
    }
}

/**
 * 解釈できない文字を字句解析する。
 */
const tokenizeOther = (t: TokenizeContext) => {
    if (t.atEof() || !charIsOther(t.next())) {
        return
    }

    while (!t.atEof() && charIsOther(t.next())) {
        t.bump()
    }

    t.commit("T_OTHER")
}

/**
 * ソースコード全体を字句解析する。
 */
export const tokenizeAll = (text: string) => {
    const t = new TokenizeContext(text)

    while (!t.atEof()) {
        const startIndex = t.currentIndex()

        tokenizeEol(t)
        tokenizeSpace(t)
        tokenizeComment(t)
        tokenizeNumber(t)
        tokenizeIdent(t)
        tokenizeSign(t)
        tokenizeOther(t)

        if (t.currentIndex() === startIndex) {
            throw new Error("字句解析が無限ループしました。")
        }
    }

    return t.finish()
}
