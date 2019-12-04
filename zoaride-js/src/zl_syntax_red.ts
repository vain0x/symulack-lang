// 構文要素 (赤) の構築や操作など

import {
    GreenElement,
    GreenNode,
    ParseError,
    RedElement,
} from "./zl_syntax"
import { Position, Range } from "vscode-languageserver-types"
import { TextCursor } from "./util_text_cursor"
import { arrayFilterMap } from "./util_array"

const POSITION_ZERO: Position = {
    line: 0,
    character: 0,
}

const RANGE_ZERO: Range = {
    start: POSITION_ZERO,
    end: POSITION_ZERO,
}

const fromGreenElement = (greenElement: GreenElement): RedElement => {
    const redElement: RedElement = {
        green: greenElement,
        siblingnIndex: 0,

        // 後で設定する。
        children: [],
        parent: null,
        range: RANGE_ZERO,
    }

    if (greenElement.kind === "L_NODE") {
        for (let i = 0; i < greenElement.node.children.length; i++) {
            const greenChild = greenElement.node.children[i]

            const redChild = fromGreenElement(greenChild)
            redChild.parent = redElement
            redChild.siblingnIndex = i

            redElement.children.push(redChild)
        }
    }

    return redElement
}

export const redElementNewRoot = (green: GreenNode): RedElement => {
    const red = fromGreenElement({
        kind: "L_NODE",
        node: green,
    })

    const cursor = new TextCursor(POSITION_ZERO)
    recalculateRanges(red, cursor)

    return red
}

const recalculateRanges = (red: RedElement, cursor: TextCursor) => {
    const start = cursor.currentPosition()

    if (red.green.kind === "L_TOKEN") {
        cursor.read(red.green.token.text)
    }

    for (const child of red.children) {
        recalculateRanges(child, cursor)
    }

    const end = cursor.currentPosition()
    red.range = { start, end }
}

const asToken = (element: RedElement): RedElement | null =>
    element.green.kind === "L_TOKEN"
        ? element
        : null

export const redElementToChildTokens = (element: RedElement): RedElement[] =>
    arrayFilterMap(element.children, asToken)

export const redElementToErrors = (element: RedElement): ParseError[] => {
    const go = (element: RedElement): void => {
        if (element.green.kind === "L_ERROR") {
            errors.push({
                kind: element.green.errorKind,
                range: element.range,
            })
        }

        for (const child of element.children) {
            go(child)
        }
    }

    const errors: ParseError[] = []
    go(element)
    return errors
}
