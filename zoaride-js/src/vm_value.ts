// 実行時のオブジェクト

export type VmValue =
    | {
        kind: "V_NUMBER"
        value: number
    }
    | {
        kind: "V_REF"
        ident: string
    }

export const VALUE_ZERO: VmValue = {
    kind: "V_NUMBER",
    value: 0,
}
