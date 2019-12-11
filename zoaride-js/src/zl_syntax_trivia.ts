// 構文トリビア
// ここではあまり意味のないトークンをトリビアと呼んでいる。

import * as assert from "assert"
import { GreenToken, TokenKind } from "./zl_syntax"

export const tokenIsTrivia = (kind: TokenKind) =>
    kind === "T_EOL"
    || kind === "T_SPACE"
    || kind === "T_COMMENT"
    || kind === "T_OTHER"

export const tokenIsTrailingTrivia = (kind: TokenKind) =>
    tokenIsTrivia(kind) && kind !== "T_EOL"

/**
 * トークン列上のトリビアを飛ばして読むための索引を作成する。
 */
export const createNonTriviaIndexes = (tokens: GreenToken[]): number[] => {
    assert.ok(tokens.length >= 1)
    assert.equal(tokens[tokens.length - 1].kind, "T_EOF")

    const nonTriviaIndexes: number[] = []

    let next = tokens.length - 1

    for (let i = tokens.length; i >= 1; ) {
        i--

        if (!tokenIsTrivia(tokens[i].kind)) {
            next = i
        }

        nonTriviaIndexes[i] = next
    }

    return nonTriviaIndexes
}
