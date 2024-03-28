import {
  BigNano,
  bigNanoToNumber,
  compareBigNanos,
  diffBigNanos,
} from '../internal/bigNano'
import { isoCalendarId } from '../internal/calendarConfig'
import { requireFunction, requireInteger } from '../internal/cast'
import { IsoDateTimeFields } from '../internal/isoFields'
import { createInstantSlots, createPlainDateTimeSlots } from '../internal/slots'
import {
  validateTimeZoneGap,
  validateTimeZoneOffset,
} from '../internal/timeZoneOps'
import { Callable, bindArgs } from '../internal/utils'
import { Instant, createInstant, getInstantSlots } from './instant'
import { createPlainDateTime } from './plainDateTime'
import { TimeZoneProtocol } from './timeZone'

// Individual Adapters
// -----------------------------------------------------------------------------

function getOffsetNanosecondsForAdapter(
  timeZoneProtocol: TimeZoneProtocol,
  getOffsetNanosecondsFor: TimeZoneProtocol['getOffsetNanosecondsFor'],
  epochNano: BigNano,
): number {
  return validateTimeZoneOffsetRes(
    getOffsetNanosecondsFor.call(
      timeZoneProtocol,
      createInstant(createInstantSlots(epochNano)),
    ),
  )
}

function getPossibleInstantsForAdapter(
  timeZoneProtocol: TimeZoneProtocol,
  getPossibleInstantsFor: TimeZoneProtocol['getPossibleInstantsFor'],
  isoFields: IsoDateTimeFields,
): BigNano[] {
  const epochNanos: BigNano[] = [
    ...getPossibleInstantsFor.call(
      timeZoneProtocol,
      createPlainDateTime(createPlainDateTimeSlots(isoFields, isoCalendarId)),
    ),
  ].map((instant: Instant) => {
    return getInstantSlots(instant).epochNanoseconds
  })

  // Ensure no two instants are more than 24hrs apart
  const epochNanoLen = epochNanos.length
  if (epochNanoLen > 1) {
    epochNanos.sort(compareBigNanos)

    validateTimeZoneGap(
      bigNanoToNumber(
        diffBigNanos(epochNanos[0], epochNanos[epochNanoLen - 1]),
      ),
    )
  }

  return epochNanos
}

function validateTimeZoneOffsetRes(offsetNano: number): number {
  return validateTimeZoneOffset(requireInteger(offsetNano))
}

// Adapter Sets
// -----------------------------------------------------------------------------

export const timeZoneAdapters = {
  getOffsetNanosecondsFor: getOffsetNanosecondsForAdapter,
  getPossibleInstantsFor: getPossibleInstantsForAdapter,
}

// TODO: rename to be about 'offset'
export const simpleTimeZoneAdapters = {
  getOffsetNanosecondsFor: getOffsetNanosecondsForAdapter,
}

// Adapter Instantiation
// -----------------------------------------------------------------------------

export type AdapterOps<KV> = {
  [K in keyof KV]: KV[K] extends (
    tz: TimeZoneProtocol,
    m: Callable,
    ...args: infer Args
  ) => infer Return
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
