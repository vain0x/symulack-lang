// 仮実装
export const parse = (text: string) => {
    const exitCode = Number.parseInt(text)
    if (Number.isNaN(exitCode)) {
        return {
            exitCode: 0,
            errors: [
                "数値が必要です。",
            ],
        }
    }

    return {
        exitCode,
        errors: [],
    }
}
