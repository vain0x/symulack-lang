import { GreenNode, GreenToken } from "./zl_syntax"
import { ParseContext } from "./zl_parse_context"
import { parseRoot } from "./zl_parse_rules"

/**
 * 構文解析を行う。
 */
export const parse = (tokens: GreenToken[]): GreenNode => {
    const p = new ParseContext(tokens)
    const root = parseRoot(p)
    return p.finish(root)
}
