// 字句解析の状態管理

import * as assert from "assert"
import {
    GreenToken,
    TokenKind,
} from "./zl_syntax"

/**
 * 字句解析中の状態を管理するもの
 *
 * 注意: Unicode は考慮していない。
 */
export class TokenizeContext {
    /**
     * ソースコード
     */
    private text: string

    /**
     * 現在位置
     */
    private index: number = 0

    /**
     * 前回のコミット位置
     */
    private lastIndex: number = 0

    /**
     * `this.lastIndexP までのソースコードを字句解析して得られたトークンのリスト
     */
    private tokens: GreenToken[] = []

    public constructor(text: string) {
        this.text = text
    }

    /**
     * 不変条件を表明する。
     */
    private assertInvariants() {
        assert.ok(0 <= this.lastIndex)
        assert.ok(this.lastIndex <= this.index)
        assert.ok(this.index <= this.text.length)
    }

    /**
     * 現在位置
     */
    public currentIndex() {
        return this.index
    }

    /**
     * ソースコードの末尾にいる？
     */
    public atEof() {
        return this.index >= this.text.length
    }

    /**
     * 次の1文字を取得する。ソースコードの末尾なら、代わりに NULL 文字を取得する。
     */
    public next() {
        return this.text[this.index] || "\0"
    }

    /**
     * 現在位置を指定された文字数分だけ進める。
     */
    public bumpMany(count: number) {
        assert.ok(count >= 0)
        assert.ok(count <= this.text.length - this.index)

        this.index += count

        this.assertInvariants()
    }

    /**
     * 1文字読む。
     */
    public bump() {
        this.bumpMany(1)
    }

    /**
     * 現在位置の後に指定された文字列が続くか？
     */
    private isFollowedBy(word: string) {
        return this.text.substr(this.index, word.length) === word
    }

    /**
     * 現在位置の直後に指定された文字列が続くなら、それを読み飛ばして true を返す。
     * そうでなければ false を返す。
     */
    public eat(word: string) {
        if (!this.isFollowedBy(word)) {
            return false
        }

        this.bumpMany(word.length)
        return true
    }

    /**
     * コミットする。
     *
     * 前回のコミット位置から現在位置までの間を1個のトークンとみなす。
     */
    public commit(kind: TokenKind) {
        const text = this.text.slice(this.lastIndex, this.index)

        this.tokens.push({ kind, text })
        this.lastIndex = this.index

        this.assertInvariants()
    }

    /**
     * 字句解析を終了する。
     */
    public finish() {
        assert.equal(this.index, this.lastIndex)
        assert.equal(this.index, this.text.length)

        // 末尾に EOF トークンを自動でつける。(構文解析のため)
        this.commit("T_EOF")

        return this.tokens
    }
}
