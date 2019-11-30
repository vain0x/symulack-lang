// 構文解析のスナップショットテスト

import * as assert from "assert"
import * as fs from "fs"
import * as path from "path"
import { ParseEvent } from "./zl_syntax"
import { TestSuiteFun } from "./test_types"
import { parse } from "./zl_parse_main"
import { promisify } from "util"
import { tokenize } from "./zl_tokenize_main"

const printParseResult = (events: ParseEvent[]) => {
    const SPACES = "                "

    let output = ""
    let depth = 0

    for (const event of events) {
        switch (event.kind) {
            case "P_START_NODE": {
                output += SPACES.slice(0, depth * 2)
                depth++

                output += "START("
                output += event.nodeKind
                output += ")\r\n"
                continue
            }
            case "P_END_NODE": {
                assert.ok(depth >= 1)
                depth--

                output += SPACES.slice(0, depth * 2)
                output += "END("
                output += event.nodeKind
                output += ")\r\n"
                continue
            }
            case "P_TOKEN": {
                output += SPACES.slice(0, depth * 2)
                output += "TOKEN("
                output += event.token.kind
                output += ") "
                output += JSON.stringify(event.token.text)
                output += "\r\n"
                continue
            }
            case "P_ERROR": {
                output += SPACES.slice(0, depth * 2)
                output += "ERROR("
                output += event.errorKind
                output += ")\r\n"
                continue
            }
            default:
                throw new Error("unreachable")
        }
    }

    assert.equal(depth, 0)
    return output
}

export const zlParseSnapshotTest: TestSuiteFun = ({ test }) => {
    const testsDir = path.join(__dirname, "../tests")

    for (const dirName of fs.readdirSync(testsDir)) {
        const dirPath = path.join(testsDir, dirName)

        for (const fileName of fs.readdirSync(dirPath)) {
            const filePath = path.join(dirPath, fileName)
            const outputPath = path.join(dirPath, fileName.replace(".zoaride", ".txt"))

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
