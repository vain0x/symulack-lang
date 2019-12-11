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
    // 改行
    | "T_EOL"
    // スペース
    | "T_SPACE"
    // コメント
    | "T_COMMENT"
    // 数値リテラル
    | "T_NUMBER"
    // 識別子
    | "T_IDENT"

    // カッコ

    // "("
    | "T_LEFT_PAREN"
    // ")"
    | "T_RIGHT_PAREN"
    // "<"
    | "T_LEFT_ANGLE"
    // ">"
    | "T_RIGHT_ANGLE"
    // "["
    | "T_LEFT_BRACKET"
    // "]"
    | "T_RIGHT_BRACKET"
    // "{"
    | "T_LEFT_BRACE"
    // "}"
    | "T_RIGHT_BRACE"

    // 約物類
    // "+=" のような複数文字の記号は構文解析の段階で連結する。

    // "&"
    | "T_AND"
    // "@"
    | "T_AT"
    // "\"
    | "T_BACKSLASH"
    // "`"
    | "T_BACKTICK"
    // "!"
    | "T_BANG"
    // ":"
    | "T_COLON"
    // ","
    | "T_COMMA"
    // "."
    | "T_DOT"
    // "$"
    | "T_DOLLAR"
    // '"'
    | "T_DOUBLE_QUOTE"
    // "^"
    | "T_HAT"
    // "="
    | "T_EQUAL"
    // "#"
    | "T_HASH"
    // "-"
    | "T_MINUS"
    // "%"
    | "T_PERCENT"
    // "|"
    | "T_PIPE"
    // "+"
    | "T_PLUS"
    // "?"
    | "T_QUESTION"
    // "'"
    | "T_SINGLE_QUOTE"
    // ";"
    | "T_SEMI"
    // "/"
    | "T_SLASH"
    // "*"
    | "T_STAR"
    // "~"
    | "T_TILDE"

    // その他の文字
    | "T_OTHER"

/**
 * トークン (緑)
 *
 * トークンとはソースコード上で意味のあるまとまりの単語や記号のこと。
 *
 * ここではソースコードにおける位置情報を持たないトークンを「緑」と呼んでいる。
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
    // リテラル

    // 名前
    | "N_NAME"
    // 数値リテラル
    | "N_NUMBER"
    // // 文字列リテラル
    // | "N_STRING"
    // // 文字列リテラルの文字通りの (エスケープではない) 部分
    // | "N_VERBATIM"
    // // 文字列リテラル中のエスケープシーケンス
    // | "N_ESCAPE"

    // 式

    // // グループ式 (演算子の優先度を決めるためにカッコで囲まれた式)
    // | "N_GROUP"
    // // ブロック式 (文を実行してから式を計算する式)
    // | "N_BLOCK"

    // // 関数呼び出し
    // | "N_CALL"

    // // プラス
    // | "N_PLUS"
    // // マイナス
    // | "N_MINUS"

    // 加算
    | "N_ADD"
    // 減算
    | "N_SUB"
    // 乗算
    | "N_MUL"
    // 除算
    | "N_DIV"
    // 剰余
    | "N_MOD"

    // // ビットAND
    // | "N_BIT_AND"
    // // ビットOR
    // | "N_BIT_OR"
    // // ビットXOR
    // | "N_BIT_XOR"

    // // 論理積
    // | "N_LOG_AND"
    // // 論理和
    // | "N_LOG_OR"

    // // 等しい
    // | "N_EQ"
    // // 等しくない
    // | "N_NE"
    // // よりも小さい
    // | "N_LT"
    // // 小さいか等しい
    // | "N_LTEQ"
    // // よりも大きい
    // | "N_GT"
    // // 大きいか等しい
    // | "N_GTEQ"

    // // 代入
    // | "N_ASSIGN"
    // | "N_ADD_ASSIGN"
    // | "N_SUB_ASSIGN"
    // | "N_MUL_ASSIGN"
    // | "N_DIV_ASSIGN"
    // | "N_MOD_ASSIGN"
    // | "N_AND_ASSIGN"
    // | "N_OR_ASSIGN"
    // | "N_XOR_ASSIGN"

    // 文

    | "N_EXPR_STMT"

    // | "N_LET"

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
 * 約物の表
 */
export const SIGN_TABLE: [TokenKind, string][] = [
    ["T_LEFT_PAREN", "("],
    ["T_RIGHT_PAREN", ")"],
    ["T_LEFT_ANGLE", "<"],
    ["T_RIGHT_ANGLE", ">"],
    ["T_LEFT_BRACKET", "["],
    ["T_RIGHT_BRACKET", "]"],
    ["T_LEFT_BRACE", "{"],
    ["T_RIGHT_BRACE", "}"],
    ["T_AND", "&"],
    ["T_AT", "@"],
    ["T_BACKSLASH", "\\"],
    ["T_BACKTICK", "`"],
    ["T_BANG", "!"],
    ["T_COLON", ":"],
    ["T_COMMA", ","],
    ["T_DOT", "."],
    ["T_DOLLAR", "$"],
    ["T_DOUBLE_QUOTE", "\""],
    ["T_HAT", "^"],
    ["T_EQUAL", "="],
    ["T_HASH", "#"],
    ["T_MINUS", "-"],
    ["T_PERCENT", "%"],
    ["T_PIPE", "|"],
    ["T_PLUS", "+"],
    ["T_QUESTION", "?"],
    ["T_SINGLE_QUOTE", "'"],
    ["T_SEMI", ";"],
    ["T_SLASH", "/"],
    ["T_STAR", "*"],
    ["T_TILDE", "~"],
]
