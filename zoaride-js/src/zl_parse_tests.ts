// 構文解析のスナップショットテスト

import * as assert from "assert"
import * as fs from "fs"
import * as path from "path"
import { ParseError, ParseEvent, RedToken } from "./zl_syntax"
import { TestSuiteFun } from "./test_types"
import { parse } from "./zl_parse_main"
import { promisify } from "util"
import { tokenize } from "./zl_tokenize_main"

const printParseResult = (tokens: RedToken[], events: ParseEvent[], errors: ParseError[]) => {
    const SPACES = "                                             "

    let output = ""
    let index = 0
    let depth = 0
    const stack = []

    for (const event of events) {
        switch (event.kind) {
            case "P_START_NODE": {
                output += SPACES.slice(0, depth * 2)
                depth++

                output += "START "
                output += event.nodeKind
                output += "\r\n"

                stack.push(event.nodeKind)
                continue
            }
            case "P_END_NODE": {
                assert.ok(depth >= 1)
                depth--

                output += SPACES.slice(0, depth * 2)
                output += "END "
                output += stack.pop()
                output += "\r\n"
                continue
            }
            case "P_TOKEN": {
                for (let i = 0; i < event.count; i++) {
                    output += SPACES.slice(0, depth * 2)
                    output += tokens[index].kind
                    output += " "
                    output += JSON.stringify(tokens[index].text)
                    output += "\r\n"
                    index++
                }
                continue
            }
            default:
                throw new Error("unreachable")
        }
    }

    assert.equal(index, tokens.length - 1)
    assert.equal(depth, 0)

    // FIXME: みやすく表示する
    for (const error of errors) {
        output += "\r\nERROR: "
        output += error.kind
        output += " ("
        output += error.range.start.line
        output += ":"
        output += error.range.start.character
        output += "..."
        output += error.range.end.line
        output += ":"
        output += error.range.end.character
        output += ")\r\n"
    }

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

                const { tokens, errors: tokenizeErrors } = tokenize(text)
                const { events, errors } = parse(tokens, tokenizeErrors)
                const output = printParseResult(tokens, events, errors)

                await promisify(fs.writeFile)(outputPath, output)
                ok(true)
            })
        }
    }
}
