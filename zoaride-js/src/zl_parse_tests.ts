// 構文解析のスナップショットテスト

import * as assert from "assert"
import * as fs from "fs"
import * as path from "path"
import { Ast, astGen } from "./zl_ast"
import { GreenElement, GreenNode, GreenToken } from "./zl_syntax"
import { TestSuiteFun } from "./test_types"
import { parse } from "./zl_parse_main"
import { promisify } from "util"
import { redElementNewRoot } from "./zl_syntax_red"
import { tokenize } from "./zl_tokenize_main"

/**
 * 構文解析の結果をテキストにする。
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

/**
 * AST をテキストにする。
 */
const printAstResult = (ast: Ast) => {
    // RedElement のような再帰的なオブジェクトは JSON にできないので無視されるようにする。
    const replacer = (key: string, value: unknown) => {
        return key !== "red" ? value : undefined
    }

    return JSON.stringify(ast, replacer, 2)
}

/**
 * スナップショットテストを行う。
 *
 * `tests/features/foo.zoaride` のようなファイルをコンパイルして、
 * その結果をテキストとして吐き出す。
 * Git の差分が出ないか、あるいは期待した通りの変化が現れれば OK とする。
 */
export const zlParseSnapshotTest: TestSuiteFun = ({ test }) => {
    const testsDir = path.join(__dirname, "../tests")

    // tests 直下にあるカテゴリごとのディレクトリを列挙する。
    for (const dirName of fs.readdirSync(testsDir)) {
        const dirPath = path.join(testsDir, dirName)

        for (const fileName of fs.readdirSync(dirPath)) {
            const filePath = path.join(dirPath, fileName)
            const parseOutputPath = path.join(dirPath, fileName.replace(".zoaride", "_parse.txt"))
            const astOutputPath = path.join(dirPath, fileName.replace(".zoaride", "_ast.txt"))

            if (path.extname(fileName) !== ".zoaride") {
                continue
            }

            test(`${dirName}/${fileName}`, async ({ ok }) => {
                const content = await promisify(fs.readFile)(filePath)
                const text = content.toString()

                // 構文解析
                const tokens = tokenize(text)
                const greenRoot = parse(tokens)
                const parseOutput = printParseResult(greenRoot)

                await promisify(fs.writeFile)(parseOutputPath, parseOutput)

                // AST 生成
                const redRoot = redElementNewRoot(greenRoot)
                const ast = astGen(redRoot)
                const astOutput = printAstResult(ast)

                await promisify(fs.writeFile)(astOutputPath, astOutput)

                // 実行時エラーが起こらなければ OK としておく。
                ok(true)
            })
        }
    }
}
