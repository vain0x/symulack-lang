import * as assert from "assert"
import { TestSuiteFun } from "./test_types"

/**
 * 指定された長さの配列を作る。
 *
 * 各要素の初期値は value に設定される。
 */
export const arrayReplicate = <T>(length: number, value: T): T[] => {
    const array: T[] = []

    for (let i = 0; i < length; i++) {
        array.push(value)
    }

    assert.equal(array.length, length)
    return array
}

/**
 * 配列の最初の要素を取得する。
 */
export const arrayFirst = <T>(array: T[]): T | null =>
    array.length >= 1 ? array[0] : null

/**
 * 配列の各要素に関数を適用して、null|undefined を除いた結果からなる配列を作る。
 */
export const arrayFilterMap = <T, U>(array: T[], f: (x: T) => U | null | undefined): U[] => {
    const output: U[] = []

    for (const x of array) {
        const y = f(x)
        if (y != null) {
            output.push(y)
        }
    }

    return output
}

export const utilArrayTest: TestSuiteFun = ({ describe, test }) => {
    describe("arrayFirst", () => {
        test("empty", ({ is }) => {
            is(arrayFirst([]), null)
        })

        test("nonempty", ({ is }) => {
            is(arrayFirst([true, false]), true)
        })
    })

    describe("arrayFilterMap", () => {
        test("works", ({ is }) => {
            const half = (x: number) => x % 2 === 0 ? x / 2 : null
            is(arrayFilterMap([1, 4, 1, 4, 2], half), [2, 2, 1])
        })
    })
}
