import { isoCalendarId } from '../internal/calendarConfig'
import { DayTimeNano } from '../internal/dayTimeNano'
import { IsoDateTimeFields } from '../internal/calendarIsoFields'
import { Callable, bindArgs } from '../internal/utils'
import { Instant, createInstant, getInstantSlots } from './instant'
import { createPlainDateTime } from './plainDateTime'
import { TimeZoneProtocol } from './timeZoneProtocol'
import { requireFunction, requireNumber } from '../internal/cast'
import { nanoInUtcDay } from '../internal/units'
import { InstantBranding, PlainDateTimeBranding, createInstantX, createPlainDateTimeX } from '../internal/slots'

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
      createInstant(createInstantX(epochNano))
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
      createPlainDateTime(
        createPlainDateTimeX(isoFields, isoCalendarId)
      )
    )
  ].map((instant: Instant) => {
    return getInstantSlots(instant).epochNanoseconds
  })
}

export function validateOffsetNano(offsetNano: number): number {
  // TODO: use util for this?
  if (!Number.isInteger(requireNumber(offsetNano))) {
    throw new RangeError('must be integer number')
  }

  // TODO: DRY with string parsing?
  if (Math.abs(offsetNano) >= nanoInUtcDay) {
    throw new RangeError('out of range')
  }

  return offsetNano
}

// Adapter Sets
// -------------------------------------------------------------------------------------------------

export const timeZoneAdapters = {
  getOffsetNanosecondsFor: adapterGetOffsetNanosecondsFor,
  getPossibleInstantsFor: adapterGetPossibleInstantsFor,
}

// TODO: rename to be about 'offset'
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

export function createAdapterOps<KV extends {} = typeof timeZoneAdapters>(
  timeZoneProtocol: TimeZoneProtocol,
  adapterFuncs: KV = timeZoneAdapters as any,
): AdapterOps<KV> {
  const keys = Object.keys(adapterFuncs).sort()
  const boundFuncs = {} as any

  // TODO: use mapProps?
  for (const key of keys) {
    boundFuncs[key] = bindArgs(
      (adapterFuncs as any)[key],
      timeZoneProtocol,
      requireFunction((timeZoneProtocol as any)[key]),
    )
  }

  return boundFuncs
}
