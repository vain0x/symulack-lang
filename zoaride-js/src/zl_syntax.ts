// 構文レベルの型の定義

import {
    Range,
} from "vscode-languageserver-types"

/**
 * 字句解析・構文解析中のエラーの種類
 */
export type ParseErrorKind =
    // 解釈できない文字がある
    | "PE_INVALID_CHAR"
    // ソースコードが途中で終わっている (`1 +` とか)
    | "PE_UNEXPECTED_EOF"
    | "PE_EXPECTED_EXPR"

/**
 * 字句解析・構文解析のエラー
 */
export interface ParseError {
    /**
     * エラーの種類
     */
    kind: ParseErrorKind

    /**
     * エラーの範囲
     */
    range: Range
}

export type SyntaxErrorKind =
    | ParseErrorKind

/**
 * 構文エラー
 */
export interface SyntaxError {
    kind: SyntaxErrorKind
    range: Range
}

/**
 * トークンの種類
 */
export type TokenKind =
    // ソースコードの終端
    | "T_EOF"
    // 解釈できない文字
    | "T_ERROR"
    // 空白
    | "T_SPACE"
    // 識別子
    | "T_IDENT"
    // "++"
    | "T_PLUS_PLUS"

/**
 * トークン (緑)
 *
 * トークンとはソースコード上で意味のあるまとまりの単語や記号のこと。
 * 緑のトークンはソースコードにおける位置情報を持たない。
 * (「緑」は Red Green Tree に由来する。)
 */
export interface GreenToken {
    kind: TokenKind
    text: string
}

/**
 * トークン (赤)
 *
 * 赤のトークンはソースコード上の特定の位置にあるものを表す。
 * 緑のトークンに位置情報を加えたもの。
 */
export interface RedToken extends GreenToken {
    /**
     * ソースコード上のトークンが占める範囲
     */
    range: Range
}

/**
 * 構文木のノードの種類
 */
export type NodeKind =
    // 名前
    | "N_NAME"
    // インクリメント文 (increment statement)
    | "N_INC_STMT"
    // (構文木の根の種類)
    | "N_ROOT"

/**
 * 構文木のノード (緑)
 */
export interface GreenNode {
    kind: NodeKind
    children: GreenElement[]
}

/**
 * 構文木のノード (赤)
 */
export interface RedNode extends GreenNode {
    kind: NodeKind
    redParent: RedNode | null
    redChildren: RedElement[]
}

/**
 * 構文要素 (緑)
 *
 * 構文要素は、トークンまたはノード。
 */
export type GreenElement =
    | {
        type: "L_TOKEN"
        token: GreenToken
    }
    | {
        type: "L_NODE"
        node: GreenNode
    }

/**
 * 構文要素 (赤)
 */
export type RedElement =
    | {
        kind: "L_TOKEN"
        token: RedToken
    }
    | {
        kind: "L_NODE"
        node: RedNode
     }

/**
 * 構文解析の結果として生成されるイベント
 */
export type ParseEvent =
    | {
        kind: "P_START_NODE"
        nodeKind: NodeKind
    }
    | {
        kind: "P_END_NODE"
    }
    | {
        kind: "P_TOKEN"
        count: number
    }

/**
 * trivial な (重要でない) 種類のトークンか？
 */
export const tokenKindIsTrivial = (tokenKind: TokenKind) =>
    tokenKind === "T_ERROR"
    || tokenKind === "T_SPACE"
