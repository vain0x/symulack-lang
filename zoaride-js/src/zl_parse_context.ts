import * as assert from "assert"
import {
    NodeKind,
    ParseError,
    ParseErrorKind,
    ParseEvent,
    RedToken,
    tokenKindIsTrivial,
} from "./zl_syntax"

type NodeId = number

type Tick = number

type ZIndex = number

interface NodeData {
    forwardParents: NodeId[]
    isForwardParent: boolean
    start: {
        tick: Tick
        index: number
    }
    end: {
        kind: NodeKind
        tick: Tick
        index: number
    } | null
}

/**
 * 構文解析中の状態を管理するもの
 */
export class ParseContext {
    /**
     * 字句解析で構築したトークンリスト
     *
     * trivial なトークンは含まない。
     */
    private tokens: RedToken[]

    private tokenTicks: Tick[] = []

    /**
     * 作成したノードのリスト
     */
    private nodes: NodeData[] = []

    /**
     * 発生したエラーのリスト
     */
    private errors: ParseError[] = []

    /**
     * トークン列上の現在位置
     */
    private index: number = 0

    private lastTick: Tick = 0

    public constructor(tokens: RedToken[]) {
        assert.ok(tokens.length >= 1)

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
    public bumpMany(count: number) {
        assert.ok(count >= 0)
        assert.ok(this.index + count < this.tokens.length)

        for (let i = 0; i < count; i++) {
            this.bump()
        }
    }

    /**
     * 次のトークンを読み飛ばす。
     */
    public bump() {
        assert.ok(this.index + 1 < this.tokens.length)

        while (true) {
            this.lastTick++
            this.tokenTicks[this.index] = this.lastTick
            this.index++

            // tirival なトークンを無視する。
            // FIXME: この方針だと2トークン以上の先読みがめんどくさい。
            if (tokenKindIsTrivial(this.next())) {
                continue
            }

            break
        }

        this.assertInvariants()
    }

    public startNode() {
        this.lastTick++

        const nodeId = this.nodes.length
        this.nodes.push({
            forwardParents: [],
            isForwardParent: false,
            start: {
                tick: this.lastTick,
                index: this.index,
            },
            end: null,
        })
        return nodeId
    }

    public startBefore(childNodeId: NodeId) {
        const newNodeId = this.startNode()

        this.nodes[newNodeId].isForwardParent = true
        this.nodes[childNodeId].forwardParents.push(newNodeId)

        return newNodeId
    }

    public endNode(nodeId: NodeId, kind: NodeKind) {
        assert.equal(this.nodes[nodeId].end, null)

        this.lastTick++

        this.nodes[nodeId].end = {
            kind,
            tick: this.lastTick,
            index: this.index,
        }
        return nodeId
    }

    /**
     * 構文エラーを報告する。
     */
    public addError(nodeId: NodeId, kind: ParseErrorKind) {
        this.lastTick++
        this.errors.push({
            kind,

            // FIXME: カスタマイズ可能にする
            range: this.tokens[this.nodes[nodeId].start.index].range,
        })
    }

    public finish() {
        const events: {
            tick: Tick,
            zIndex: ZIndex,
            event: ParseEvent
        }[] = []

        // ノードの開閉の対応を検査するためのスタック。
        const stack: NodeId[] = []

        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i]
            if (node.end === null) {
                continue
            }

            if (!node.isForwardParent) {
                let zIndex = 0

                // forward parents を先に開始してから、このノードを開始する。
                const nodeIds = node.forwardParents.reverse()
                nodeIds.push(i)

                for (const nodeId of nodeIds) {
                    events.push({
                        tick: node.start.tick,
                        zIndex,
                        event: {
                            kind: "P_START_NODE",
                            nodeKind: this.nodes[nodeId].end!.kind,
                        },
                    })
                    stack.push(nodeId)

                    zIndex++
                }
            }

            assert.ok(stack.length >= 1 && stack[stack.length - 1] === i)
            stack.pop()

            events.push({
                tick: node.end.tick,
                zIndex: 0,
                event: {
                    kind: "P_END_NODE",
                },
            })
        }

        for (let i = 0; i < this.tokens.length - 1; i ++) {
            events.push({
                tick: this.tokenTicks[i],
                zIndex: 0,
                event: {
                    kind: "P_TOKEN",
                    count: 1,
                },
            })
        }

        // イベントを (tick, zIndex) に関してソートする。
        events.sort((l, r) => {
            if (l.tick !== r.tick) {
                return l.tick - r.tick
            }
            return l.zIndex - r.zIndex
        })

        return {
            events: events.map(e => e.event),
            errors: this.errors,
        }
    }
}
