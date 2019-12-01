import { GreenNode, RedToken } from "./zl_syntax"
import { ParseContext } from "./zl_parse_context"
import { parseRoot } from "./zl_parse_rules"

export const parse = (tokens: RedToken[]): GreenNode => {
    const p = new ParseContext(tokens)
    const root = parseRoot(p)
    return p.finish(root)
}
