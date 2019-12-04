// テスト用の型定義
// テストを特定のテストランナー (mocha) に依存させないため。

/**
 * テストケースの関数
 */
type TestFun = (t: TestCaseContext) => void | Promise<void>

/**
 * テストケースを実行するための API
 */
export interface TestCaseContext {
    /**
     * 条件が true であることを検査する。is(condition, true) と同じ。
     *
     * assert.ok
     */
    ok(condition: boolean): void

    /**
     * asset.deepStrictEqual
     */
    is<T>(actual: T, expected: T): void
}

/**
 * テストケースを宣言するための API
 */
export interface TestSuiteContext {
    /**
     * テストケースのグループを登録する。
     *
     * (body の中で describe/test を使うと、グループ内にグループやテストが登録される。)
     */
    describe(title: string, body: () => void): void

    /**
     * テストケースを登録する。
     */
    test(title: string, body: TestFun): void
}

/**
 * テストケースを宣言する関数
 */
export type TestSuiteFun = (context: TestSuiteContext) => void
