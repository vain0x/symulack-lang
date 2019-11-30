import * as ReactDOM from "react-dom"
import * as monaco from "monaco-editor"
import { renderMain } from "./view_main"

const THE_STATE: monaco.languages.IState = {
    clone: () => THE_STATE,
    equals: (_other: monaco.languages.IState) => true,
}

const getInitialState = (): monaco.languages.IState =>
    THE_STATE

const tokenize = (line: string, state: monaco.languages.IState): monaco.languages.ILineTokens => {
    const tokens : monaco.languages.IToken[] = []
    let index = 0
    for (const word of line.split(" ")) {
        tokens.push({
            startIndex: index,
            scopes: word[0] === "\"" ? "string" : "none",
        })
        index += word.length
    }

    return {
        tokens,
        endState: THE_STATE,
    }
}

const main = () => {
    const appElement = document.getElementById("app")!
    const editorElement = document.getElementById("editor")!

    monaco.languages.register({
        id: "zoaride",
        aliases: [
            "ゾアライド言語",
            "zoaride-lang",
        ],
        extensions: [
            ".zoaride",
        ],
    })

    monaco.languages.setTokensProvider("zoaride", { getInitialState, tokenize })

    monaco.editor.create(editorElement, {
        value: "\"hello\" world",
        language: "zoaride",
    })

    ReactDOM.render(renderMain(), appElement)
}

document.addEventListener("DOMContentLoaded", main)
