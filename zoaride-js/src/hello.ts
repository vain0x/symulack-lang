import { TestSuiteFun } from "./test_types"

export const add = (x: number, y: number) => x + y

export const helloTest: TestSuiteFun = ({ test }) => {
    test("hello", ({ is }) => {
        is(2 + 3, 5)
    })
}
