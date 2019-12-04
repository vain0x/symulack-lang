import { writeTrace } from "./util_trace"

// デバッグの開始と終了

// 標準出力への書き込み
const writeToStdOut = (data: Uint8Array) => {
    process.stdout.write(data)
}

// 標準入力からの読み取り
const subscribeStdIn = (callback: (data: Uint8Array) => { rest: Uint8Array, resolve: () => void }) => {
    let buffer = new Uint8Array()

    process.stdin.on("data", chunk => {
        // バッファーにいま来たデータを連結する。
        buffer = Buffer.concat([buffer, chunk])

        // バッファー内のデータを使用して何らかの処理をし、残りの部分を受け取る。
        const { rest, resolve } = callback(buffer)
        buffer = rest

        resolve()
    })
}

/**
 * デバッグアダプターが起動されたとき
 */
export const dapMain = () => {
    writeTrace("dap")

    writeTrace("New Session", {
        cwd: process.cwd(),
        args: process.argv,
    })

    subscribeStdIn(data => {

    })
}
