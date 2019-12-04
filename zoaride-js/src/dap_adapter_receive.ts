import { parseDapMessage } from "./dap_parse"

/**
 * 開発ツールからデータが来たときの処理を行う。
 */
export const dapReceive = (data: Uint8Array): { rest: Uint8Array, resolve: () => void } => {
    const { msg, rest } = parseDapMessage(data)
    return {
        rest,
        resolve: () => processMsg(msg),
    }
}

const processMsg = async (msg: any) => {

}
