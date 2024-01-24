import { LocalesArg } from '../internal/formatIntl'
import { DiffOptions, InstantDisplayOptions, RoundingOptions } from '../internal/optionsRefine'
import { requireObjectlike } from '../internal/cast'
import { NumSign, isObjectLike } from '../internal/utils'
import { UnitName, nanoInMilli } from '../internal/units'
import { numberToDayTimeNano } from '../internal/dayTimeNano'
import { InstantBranding, InstantSlots, ZonedDateTimeBranding, ZonedDateTimeSlots, createInstantSlots } from '../internal/slots'
import { createSlotClass, getSlots } from './slotsForClasses'
import { CalendarSlot, refineCalendarSlot } from './slotsForClasses'
import { TimeZoneSlot, refineTimeZoneSlot } from './slotsForClasses'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { TimeZoneArg } from './timeZone'
import { CalendarArg } from './calendar'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'
import { epochGetters, neverValueOf } from './mixins'
import { createSimpleTimeZoneOps } from './timeZoneOpsQuery'
import { constructInstantSlots } from '../internal/construct'
import { moveInstant } from '../internal/move'
import { diffInstants } from '../internal/diff'
import { roundInstant } from '../internal/round'
import { compareInstants, instantsEqual } from '../internal/compare'
import { formatInstantIso } from '../internal/formatIso'
import { epochMicroToInstant, epochMilliToInstant, epochNanoToInstant, epochSecToInstant, instantToZonedDateTime } from '../internal/convert'
import { parseInstant } from '../internal/parseIso'
import { prepInstantFormat } from './dateTimeFormat'

export type Instant = any
export type InstantArg = Instant | string

export const [Instant, createInstant, getInstantSlots] = createSlotClass(
  InstantBranding,
  constructInstantSlots,
  epochGetters,
  {
    add(slots: InstantSlots, durationArg: DurationArg): Instant {
      return createInstant(
        moveInstant(false, slots, toDurationSlots(durationArg)),
      )
    },
    subtract(slots: InstantSlots, durationArg: DurationArg): Instant {
      return createInstant(
        moveInstant(true, slots, toDurationSlots(durationArg)),
      )
    },
    until(slots: InstantSlots, otherArg: InstantArg, options?: DiffOptions): Duration {
      return createDuration(
        diffInstants(false, slots, toInstantSlots(otherArg), options),
      )
    },
    since(slots: InstantSlots, otherArg: InstantArg, options?: DiffOptions): Duration {
      return createDuration(
        diffInstants(true, slots, toInstantSlots(otherArg), options),
      )
    },
    round(slots: InstantSlots, options: RoundingOptions | UnitName): Instant {
      return createInstant(
        roundInstant(slots, options),
      )
    },
    equals(slots: InstantSlots, otherArg: InstantArg): boolean {
      return instantsEqual(slots, toInstantSlots(otherArg))
    },
    toString(slots: InstantSlots, options?: InstantDisplayOptions<TimeZoneSlot>): string {
      return formatInstantIso(refineTimeZoneSlot, createSimpleTimeZoneOps, slots, options)
    },
    toJSON(slots: InstantSlots): string {
      return formatInstantIso(refineTimeZoneSlot, createSimpleTimeZoneOps, slots)
    },
    toLocaleString(slots: InstantSlots, locales?: LocalesArg, options?: Intl.DateTimeFormatOptions): string {
      const [format, epochMilli] =  prepInstantFormat(locales, options, slots)
      return format.format(epochMilli)
    },
    toZonedDateTimeISO(slots: InstantSlots, timeZoneArg: TimeZoneArg): ZonedDateTime {
      return createZonedDateTime(
        instantToZonedDateTime(slots, refineTimeZoneSlot(timeZoneArg)),
      )
    },
    toZonedDateTime(slots: InstantSlots, options: { timeZone: TimeZoneArg, calendar: CalendarArg }): ZonedDateTime {
      const refinedObj = requireObjectlike(options)

      return createZonedDateTime(
        instantToZonedDateTime(
          slots,
          refineTimeZoneSlot(refinedObj.timeZone),
          refineCalendarSlot(refinedObj.calendar),
        )
      )
    },
    valueOf: neverValueOf,
  },
  {
    from(arg: InstantArg) {
      return createInstant(toInstantSlots(arg))
    },
    fromEpochSeconds(epochSec: number): Instant {
      return createInstant(epochSecToInstant(epochSec))
    },
    fromEpochMilliseconds(epochMilli: number): Instant {
      return createInstant(epochMilliToInstant(epochMilli))
    },
    fromEpochMicroseconds(epochMicro: bigint): Instant {
      return createInstant(epochMicroToInstant(epochMicro))
    },
    fromEpochNanoseconds(epochNano: bigint): Instant {
      return createInstant(epochNanoToInstant(epochNano))
    },
    compare(a: InstantArg, b: InstantArg): NumSign {
      return compareInstants(toInstantSlots(a), toInstantSlots(b))
    }
  }
)

// Utils
// -------------------------------------------------------------------------------------------------

export function toInstantSlots(arg: InstantArg): InstantSlots {
  if (isObjectLike(arg)) {
    const slots = getSlots(arg)
    if (slots) {
      switch (slots.branding) {
        case InstantBranding:
          return slots as InstantSlots

        case ZonedDateTimeBranding:
          return createInstantSlots((slots as ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>).epochNanoseconds)
      }
    }
  }
  return parseInstant(arg as any)
}

// Legacy Date
// -------------------------------------------------------------------------------------------------

export function toTemporalInstant(this: Date): Instant {
  return createInstant(
    createInstantSlots(
      numberToDayTimeNano(this.valueOf(), nanoInMilli),
    )
  )
}
