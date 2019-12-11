// 構文解析の状態管理

import * as assert from "assert"
import {
    GreenNode,
    GreenToken,
    NodeKind,
    ParseErrorKind,
} from "./zl_syntax"
import { createNonTriviaIndexes, tokenIsTrailingTrivia, tokenIsTrivia } from "./zl_syntax_trivia"

/**
 * トークンリスト上の位置
 */
type TokenIndex = number

/**
 * 構文解析中の状態を管理するもの
 */
export class ParseContext {
    /**
     * 字句解析で構築したトークンリスト
     */
    private tokens: GreenToken[]

    /**
     * トークンリスト上の現在位置
     */
    private index: TokenIndex = 0

    /**
     * トリビアを飛ばして先読みするための索引
     *
     * nonTriviaIndexes[i] は、トークン列上の位置 i 以降にある
     * 最初のトリビアでないトークンの位置を指す。
     */
    private nonTriviaIndexes: TokenIndex[]

    public constructor(tokens: GreenToken[]) {
        assert.ok(tokens.length >= 1)
        assert.equal(tokens[tokens.length - 1].kind, "T_EOF")

        this.tokens = tokens
        this.nonTriviaIndexes = createNonTriviaIndexes(tokens)
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
        return this.tokens[this.nonTriviaIndexes[this.index]].kind
    }

    /**
     * 次のトリビアまたはトークンを読み飛ばす。
     */
    private doBump(node: GreenNode) {
        assert.ok(this.index + 1 < this.tokens.length)

        const kind = this.next()

        node.children.push({
            kind: "L_TOKEN",
            token: this.tokens[this.index],
        })
        this.index++

        // 字句解析のエラーを構文解析が引き継ぐ。
        if (kind === "T_OTHER") {
            this.attachError(node, "PE_INVALID_CHAR")
        }
    }

    /**
     * トークンの前についているトリビアを読み飛ばす。
     */
    private bumpLeadingTrivia(node: GreenNode) {
        while (tokenIsTrivia(this.tokens[this.index].kind)) {
            this.doBump(node)
        }
    }

    /**
     * トークンの後ろについているトリビアを読み飛ばす。
     */
    private bumpTrailingTrivia(node: GreenNode) {
        while (tokenIsTrailingTrivia(this.tokens[this.index].kind)) {
            this.doBump(node)
        }
    }

    /**
     * 次のトークンを読み飛ばす。
     *
     * そのトークンの周囲のトリビアも一緒に読み飛ばす。
     */
    public bump(node: GreenNode) {
        assert.ok(this.index + 1 < this.tokens.length)

        this.bumpLeadingTrivia(node)
        this.doBump(node)
        this.bumpTrailingTrivia(node)

        this.assertInvariants()
    }

    /**
     * 新しいノードを作る。
     */
    public startNode(): GreenNode {
        return {
            kind: "N_ROOT",
            children: [],
        }
    }

    /**
     * 他のノードの親になるノードを作る。
     *
     * 例えば `i + 1` をパースするとき、`i` のノードが完成した後に、
     * その親となる `+` のノードを作り始める。こういうときに使う。
     */
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

    /**
     * ルートノードを作る。
     */
    public startRoot(): GreenNode {
        assert.equal(this.index, 0)

        return this.startNode()
    }

    /**
     * ノードの構築を終了する。
     */
    public endNode(node: GreenNode, nodeKind: NodeKind) {
        assert.equal(node.kind, "N_ROOT")

        node.kind = nodeKind
        return node
    }

    /**
     * 他のノードを子ノードとして追加する。
     */
    public attach(parentNode: GreenNode, childNode: GreenNode) {
        parentNode.children.push({
            kind: "L_NODE",
            node: childNode,
        })
    }

    /**
     * 構文エラーを子ノードとして追加する。
     */
    public attachError(node: GreenNode, errorKind: ParseErrorKind) {
        node.children.push({
            kind: "L_ERROR",
            errorKind,
        })
    }

    /**
     * 構文解析の終了時に呼ばれる。
     */
    public finish(root: GreenNode): GreenNode {
        this.bumpLeadingTrivia(root)

        assert.equal(this.index, this.tokens.length - 1)
        return root
    }
}
