import * as assert from "assert"
import {
    GreenNode,
    GreenToken,
    NodeKind,
    ParseErrorKind,
    tokenIsTrivial,
} from "./zl_syntax"

/**
 * 構文解析中の状態を管理するもの
 */
export class ParseContext {
    /**
     * 字句解析で構築したトークンリスト
     */
    private tokens: GreenToken[]

    /**
     * トークン列上の現在位置
     */
    private index: number = 0

    public constructor(tokens: GreenToken[]) {
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
    public bumpMany(node: GreenNode, count: number) {
        assert.ok(count >= 0)
        assert.ok(this.index + count < this.tokens.length)

        for (let i = 0; i < count; i++) {
            this.bump(node)
        }
    }

    /**
     * 次のトークンを読み飛ばす。
     */
    public bump(node: GreenNode) {
        assert.ok(this.index + 1 < this.tokens.length)

        while (true) {
            node.children.push({
                kind: "L_TOKEN",
                token: this.tokens[this.index],
            })
            this.index++

            // trivial なトークンを無視する。
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

    public startNode(): GreenNode {
        return {
            kind: "N_ROOT",
            children: [],
        }
    }

    public startBefore(childNode: GreenNode): GreenNode {
        return {
            kind: "N_ROOT",
            children: [
                {
                    kind: "L_NODE",
                    node: childNode,
                },
            ],
        }
    }

    public endNode(node: GreenNode, nodeKind: NodeKind) {
        assert.equal(node.kind, "N_ROOT")
        node.kind = nodeKind
        return node
    }

    public attach(parentNode: GreenNode, childNode: GreenNode) {
        parentNode.children.push({
            kind: "L_NODE",
            node: childNode,
        })
    }

    public attachError(node: GreenNode, errorKind: ParseErrorKind) {
        node.children.push({
            kind: "L_ERROR",
            errorKind,
        })
    }

    public finish(root: GreenNode): GreenNode {
        return root
    }
}
