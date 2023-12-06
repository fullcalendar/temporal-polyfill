import { DayTimeNano } from '../internal/dayTimeNano'
import { IsoDateTimeFields } from '../internal/isoFields'
import { TimeZoneImpl, queryTimeZoneImpl } from '../internal/timeZoneImpl'

// TimeZoneImpl Record Creation
// -------------------------------------------------------------------------------------------------
// TODO: more DRY

export type TimeZoneImplFunc = (timeZoneImpl: TimeZoneImpl, ...args: any[]) => any

export type TimeZoneImplMethod<Func> =
  Func extends (timeZoneImpl: TimeZoneImpl, ...args: infer Args) => infer Ret
    ? (...args: Args) => Ret
    : never

export function createTimeZoneImplRecord<
  TimeZoneImplFuncs extends Record<string, TimeZoneImplFunc>
>(
  timeZoneId: string,
  funcs: TimeZoneImplFuncs = {} as any,
): {
  [K in keyof TimeZoneImplFuncs]: TimeZoneImplMethod<TimeZoneImplFuncs[K]>
} & {
  id: string
} {
  const timeZoneImpl = queryTimeZoneImpl(timeZoneId)
  const timeZoneRecord: any = {
    id: timeZoneImpl.id, // normalized (needed?)
  }

  for (const methodName in funcs) {
    timeZoneRecord[methodName] = funcs[methodName].bind(timeZoneImpl)
  }

  return timeZoneRecord
}

// TimeZoneImpl Functions
// -------------------------------------------------------------------------------------------------

export function timeZoneImplGetOffsetNanosecondsFor(
  timeZoneImpl: TimeZoneImpl,
  epochNano: DayTimeNano,
): number {
  return timeZoneImpl.getOffsetNanosecondsFor(epochNano)
}

export function timeZoneImplGetPossibleInstantsFor(
  timeZoneImpl: TimeZoneImpl,
  isoFields: IsoDateTimeFields,
): DayTimeNano[] {
  return timeZoneImpl.getPossibleInstantsFor(isoFields)
}
