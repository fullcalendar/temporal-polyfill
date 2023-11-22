import { isoCalendarId } from '../internal/calendarConfig'
import { DayTimeNano } from '../internal/dayTimeNano'
import { IsoDateTimeFields } from '../internal/isoFields'
import { TimeZoneImpl } from '../internal/timeZoneImpl'
import { validateOffsetNano } from '../internal/timeZoneMath'
import { TimeZoneImplFunc, TimeZoneImplMethod, createTimeZoneImplRecord } from '../internal/timeZoneRecordSimple'

// public
import { InstantBranding, PlainDateTimeBranding } from '../genericApi/branding'
import { TimeZoneSlot } from './timeZoneSlot'
import { Instant, createInstant, getInstantSlots } from './instant'
import { createPlainDateTime } from './plainDateTime'
import { TimeZoneProtocol } from './timeZone'
import { ensureString } from '../internal/cast'

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
  implFuncs: TimeZoneImplFuncs = {} as any,
  protocolFuncs: {
    [K in keyof TimeZoneImplFuncs]: TimeZoneProtocolFuncViaImpl<TimeZoneImplFuncs[K]>
  } = {} as any,
): {
  [K in keyof TimeZoneImplFuncs]: TimeZoneImplMethod<TimeZoneImplFuncs[K]>
} & {
  id: string
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
): {
  [FuncName in keyof Funcs]: TimeZoneProtocolMethod<Funcs[FuncName]>
} & {
  id: string
} {
  const timeZoneRecord: any = {
    get id() { return ensureString(timeZoneProtocol.id) }
  }

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
  isoFields: IsoDateTimeFields,
): DayTimeNano[] {
  return [...timeZoneProtocol.getPossibleInstantsFor(
    createPlainDateTime({
      ...isoFields,
      branding: PlainDateTimeBranding,
      calendar: isoCalendarId, // BAD, will need original slot
    })
  )].map((instant: Instant) => {
    return getInstantSlots(instant).epochNanoseconds
  })
}
