import { isoCalendarId } from '../internal/calendarConfig'
import { DayTimeNano } from '../internal/dayTimeNano'
import { IsoDateTimeFields } from '../internal/isoFields'
import { Callable, bindArgs } from '../internal/utils'
import { Instant, createInstant, getInstantSlots } from './instant'
import { createPlainDateTime } from './plainDateTime'
import { TimeZoneProtocol } from './timeZoneProtocol'
import { requireFunction, requireInteger } from '../internal/cast'
import { createInstantSlots, createPlainDateTimeSlots } from '../internal/slots'
import { validateTimeZoneOffset } from '../internal/timeZoneOps'

// Individual Adapters
// -------------------------------------------------------------------------------------------------

function getOffsetNanosecondsForAdapter(
  timeZoneProtocol: TimeZoneProtocol,
  getOffsetNanosecondsFor: TimeZoneProtocol['getOffsetNanosecondsFor'],
  epochNano: DayTimeNano,
): number {
  return validateTimeZoneOffsetRes(
    getOffsetNanosecondsFor.call(
      timeZoneProtocol,
      createInstant(createInstantSlots(epochNano))
    )
  )
}

function getPossibleInstantsForAdapter(
  timeZoneProtocol: TimeZoneProtocol,
  getPossibleInstantsFor: TimeZoneProtocol['getPossibleInstantsFor'],
  isoFields: IsoDateTimeFields,
): DayTimeNano[] {
  return [
    ...getPossibleInstantsFor.call(
      timeZoneProtocol,
      createPlainDateTime(
        createPlainDateTimeSlots(isoFields, isoCalendarId)
      )
    )
  ].map((instant: Instant) => {
    return getInstantSlots(instant).epochNanoseconds
  })
}

function validateTimeZoneOffsetRes(offsetNano: number): number {
  return validateTimeZoneOffset(requireInteger(offsetNano))
}

// Adapter Sets
// -------------------------------------------------------------------------------------------------

export const timeZoneAdapters = {
  getOffsetNanosecondsFor: getOffsetNanosecondsForAdapter,
  getPossibleInstantsFor: getPossibleInstantsForAdapter,
}

// TODO: rename to be about 'offset'
export const simpleTimeZoneAdapters = {
  getOffsetNanosecondsFor: getOffsetNanosecondsForAdapter,
}

// Adapter Instantiation
// -------------------------------------------------------------------------------------------------

export type AdapterOps<KV> = {
  [K in keyof KV]:
    KV[K] extends (tz: TimeZoneProtocol, m: Callable, ...args: infer Args) => infer Return
      ? (...args: Args) => Return
      : never
}

export function createAdapterOps<KV extends {} = typeof timeZoneAdapters>(
  timeZoneProtocol: TimeZoneProtocol,
  adapterFuncs: KV = timeZoneAdapters as any,
): AdapterOps<KV> {
  const keys = Object.keys(adapterFuncs).sort()
  const boundFuncs = {} as any

  for (const key of keys) {
    boundFuncs[key] = bindArgs(
      (adapterFuncs as any)[key],
      timeZoneProtocol,
      requireFunction((timeZoneProtocol as any)[key]),
    )
  }

  return boundFuncs
}
