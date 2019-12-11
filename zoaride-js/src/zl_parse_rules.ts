// 構文規則の定義

import * as assert from "assert"
import { GreenNode, TokenKind } from "./zl_syntax"
import { ParseContext } from "./zl_parse_context"

/**
 * 原子式の最初のトークンとしてありえるか？
 */
const tokenIsAtomFirst = (t: TokenKind) =>
    t === "T_NUMBER"
    || t === "T_IDENT"
    || t === "T_LEFT_PAREN"

/**
 * 式の最初のトークンとしてありえるか？
 */
const tokenIsExprFirst = (t: TokenKind) =>
    tokenIsAtomFirst(t)

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
        case "T_NUMBER": {
            const node = p.startNode()
            p.bump(node)
            return p.endNode(node, "N_NUMBER")
        }
        case "T_IDENT": {
            const node = p.startNode()
            p.bump(node)
            return p.endNode(node, "N_NAME")
        }
        default:
            throw new Error("unreachable")
    }
}

const parseMul = (p: ParseContext) :GreenNode => {
    assert.ok(tokenIsExprFirst(p.next()))

    let left = parseAtom(p)

    while (true) {
        if (p.next() === "T_STAR") {
            const node = p.startBefore(left)

            p.bump(node)

            if (tokenIsAtomFirst(p.next())) {
                const right = parseAtom(p)
                p.attach(node, right)
            } else {
                p.attachError(node, "PE_EXPECTED_EXPR")
            }

            left = p.endNode(node, "N_MUL")
            continue
        }

        if (p.next() === "T_SLASH") {
            const node = p.startBefore(left)

            p.bump(node)

            if (tokenIsAtomFirst(p.next())) {
                const right = parseAtom(p)
                p.attach(node, right)
            } else {
                p.attachError(node, "PE_EXPECTED_EXPR")
            }

            left = p.endNode(node, "N_DIV")
            continue
        }

        if (p.next() === "T_PERCENT") {
            const node = p.startBefore(left)

            p.bump(node)

            if (tokenIsAtomFirst(p.next())) {
                const right = parseAtom(p)
                p.attach(node, right)
            } else {
                p.attachError(node, "PE_EXPECTED_EXPR")
            }

            left = p.endNode(node, "N_MOD")
            continue
        }

        break
    }

    return left
}

const parseAdd = (p: ParseContext): GreenNode => {
    let left = parseMul(p)

    while (true) {
        if (p.next() === "T_PLUS") {
            const node = p.startBefore(left)

            p.bump(node)

            if (tokenIsExprFirst(p.next())) {
                const right = parseMul(p)
                p.attach(node, right)
            } else {
                p.attachError(node, "PE_EXPECTED_EXPR")
            }

            left = p.endNode(node, "N_ADD")
            continue
        }

        if (p.next() === "T_MINUS") {
            const node = p.startBefore(left)

            p.bump(node)

            if (tokenIsExprFirst(p.next())) {
                const right = parseMul(p)
                p.attach(node, right)
            } else {
                p.attachError(node, "PE_EXPECTED_EXPR")
            }

            left = p.endNode(node, "N_SUB")
            continue
        }

        break
    }

    return left
}

/**
 * 式をパースする。
 */
const parseExpr = (p: ParseContext): GreenNode => {
    assert.ok(tokenIsExprFirst(p.next()))
    return parseAdd(p)
}

/**
 * 文をパースする。
 */
const parseStmt = (p: ParseContext): GreenNode => {
    assert.ok(tokenIsStmtFirst(p.next()))

    // 式文
    const expr = parseExpr(p)
    const node = p.startBefore(expr)
    return p.endNode(node, "N_EXPR_STMT")
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
