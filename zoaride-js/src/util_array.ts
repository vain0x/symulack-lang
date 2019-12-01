import * as assert from "assert"

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
