import { InstantBranding, PlainDateTimeBranding } from '../genericApi/branding'
import { isoCalendarId } from '../internal/calendarConfig'
import { DayTimeNano } from '../internal/dayTimeNano'
import { IsoDateTimeFields } from '../internal/isoFields'
import { validateOffsetNano } from '../internal/timeZoneOps'
import { Callable } from '../internal/utils'
import { Instant, createInstant, getInstantSlots } from './instant'
import { createPlainDateTime } from './plainDateTime'
import { TimeZoneProtocol } from './timeZoneProtocol'

// Individual Adapters
// -------------------------------------------------------------------------------------------------

function adapterGetOffsetNanosecondsFor(
  timeZoneProtocol: TimeZoneProtocol,
  getOffsetNanosecondsFor: TimeZoneProtocol['getOffsetNanosecondsFor'],
  epochNano: DayTimeNano,
): number {
  return validateOffsetNano(
    getOffsetNanosecondsFor.call(
      timeZoneProtocol,
      createInstant({
        branding: InstantBranding,
        epochNanoseconds: epochNano
      })
    )
  )
}

function adapterGetPossibleInstantsFor(
  timeZoneProtocol: TimeZoneProtocol,
  getPossibleInstantsFor: TimeZoneProtocol['getPossibleInstantsFor'],
  isoFields: IsoDateTimeFields,
): DayTimeNano[] {
  return [
    ...getPossibleInstantsFor.call(
      timeZoneProtocol,
      createPlainDateTime({
        ...isoFields,
        branding: PlainDateTimeBranding,
        calendar: isoCalendarId, // BAD, will need original slot
      })
    )
  ].map((instant: Instant) => {
    return getInstantSlots(instant).epochNanoseconds
  })
}

// Adapter Sets
// -------------------------------------------------------------------------------------------------

export const timeZoneAdapters = {
  getOffsetNanosecondsFor: adapterGetOffsetNanosecondsFor,
  getPossibleInstantsFor: adapterGetPossibleInstantsFor,
}

export const simpleTimeZoneAdapters = {
  getOffsetNanosecondsFor: adapterGetOffsetNanosecondsFor,
}

// Adapter Instantiation
// -------------------------------------------------------------------------------------------------

export type AdapterOps<KV> = {
  [K in keyof KV]:
    KV[K] extends (tz: TimeZoneProtocol, m: Callable, ...args: infer Args) => infer Return
      ? (...args: Args) => Return
      : never
}

export function createAdapterOps<KV extends {}>(
  timeZoneProtocol: TimeZoneProtocol,
  adapterFuncs: KV,
): AdapterOps<KV> {
  const keys = Object.keys(adapterFuncs).sort()
  const boundFuncs = {} as any

  // TODO: use mapProps?
  for (const key of keys) {
    boundFuncs[key] = (adapterFuncs as any)[key].bind(
      undefined,
      timeZoneProtocol,
      (timeZoneProtocol as any)[key],
    )
  }

  return boundFuncs
}
