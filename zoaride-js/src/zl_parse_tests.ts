// 構文解析のスナップショットテスト

import * as assert from "assert"
import * as fs from "fs"
import * as path from "path"
import { GreenElement, GreenNode, GreenToken } from "./zl_syntax"
import { TestSuiteFun } from "./test_types"
import { parse } from "./zl_parse_main"
import { promisify } from "util"
import { tokenize } from "./zl_tokenize_main"

/**
 * 構文解析の結果をテキストする。
 */
const printParseResult = (root: GreenNode) => {
    const SPACES = "                "

    let output = ""
    let depth = 0

    const goToken = (token: GreenToken) => {
        output += SPACES.slice(0, depth * 2)
        output += "TOKEN("
        output += token.kind
        output += ") "
        output += JSON.stringify(token.text)
        output += "\r\n"
    }

    const goNode = (node: GreenNode) => {
        // START
        output += SPACES.slice(0, depth * 2)
        output += "START("
        output += node.kind
        output += ")\r\n"
        depth++

        // children
        for (const child of node.children) {
            goElement(child)
        }

        // END
        assert.ok(depth >= 1)
        depth--

        output += SPACES.slice(0, depth * 2)
        output += "END("
        output += node.kind
        output += ")\r\n"
    }

    const goElement = (element: GreenElement) => {
        switch (element.kind) {
            case "L_TOKEN":
                goToken(element.token)
                return

            case "L_NODE":
                goNode(element.node)
                return

            case "L_ERROR":
                output += SPACES.slice(0, depth * 2)
                output += "ERROR("
                output += element.errorKind
                output += ")\r\n"
                return

            default:
                throw new Error("unreachable")
        }
    }

    goNode(root)

    assert.equal(depth, 0)
    return output
}

export const zlParseSnapshotTest: TestSuiteFun = ({ test }) => {
    const testsDir = path.join(__dirname, "../tests")

    for (const dirName of fs.readdirSync(testsDir)) {
        const dirPath = path.join(testsDir, dirName)

        for (const fileName of fs.readdirSync(dirPath)) {
            const filePath = path.join(dirPath, fileName)
            const outputPath = path.join(dirPath, fileName.replace(".zoaride", "_parse.txt"))

            if (path.extname(fileName) !== ".zoaride") {
                continue
            }

            test(`${dirName}/${fileName}`, async ({ ok }) => {
                const content = await promisify(fs.readFile)(filePath)
                const text = content.toString()

                const tokens = tokenize(text)
                const events = parse(tokens)
                const output = printParseResult(events)

                await promisify(fs.writeFile)(outputPath, output)
                ok(true)
            })
        }
    }
}
