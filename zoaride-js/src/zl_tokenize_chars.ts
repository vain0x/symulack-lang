// 文字の種類を区別する関数の定義

// JavaScript/TypeScript に文字型はないので、代わりに長さ1の文字列を使う。
type Char = string

/**
 * 文字が ASCII 文字の空白か？
 */
export const charIsAsciiWhitespace = (char: Char) =>
    char === " " || char === "\t" || char === "\r" || char === "\n"

/**
 * 文字が ASCII 文字の10進数の数字か？
 */
export const charIsAsciiNumeric = (char: Char) =>
    "0" <= char && char <= "9"

/**
 * 文字が ASCII 文字のアルファベットか？
 */
export const charIsAsciiAlphabetic = (char: Char) =>
    ("A" <= char && char <= "Z") || ("a" <= char && char <= "z")

/**
 * 文字が識別子に含まれうる文字か？
 */
export const charIsIdent = (char: Char) =>
    charIsAsciiAlphabetic(char) || charIsAsciiNumeric(char) || char === "_"

/**
 * 文字が識別子の先頭としてありうる文字か？
 */
export const charIsIdentFirst = (char: Char) =>
    charIsIdent(char) && !charIsAsciiNumeric(char)

/**
 * 約物の先頭としてありうる文字か？
 */
export const charIsPunFirst = (char: Char) =>
    char === "+"

/**
 * どのトークンの先頭にもならない文字か？
 */
export const charIsError = (char: Char) =>
    !charIsAsciiWhitespace(char)
    && !charIsAsciiNumeric(char)
    && !charIsIdentFirst(char)
    && !charIsPunFirst(char)
