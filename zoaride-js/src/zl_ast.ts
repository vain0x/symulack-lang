// 抽象構文木 (AST)

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

/**
 * 式とみなせるノードか？
 */
const nodeIsExpr = (kind: NodeKind) =>
    kind === "N_NAME"

/**
 * 文とみなせるノードか？
 */
const nodeIsStmt = (kind: NodeKind) =>
    kind === "N_INC_STMT"

// -----------------------------------------------
// RedElement のヘルパー関数
// -----------------------------------------------

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

const toChildExprs = (element: RedElement): RedElement[] =>
    arrayFilterMap(element.children, asExpr)

const toChildStmts = (element: RedElement): RedElement[] =>
    arrayFilterMap(element.children, asStmt)

const toTokenText = (element: RedElement | null): string | null =>
    element && element.green.kind === "L_TOKEN"
        ? element.green.token.text
        : null

// -----------------------------------------------
// AST 構築
//
// 構文木から情報を抽出して AST を構築する。
// -----------------------------------------------

/**
 * ノードから式を表す AST を構築する。
 */
const genExpr = (element: RedElement | null): Ast | null => {
    if (!element || element.green.kind !== "L_NODE" || !nodeIsExpr(element.green.node.kind)) {
        return null
    }

    switch (element.green.node.kind) {
        case "N_NAME": {
            const ident = toTokenText(arrayFirst(arrayFilterMap(element.children, asIdent)))

            return {
                kind: "A_NAME",
                ident,
                red: element,
            }
        }
        default:
            throw new Error("unreachable")
    }
}

/**
 * ノードから文を表す AST を構築する。
 */
const genStmt = (element: RedElement | null): Ast | null => {
    if (!element || element.green.kind !== "L_NODE" || !nodeIsStmt(element.green.node.kind)) {
        return null
    }

    switch (element.green.node.kind) {
        case "N_INC_STMT": {
            const left = genExpr(arrayFirst(toChildExprs(element)))

            return {
                kind: "A_INC_STMT",
                left,
                red: element,
            }
        }
        default:
            throw new Error("unreachable")
    }
}

/**
 * 構文木から AST を生成する。
 */
export const astGen = (element: RedElement): Ast => {
    if (element.green.kind !== "L_NODE" || element.green.node.kind != "N_ROOT") {
        throw new Error("not root")
    }

    const children = arrayFilterMap(toChildStmts(element), genStmt)
    return {
        kind: "A_SEMI",
        children,
        red: element,
    }
}
