import * as assert from "assert"
import { ParseContext } from "./zl_parse_context"
import { TokenKind } from "./zl_syntax"

const tokenIsAtomFirst = (t: TokenKind) =>
    t === "T_IDENT"

const tokenIsStmtFirst = (t: TokenKind) =>
    tokenIsAtomFirst(t)

const parseAtom = (p: ParseContext) => {
    assert.ok(tokenIsAtomFirst(p.next()))

    switch (p.next()) {
        case "T_IDENT": {
            const name = p.startNode()
            p.bump()
            return p.endNode(name, "N_NAME")
        }
        default:
            throw new Error("到達不能")
    }
}

const parseStmt = (p: ParseContext) => {
    assert.ok(tokenIsStmtFirst(p.next()))

    const atom = parseAtom(p)

    if (p.next() === "T_PLUS_PLUS") {
        const node = p.startBefore(atom)
        p.bump()
        p.endNode(node, "N_INC_STMT")
    }
}

export const parseRoot = (p: ParseContext) => {
    const node = p.startNode()

    if (!tokenIsStmtFirst(p.next())) {
        p.addError(node, "PE_EXPECTED_EXPR")
    } else {
        parseStmt(p)
    }

    while (!p.atEof()) {
        p.bump()
    }
    return p.endNode(node, "N_ROOT")
}
