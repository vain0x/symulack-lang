import { Position } from "vscode-languageserver-types"

/**
 * テキスト上の位置 (行番号, 列番号) を計算するもの
 *
 * UTF-16 を基準としている。
 */
export class TextCursor {
    private position: Position

    public constructor(position: Position) {
        this.position = position
    }

    public currentPosition(): Position {
        return this.position
    }

    public read(text: string) {
        let { line, character } = this.position

        for (let i = 0; i < text.length; i++) {
            if (text[i] === "\n") {
                line++
                character = 0
            } else {
                character++
            }
        }

        this.position = { line, character }
    }
}
