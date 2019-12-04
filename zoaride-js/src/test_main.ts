// テストのエントリーポイント
// 特定のテストランナーに依存しないため、テスト関数の登録などを手動で行う。

import * as assert from "assert"
import { TestCaseContext, TestSuiteContext } from "./test_types"
import { dapParseTest } from "./dap_parse"
import { helloTest } from "./hello"
import { lspParseTest } from "./lsp_parse"
import { utilArrayTest } from "./util_array"
import { vmQueueTest } from "./vm_queue"
import { vmStepTest } from "./vm_step"
import { zlParseSnapshotTest } from "./zl_parse_tests"

const mocha = require("mocha")

// ここにテストを追加する。
const TEST_SUITE_FUNS = {
    helloTest,
    dapParseTest,
    lspParseTest,
    utilArrayTest,
    vmQueueTest,
    vmStepTest,
    zlParseSnapshotTest,
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
