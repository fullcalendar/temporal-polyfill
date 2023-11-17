import { DayTimeNano } from '../internal/dayTimeNano'
import { InstantBranding, IsoDateTimeSlots, PlainDateTimeBranding } from '../internal/slots'
import { TimeZoneImpl } from '../internal/timeZoneImpl'
import { validateOffsetNano } from '../internal/timeZoneMath'
import { TimeZoneImplFunc, TimeZoneImplMethod, createTimeZoneImplRecord } from '../internal/timeZoneRecordSimple'
import { TimeZoneSlot } from '../internal/timeZoneSlot'

// public
import { Instant, createInstant, getInstantSlots } from './instant'
import { createPlainDateTime } from './plainDateTime'
import { TimeZoneProtocol } from './timeZone'

// CONDITIONAL Record Creation
// -------------------------------------------------------------------------------------------------
// TODO: more DRY

export type TimeZoneProtocolFuncViaImpl<ImplFunc> =
  ImplFunc extends (timeZoneImpl: TimeZoneImpl, ...args: infer Args) => infer Ret
    ? (timeZoneProtocol: TimeZoneProtocol, ...args: Args) => Ret
    : never

export function createTimeZoneSlotRecord<
  TimeZoneImplFuncs extends Record<string, TimeZoneImplFunc>
>(
  timeZoneSlot: TimeZoneSlot,
  implFuncs: TimeZoneImplFuncs,
  protocolFuncs: {
    [K in keyof TimeZoneImplFuncs]: TimeZoneProtocolFuncViaImpl<TimeZoneImplFuncs[K]>
  },
): {
  [K in keyof TimeZoneImplFuncs]: TimeZoneImplMethod<TimeZoneImplFuncs[K]>
} {
  if (typeof timeZoneSlot === 'string') {
    return createTimeZoneImplRecord(timeZoneSlot, implFuncs)
  }
  return createTimeZoneProtocolRecord(timeZoneSlot, protocolFuncs) as any
}

// TimeZoneProtocol Record Creation
// -------------------------------------------------------------------------------------------------
// TODO: more DRY

export type TimeZoneProtocolFunc = (timeZoneProtocol: TimeZoneProtocol, ...args: any[]) => any

export type TimeZoneProtocolMethod<Func> =
  Func extends (timeZoneProtocol: TimeZoneProtocol, ...args: infer Args) => infer Ret
    ? (...args: Args) => Ret
    : never

export function createTimeZoneProtocolRecord<Funcs extends { [funcName: string]: TimeZoneProtocolFunc }>(
  timeZoneProtocol: TimeZoneProtocol,
  funcs: Funcs,
): { [FuncName in keyof Funcs]: TimeZoneProtocolMethod<Funcs[FuncName]> } {
  const timeZoneRecord: any = {}

  for (const methodName in funcs) {
    timeZoneRecord[methodName] = funcs[methodName].bind(timeZoneProtocol)
  }

  return timeZoneRecord
}

// TimeZoneProtocol Functions
// -------------------------------------------------------------------------------------------------

export function timeZoneProtocolGetOffsetNanosecondsFor(
  timeZoneProtocol: TimeZoneProtocol,
  epochNano: DayTimeNano,
): number {
  return validateOffsetNano(
    timeZoneProtocol.getOffsetNanosecondsFor(
      createInstant({
        branding: InstantBranding,
        epochNanoseconds: epochNano
      })
    )
  )
}

export function timeZoneProtocolGetPossibleInstantsFor(
  timeZoneProtocol: TimeZoneProtocol,
  isoDateTimeSlots: IsoDateTimeSlots, // needs calendar i think
): DayTimeNano[] {
  return [...timeZoneProtocol.getPossibleInstantsFor(
    createPlainDateTime({
      ...isoDateTimeSlots,
      branding: PlainDateTimeBranding,
    })
  )].map((instant: Instant) => {
    return getInstantSlots(instant).epochNanoseconds
  })
}
