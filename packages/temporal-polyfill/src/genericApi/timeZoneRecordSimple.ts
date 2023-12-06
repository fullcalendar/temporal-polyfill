import { TimeZoneImpl } from '../internal/timeZoneImpl'

export type TimeZoneImplFunc = (timeZoneImpl: TimeZoneImpl, ...args: any[]) => any

export type TimeZoneImplMethod<Func> =
  Func extends (timeZoneImpl: TimeZoneImpl, ...args: infer Args) => infer Ret
    ? (...args: Args) => Ret
    : never
