import {
    Position,
    Range,
} from "vscode-languageserver-types"
import {
    RedToken,
} from "./zl_syntax"
import { tokenizeAll } from "./zl_tokenize_rules"

const POSITION_ZERO: Position = {
    line: 0,
    character: 0,
}

const RANGE_ZERO: Range = {
    start: POSITION_ZERO,
    end: POSITION_ZERO,
}

/**
 * 赤トークンの範囲を再計算する。
 */
const calculateTokenRanges = (tokens: RedToken[]) => {
    // 行番号
    let line = 0
    // 列番号
    let character = 0

    for (let token of tokens) {
        const start: Position = { line, character }

        for (let i = 0; i < token.text.length; i++) {
            if (token.text[i] === "\n") {
                line++
                character = 0
            } else {
                character++
            }
        }

        const end: Position = { line, character }

        token.range = { start, end }
    }
}

/**
 * 赤トークンの行頭フラグを再計算する。
 */
// const calculateLineStartFlags = (tokens: RedToken[]) => {
//     // 直前に見た trivial でないトークンの行
//     let previousLine = -1

//     for (let token of tokens) {
//         token.atLineStart = token.range.start.line > previousLine

//         if (!tokenKindIsTrivial(token.kind)) {
//             previousLine = token.range.end.line
//         }
//     }
// }

/**
 * 字句解析を行う。
 */
export const tokenize = (text: string) => {
    const tokens = tokenizeAll(text)

    // 赤トークンを生成する。
    const redTokens: RedToken[] = tokens.map(greenToken => ({
        kind: greenToken.kind,
        text: greenToken.text,

        // 後で計算
        range: RANGE_ZERO,
        // atLineStart: false,
    }))

    // calculateTokenRanges(redTokens)
    // calculateLineStartFlags(redTokens)

    return tokens
}
