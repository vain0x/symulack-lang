// 抽象構文木 (AST)

import * as assert from "assert"
import { NodeKind, RedElement } from "./zl_syntax"
import { arrayFilterMap, arrayFirst } from "./util_array"

/**
 * 抽象構文木 (Abstract Syntax Tree)
 */
export type Ast =
    | {
        kind: "A_NAME"
        ident: string | null
        red: RedElement
    }
    | {
        kind: "A_INC_STMT"
        left: Ast | null
        red: RedElement
    }
    | {
        kind: "A_SEMI"
        children: Ast[]
        red: RedElement
    }

const nodeIsExpr = (kind: NodeKind) =>
    kind === "N_NAME"

const nodeIsStmt = (kind: NodeKind) =>
    kind === "N_INC_STMT"

const asIdent = (element: RedElement): RedElement | null =>
    element.green.kind === "L_TOKEN" && element.green.token.kind === "T_IDENT"
        ? element
        : null

const asExpr = (element: RedElement): RedElement | null =>
    element.green.kind === "L_NODE" && nodeIsExpr(element.green.node.kind)
        ? element
        : null

const asStmt = (element: RedElement): RedElement | null =>
    element.green.kind === "L_NODE" && nodeIsStmt(element.green.node.kind)
        ? element
        : null

const redElementToChildExprs = (element: RedElement): RedElement[] =>
    arrayFilterMap(element.children, asExpr)

const redElementToChildStmts = (element: RedElement): RedElement[] =>
    arrayFilterMap(element.children, asStmt)

const asTokenText = (element: RedElement | null): string | null =>
    element && element.green.kind === "L_TOKEN" ? element.green.token.text : null

// -----------------------------------------------
// AST 構築
//
// 構文木から情報を抽出して AST を構築する。
// -----------------------------------------------

const genExpr = (element: RedElement | null): Ast | null => {
    if (!element || element.green.kind !== "L_NODE") {
        return null
    }

    switch (element.green.node.kind) {
        case "N_NAME": {
            const ident = asTokenText(arrayFirst(arrayFilterMap(element.children, asIdent)))
            if (ident == null) {
                return null
            }

            return {
                kind: "A_NAME",
                ident,
                red: element,
            }
        }
        default:
            assert.ok(!nodeIsExpr(element.green.node.kind))
            return null
    }
}

const genStmt = (element: RedElement | null): Ast | null => {
    if (!element || element.green.kind !== "L_NODE") {
        return null
    }

    switch (element.green.node.kind) {
        case "N_INC_STMT": {
            const left = genExpr(arrayFirst(redElementToChildExprs(element)))
            if (left === null) {
                return null
            }

            return {
                kind: "A_INC_STMT",
                left,
                red: element,
            }
        }
        default:
            assert.ok(!nodeIsStmt(element.green.node.kind))
            return null
    }
}

/**
 * 構文木から AST を生成する。
 */
export const astGen = (element: RedElement): Ast => {
    assert.equal(element.green.kind === "L_NODE" && element.green.node.kind, "N_ROOT")

    const children = arrayFilterMap(redElementToChildStmts(element), genStmt)
    return {
        kind: "A_SEMI",
        children,
        red: element,
    }
}
