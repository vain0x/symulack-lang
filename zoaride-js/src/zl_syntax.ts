// 構文関連の型定義

import {
    Range,
} from "vscode-languageserver-types"

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
 * 構文要素 (緑)
 *
 * 構文要素は、トークンまたはノード。
 */
export type GreenElement =
    | {
        kind: "L_TOKEN"
        token: GreenToken
    }
    | {
        kind: "L_NODE"
        node: GreenNode
    }
    | {
        kind: "L_ERROR"
        errorKind: ParseErrorKind
    }

/**
 * 構文要素 (赤)
 *
 * 構文要素 (緑) に加えて、親子関係や位置情報を持つ。
 */
export interface RedElement {
    /**
     * 基になる構文要素 (緑)
     */
    green: GreenElement

    /**
     * 子要素のリスト
     */
    children: RedElement[]

    /**
     * ソースコード上の範囲
     */
    range: Range

    /**
     * 親要素
     *
     * ルートノードなら null。
     */
    parent: RedElement | null

    /**
     * この要素が親の何番目の子要素か？
     */
    siblingnIndex: number
}

/**
 * 字句解析・構文解析中のエラーの種類
 */
export type ParseErrorKind =
    // 解釈できない文字がある。
    | "PE_INVALID_CHAR"
    // ソースコードが途中で終わっている。(`1 +` など)
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

/**
 * trivial な (重要でない) 種類のトークンか？
 */
export const tokenIsTrivial = (tokenKind: TokenKind) =>
    tokenKind === "T_ERROR"
    || tokenKind === "T_SPACE"
