// 構文規則の定義

import * as assert from "assert"
import { GreenNode, TokenKind } from "./zl_syntax"
import { ParseContext } from "./zl_parse_context"

/**
 * 原子式の最初のトークンとしてありえるか？
 */
const tokenIsAtomFirst = (t: TokenKind) =>
    t === "T_IDENT"

/**
 * 文の最初のトークンとしてありえるか？
 */
const tokenIsStmtFirst = (t: TokenKind) =>
    tokenIsAtomFirst(t)

/**
 * 原子式をパースする。
 *
 * ここでは識別子や数値リテラル、カッコで囲まれた式など、
 * 演算子の優先順位の影響を受けない種類の式を原子式と呼んでいる。
 */
const parseAtom = (p: ParseContext): GreenNode => {
    assert.ok(tokenIsAtomFirst(p.next()))

    switch (p.next()) {
        case "T_IDENT": {
            const node = p.startNode()
            p.bump(node)
            return p.endNode(node, "N_NAME")
        }
        default:
            throw new Error("unreachable")
    }
}

/**
 * 文をパースする。
 */
const parseStmt = (p: ParseContext): GreenNode => {
    assert.ok(tokenIsStmtFirst(p.next()))

    const atom = parseAtom(p)

    // インクリメント文
    if (p.next() === "T_PLUS_PLUS") {
        const node = p.startBefore(atom)
        p.bump(node)
        return p.endNode(node, "N_INC_STMT")
    }

    // 式文
    return atom
}

/**
 * ソースファイルの全体をパースする。
 */
export const parseRoot = (p: ParseContext): GreenNode => {
    const node = p.startNode()

    while (!p.atEof()) {
        // エラー処理:
        //      文でないトークンが文頭の位置にあるなら、エラーを報告し、
        //      正常な状態に戻るまで (文頭になりうるトークンが現れるまで) スキップする。
        if (!tokenIsStmtFirst(p.next())) {
            p.bump(node)
            p.attachError(node, "PE_EXPECTED_EXPR")

            while (!p.atEof() && !tokenIsStmtFirst(p.next())) {
                p.bump(node)
            }
            continue
        }

        p.attach(node, parseStmt(p))
    }

    return p.endNode(node, "N_ROOT")
}
