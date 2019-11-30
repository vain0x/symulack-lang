import * as assert from "assert"
import {
    GreenToken,
    NodeKind,
    ParseErrorKind,
    ParseEvent,
    ParseEventTree,
    ParseNode,
    RedToken,
    tokenIsTrivial,
} from "./zl_syntax"

const eventNewStartNode = (): ParseEvent => ({
    kind: "P_START_NODE",
    nodeKind: "N_ROOT",
})

const eventNewEndNode = (nodeKind: NodeKind): ParseEvent => ({
    kind: "P_END_NODE",
    nodeKind,
})

const eventNewToken = (token: GreenToken): ParseEvent => ({
    kind: "P_TOKEN",
    token,
})

const eventNewError = (errorKind: ParseErrorKind): ParseEvent => ({
    kind: "P_ERROR",
    errorKind,
})

const nodeInsertEventPrev = (node: ParseNode, event: ParseEvent) => {
    node.tree = {
        event,
        prev: null,
        next: node.tree,
    }
}

const nodeInsertEventNext = (node: ParseNode, event: ParseEvent) => {
    node.tree = {
        event,
        prev: node.tree,
        next: null,
    }
}

const nodeInsertTreeNext = (node: ParseNode, next: ParseEventTree) => {
    node.tree = {
        event: null,
        prev: node.tree,
        next,
    }
}

const flatten = (node: ParseNode) => {
    const events: ParseEvent[] = []

    const go = (tree: ParseEventTree): void => {
        if (tree.prev !== null) {
            go(tree.prev)
        }

        if (tree.event !== null) {
            events.push(tree.event)
        }

        if (tree.next !== null) {
            go(tree.next)
        }
    }

    go(node.tree)
    return events
}

/**
 * 構文解析中の状態を管理するもの
 */
export class ParseContext {
    /**
     * 字句解析で構築したトークンリスト
     */
    private tokens: RedToken[]

    /**
     * トークン列上の現在位置
     */
    private index: number = 0

    public constructor(tokens: RedToken[]) {
        assert.ok(tokens.length >= 1)
        assert.equal(tokens[tokens.length - 1].kind, "T_EOF")

        this.tokens = tokens
    }

    /**
     * 不変条件を表明する。
     */
    private assertInvariants() {
        assert.ok(0 <= this.index)
        assert.ok(this.index < this.tokens.length)
    }

    public currentIndex() {
        return this.index
    }

    public atEof() {
        return this.next() === "T_EOF"
    }

    /**
     * 次のトークンの種類
     */
    public next() {
        return this.tokens[this.index].kind
    }

    /**
     * 指定された数のトークンを読み飛ばす。
     */
    public bumpMany(node: ParseNode, count: number) {
        assert.ok(count >= 0)
        assert.ok(this.index + count < this.tokens.length)

        for (let i = 0; i < count; i++) {
            this.bump(node)
        }
    }

    /**
     * 次のトークンを読み飛ばす。
     */
    public bump(node: ParseNode) {
        assert.ok(this.index + 1 < this.tokens.length)

        while (true) {
            nodeInsertEventNext(node, eventNewToken(this.tokens[this.index]))
            this.index++

            // trivial なトークンを無視する。
            // FIXME: この方針だと2トークン以上の先読みがやりづらい。
            if (tokenIsTrivial(this.next())) {
                if (this.next() === "T_ERROR") {
                    this.attachError(node, "PE_INVALID_CHAR")
                }
                continue
            }

            break
        }

        this.assertInvariants()
    }

    public startNode(): ParseNode {
        const startEvent = eventNewStartNode()

        return {
            startEvent,
            tree: {
                event: startEvent,
                prev: null,
                next: null,
            },
        }
    }

    public startBefore(childNode: ParseNode): ParseNode {
        const startEvent = eventNewStartNode()

        nodeInsertEventPrev(childNode, startEvent)

        return {
            startEvent,
            tree: {
                event: null,
                prev: childNode.tree,
                next: null,
            },
        }
    }

    public endNode(node: ParseNode, nodeKind: NodeKind) {
        // 開始イベントの nodeKind を設定する。
        assert.equal(node.startEvent.kind, "P_START_NODE")
        if (node.startEvent.kind === "P_START_NODE") {
            assert.equal(node.startEvent.nodeKind, "N_ROOT")

            node.startEvent.nodeKind = nodeKind
        }

        nodeInsertEventNext(node, eventNewEndNode(nodeKind))
        return node
    }

    public attach(parentNode: ParseNode, childNode: ParseNode) {
        nodeInsertTreeNext(parentNode, childNode.tree)

        // 使用不可 (デバッグ用)
        childNode.tree = null!
    }

    public attachError(node: ParseNode, errorKind: ParseErrorKind) {
        nodeInsertEventNext(node, eventNewError(errorKind))
    }

    public finish(root: ParseNode): ParseEvent[] {
        return flatten(root)
    }
}
