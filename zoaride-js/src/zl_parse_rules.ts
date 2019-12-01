import * as assert from "assert"
import { GreenNode, TokenKind } from "./zl_syntax"
import { ParseContext } from "./zl_parse_context"

const tokenIsAtomFirst = (t: TokenKind) =>
    t === "T_IDENT"

const tokenIsStmtFirst = (t: TokenKind) =>
    tokenIsAtomFirst(t)

const parseAtom = (p: ParseContext): GreenNode => {
    assert.ok(tokenIsAtomFirst(p.next()))

    switch (p.next()) {
        case "T_IDENT": {
            const node = p.startNode()
            p.bump(node)
            return p.endNode(node, "N_NAME")
        }
        default:
            throw new Error("unreachable")
    }
}

const parseStmt = (p: ParseContext): GreenNode => {
    assert.ok(tokenIsStmtFirst(p.next()))

    const atom = parseAtom(p)

    if (p.next() === "T_PLUS_PLUS") {
        const node = p.startBefore(atom)
        p.bump(node)
        return p.endNode(node, "N_INC_STMT")
    }

    return atom
}

export const parseRoot = (p: ParseContext): GreenNode => {
    const node = p.startNode()

    if (!tokenIsStmtFirst(p.next())) {
        p.attachError(node, "PE_EXPECTED_EXPR")
    } else {
        p.attach(node, parseStmt(p))
    }

    while (!p.atEof()) {
        p.bump(node)
    }
    return p.endNode(node, "N_ROOT")
}
