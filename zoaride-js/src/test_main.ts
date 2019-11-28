import * as assert from "assert"
import { TestCaseContext, TestSuiteContext } from "./test_types"
import { helloTest } from "./hello"
import { lspParseTest } from "./lsp_parse"

const mocha = require("mocha")

// ここにテストを追加する。
const TEST_SUITE_FUNS = {
    helloTest,
    lspParseTest,
}

const testCaseContext: TestCaseContext = {
    ok: assert.ok,
    is: assert.deepStrictEqual,
}

const testSuiteContext: TestSuiteContext = {
    describe: mocha.describe,
    test: (title, body) => {
        mocha.test(title, () => body(testCaseContext))
    },
}

const testMain = () => {
    for (const [name, testSuiteFun] of Object.entries(TEST_SUITE_FUNS)) {
        testSuiteContext.describe(name, () => {
            testSuiteFun(testSuiteContext)
        })
    }
}

testMain()
