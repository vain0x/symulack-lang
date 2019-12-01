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

export const arrayFirst = <T>(array: T[]): T | null =>
    array.length >= 1 ? array[0] : null

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
            is(arrayFilterMap([1, 4, 1, 4, 2], x => x % 2 === 0 ? x / 2 : null), [2, 2, 1])
        })
    })
}
