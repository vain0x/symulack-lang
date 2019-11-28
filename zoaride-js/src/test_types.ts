type TestFun = (t: TestCaseContext) => void | Promise<void>

export interface TestCaseContext {
    /**
     * assert.ok
     */
    ok(condition: boolean): void

    /**
     * asset.deepStrictEqual
     */
    is<T>(actual: T, expected: T): void
}

export interface TestSuiteContext {
    describe(title: string, body: () => void): void

    test(title: string, body: TestFun): void
}

export type TestSuiteFun = (context: TestSuiteContext) => void
