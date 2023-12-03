import { isoCalendarId } from '../internal/calendarConfig'
import { diffInstants } from '../internal/diff'
import { negateDurationInternals } from '../internal/durationFields'
import { formatInstantIso } from '../internal/isoFormat'
import { LocalesArg, prepInstantFormat } from '../internal/intlFormat'
import { checkEpochNanoInBounds } from '../internal/isoMath'
import { parseInstant } from '../internal/isoParse'
import { moveEpochNano } from '../internal/move'
import {
  DiffOptions,
  RoundingOptions,
  TimeDisplayOptions,
  TimeDisplayTuple,
  normalizeOptions,
  prepareOptions,
  refineTimeDisplayTuple,
} from '../internal/options'
import { toBigInt, ensureObjectlike, ensureStringViaPrimitive } from '../internal/cast'
import { roundEpochNano } from '../internal/round'
import { NumSign, defineGetters, defineProps, defineStringTag, isObjectlike } from '../internal/utils'
import { UnitName, nanoInMicro, nanoInMilli, nanoInSec } from '../internal/units'
import { bigIntToDayTimeNano, compareDayTimeNanos, numberToDayTimeNano } from '../internal/dayTimeNano'
import { utcTimeZoneId } from '../internal/timeZoneConfig'
import { timeZoneImplGetOffsetNanosecondsFor } from '../internal/timeZoneRecordSimple'
import { InstantSlots, ZonedDateTimeSlots } from '../genericApi/genericTypes'

// public
import { createViaSlots, getSlots, getSpecificSlots, setSlots } from './slots'
import { DurationBranding, InstantBranding, ZonedDateTimeBranding } from '../genericApi/branding'
import { CalendarSlot, refineCalendarSlot } from './calendarSlot'
import { TimeZoneSlot, refineTimeZoneSlot } from './timeZoneSlot'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { TimeZoneArg } from './timeZone'
import { CalendarArg } from './calendar'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'
import { createEpochGetterMethods, neverValueOf } from './publicMixins'
import { createTimeZoneSlotRecord, timeZoneProtocolGetOffsetNanosecondsFor } from './timeZoneRecordComplex'

export type InstantArg = Instant | string

export class Instant {
  constructor(epochNano: bigint) {
    setSlots(this, {
      branding: InstantBranding,
      epochNanoseconds: checkEpochNanoInBounds(bigIntToDayTimeNano(toBigInt(epochNano))),
    } as InstantSlots)
  }

  add(durationArg: DurationArg): Instant {
    return createInstant({
      branding: InstantBranding,
      epochNanoseconds: moveEpochNano(
        getInstantSlots(this).epochNanoseconds,
        toDurationSlots(durationArg),
      ),
    })
  }

  subtract(durationArg: DurationArg): Instant {
    return createInstant({
      branding: InstantBranding,
      epochNanoseconds: moveEpochNano(
        getInstantSlots(this).epochNanoseconds,
        negateDurationInternals(toDurationSlots(durationArg)),
      ),
    })
  }

  until(otherArg: InstantArg, options?: DiffOptions): Duration {
    return createDuration({
      branding: DurationBranding,
      ...diffInstants(
        getInstantSlots(this).epochNanoseconds,
        toInstantSlots(otherArg).epochNanoseconds,
        prepareOptions(options),
      ),
    })
  }

  since(otherArg: InstantArg, options?: DiffOptions): Duration {
    return createDuration({
      branding: DurationBranding,
      ...diffInstants(
        getInstantSlots(this).epochNanoseconds,
        toInstantSlots(otherArg).epochNanoseconds,
        prepareOptions(options),
        true,
      )
    })
  }

  round(options: RoundingOptions | UnitName): Instant {
    return createInstant({
      branding: InstantBranding,
      epochNanoseconds: roundEpochNano(getInstantSlots(this).epochNanoseconds, options),
    })
  }

  equals(otherArg: InstantArg): boolean {
    return !compareDayTimeNanos(
      getInstantSlots(this).epochNanoseconds,
      toInstantSlots(otherArg).epochNanoseconds,
    )
  }

  toString(options?: InstantDisplayOptions): string {
    const slots = getInstantSlots(this)
    const [
      timeZoneArg,
      nanoInc,
      roundingMode,
      subsecDigits,
    ] = refineInstantDisplayOptions(options)

    const providedTimeZone = timeZoneArg !== undefined
    const timeZoneRecord = createTimeZoneSlotRecord(
      providedTimeZone ? refineTimeZoneSlot(timeZoneArg) : utcTimeZoneId,
      { getOffsetNanosecondsFor: timeZoneImplGetOffsetNanosecondsFor },
      { getOffsetNanosecondsFor: timeZoneProtocolGetOffsetNanosecondsFor },
    )

    return formatInstantIso(
      providedTimeZone,
      timeZoneRecord,
      slots.epochNanoseconds,
      nanoInc,
      roundingMode,
      subsecDigits,
    )
  }

  toJSON(): string {
    const slots = getInstantSlots(this)
    const [
      timeZoneArg,
      nanoInc,
      roundingMode,
      subsecDigits,
    ] = refineInstantDisplayOptions(undefined) // CRAZY

    const providedTimeZone = timeZoneArg !== undefined
    const timeZoneRecord = createTimeZoneSlotRecord(
      providedTimeZone ? refineTimeZoneSlot(timeZoneArg) : utcTimeZoneId,
      { getOffsetNanosecondsFor: timeZoneImplGetOffsetNanosecondsFor },
      { getOffsetNanosecondsFor: timeZoneProtocolGetOffsetNanosecondsFor },
    )

    return formatInstantIso(
      providedTimeZone,
      timeZoneRecord,
      slots.epochNanoseconds,
      nanoInc,
      roundingMode,
      subsecDigits,
    )
  }

  toLocaleString(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions): string {
    const [format, epochMilli] =  prepInstantFormat(locales, options, getInstantSlots(this))
    return format.format(epochMilli)
  }

  toZonedDateTimeISO(timeZoneArg: TimeZoneArg): ZonedDateTime {
    return createZonedDateTime({
      branding: ZonedDateTimeBranding,
      epochNanoseconds: getInstantSlots(this).epochNanoseconds,
      timeZone: refineTimeZoneSlot(timeZoneArg),
      calendar: isoCalendarId,
    })
  }

  toZonedDateTime(options: { timeZone: TimeZoneArg, calendar: CalendarArg }): ZonedDateTime {
    const slots = getInstantSlots(this)
    const refinedObj = ensureObjectlike(options)

    return createZonedDateTime({
      branding: ZonedDateTimeBranding,
      epochNanoseconds: slots.epochNanoseconds,
      timeZone: refineTimeZoneSlot(refinedObj.timeZone),
      calendar: refineCalendarSlot(refinedObj.calendar),
    })
  }

  static from(arg: InstantArg) {
    return createInstant(toInstantSlots(arg))
  }

  static fromEpochSeconds(epochSec: number): Instant {
    return createInstant({
      branding: InstantBranding,
      epochNanoseconds: checkEpochNanoInBounds(numberToDayTimeNano(epochSec, nanoInSec))
    })
  }

  static fromEpochMilliseconds(epochMilli: number): Instant {
    return createInstant({
      branding: InstantBranding,
      epochNanoseconds: checkEpochNanoInBounds(numberToDayTimeNano(epochMilli, nanoInMilli)),
    })
  }

  static fromEpochMicroseconds(epochMicro: bigint): Instant {
    return createInstant({
      branding: InstantBranding,
      epochNanoseconds: checkEpochNanoInBounds(bigIntToDayTimeNano(toBigInt(epochMicro), nanoInMicro))
    })
  }

  static fromEpochNanoseconds(epochNano: bigint): Instant {
    return createInstant({
      branding: InstantBranding,
      epochNanoseconds: checkEpochNanoInBounds(bigIntToDayTimeNano(toBigInt(epochNano))),
    })
  }

  static compare(a: InstantArg, b: InstantArg): NumSign {
    return compareDayTimeNanos(
      toInstantSlots(a).epochNanoseconds,
      toInstantSlots(b).epochNanoseconds,
    )
  }
}

defineStringTag(Instant.prototype, InstantBranding)

defineProps(Instant.prototype, {
  valueOf: neverValueOf,
})

defineGetters(
  Instant.prototype,
  createEpochGetterMethods(InstantBranding),
)

// Utils
// -------------------------------------------------------------------------------------------------

export function createInstant(slots: InstantSlots): Instant {
  return createViaSlots(Instant, slots)
}

export function getInstantSlots(instant: Instant): InstantSlots {
  return getSpecificSlots(InstantBranding, instant) as InstantSlots
}

export function toInstantSlots(arg: InstantArg): InstantSlots {
  if (isObjectlike(arg)) {
    const slots = getSlots(arg)
    if (slots) {
      switch (slots.branding) {
        case InstantBranding:
          return slots as InstantSlots
        case ZonedDateTimeBranding:
          return { epochNanoseconds: (slots as ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>).epochNanoseconds, branding: InstantBranding }
      }
    }
  }
  return {
    branding: InstantBranding,
    epochNanoseconds: parseInstant(ensureStringViaPrimitive(arg as any)),
  }
}

export type InstantDisplayOptions =
  { timeZone: TimeZoneArg } &
  TimeDisplayOptions

export type InstantDisplayTuple = [
  TimeZoneArg,
  ...TimeDisplayTuple,
]

export function refineInstantDisplayOptions(
  options: InstantDisplayOptions | undefined,
): InstantDisplayTuple {
  options = normalizeOptions(options)

  // alphabetical
  const timeDisplayTuple = refineTimeDisplayTuple(options)
  const timeZone: TimeZoneArg = options.timeZone

  return [
    timeZone, // TODO: possibly not needed after moving away from Record
    ...timeDisplayTuple,
  ]
}

// Legacy Date
// -------------------------------------------------------------------------------------------------

// TODO: more DRY
export function toTemporalInstant(this: Date): Instant {
  return createInstant({
    branding: InstantBranding,
    epochNanoseconds: numberToDayTimeNano(this.valueOf(), nanoInMilli),
  })
}
