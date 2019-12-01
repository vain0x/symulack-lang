/**
 * この関数が呼び出されることがない、ということを TypeScript コンパイラはコンパイル時に検査する。
 *
 * 条件分岐の網羅性を保証するのに使う。
 */
export const never = (bot: never) => bot
