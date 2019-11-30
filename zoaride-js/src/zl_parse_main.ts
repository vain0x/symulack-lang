import { ParseError, RedToken } from "./zl_syntax"
import { Position, Range } from "vscode-languageserver-types"
import { ParseContext } from "./zl_parse_context"
import { parseRoot } from "./zl_parse_rules"

const numberCompare = (first: number, second: number) => {
    if (first < second) {
        return -1
    }
    if (first === second) {
        return 0
    }
    return 1
}

const positionCompare = (first: Position, second: Position) => {
    if (first.line !== second.line) {
        return numberCompare(first.line, second.line)
    }

    return numberCompare(first.character, second.character)
}

const rangeCompare = (first: Range, second: Range) =>
    positionCompare(first.start, second.start)

export const parse = (tokens: RedToken[], tokenizeErrors: ParseError[]) => {
    const p = new ParseContext(tokens)

    parseRoot(p)

    const { events, errors: parseErrors } = p.finish()

    const errors = [...tokenizeErrors, ...parseErrors]
    errors.sort((l, r) => rangeCompare(l.range, r.range))

    return {
        events,
        errors,
    }
}
