// 文字の種類を区別する関数の定義

// JavaScript/TypeScript に文字型はないので、代わりに長さ1の文字列を使う。
type Char = string

/**
 * 文字が改行でない空白か？
 */
export const charIsSpace = (char: Char) =>
    char === " " || char === "\t" || char === "\r"

/**
 * 文字が数字か？
 */
export const charIsNumeric = (char: Char) =>
    "0" <= char && char <= "9"

/**
 * 文字がアルファベットか？
 */
export const charIsAlphabetic = (char: Char) =>
    ("A" <= char && char <= "Z") || ("a" <= char && char <= "z")

/**
 * 文字が識別子に含まれうる文字か？
 */
export const charIsIdent = (char: Char) =>
    charIsAlphabetic(char)
    || charIsNumeric(char)
    || char === "_"

/**
 * 文字が識別子の先頭としてありうる文字か？
 */
export const charIsIdentFirst = (char: Char) =>
    charIsIdent(char) && !charIsNumeric(char)

/**
 * 約物の先頭としてありうる文字か？
 */
export const charIsPunFirst = (char: Char) =>
    char === "("
    || char === ")"
    || char === "<"
    || char === ">"
    || char === "["
    || char === "]"
    || char === "{"
    || char === "}"
    || char === "&"
    || char === "@"
    || char === "\\"
    || char === "`"
    || char === "!"
    || char === ":"
    || char === ","
    || char === "."
    || char === "$"
    || char === "\""
    || char === "^"
    || char === "="
    || char === "#"
    || char === "-"
    || char === "%"
    || char === "|"
    || char === "+"
    || char === "?"
    || char === "'"
    || char === ";"
    || char === "/"
    || char === "*"
    || char === "~"


/**
 * どのトークンの先頭にもならない文字か？
 */
export const charIsOther = (char: Char) =>
    !charIsSpace(char)
    && char !== "\n"
    && !charIsNumeric(char)
    && !charIsIdentFirst(char)
    && !charIsPunFirst(char)
