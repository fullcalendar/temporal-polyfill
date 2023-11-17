import { DayTimeNano } from './dayTimeNano'
import { IsoDateTimeSlots } from './slots'
import { TimeZoneImpl, queryTimeZoneImpl } from './timeZoneImpl'

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
  funcs: TimeZoneImplFuncs,
): {
  [K in keyof TimeZoneImplFuncs]: TimeZoneImplMethod<TimeZoneImplFuncs[K]>
} {
  const timeZoneImpl = queryTimeZoneImpl(timeZoneId)
  const timeZoneRecord: any = {}

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
  isoDateTimeSlots: IsoDateTimeSlots, // needs calendar i think
): DayTimeNano[] {
  return timeZoneImpl.getPossibleInstantsFor(isoDateTimeSlots)
}
