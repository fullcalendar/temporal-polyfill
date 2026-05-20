import { InstantBranding, ZonedDateTimeBranding } from '../apiHelpers/branding'
import { epochGetters } from '../apiHelpers/mixins'
import { createSlotClass, getBrandingAndSlots } from '../apiHelpers/slotClass'
import { bigNanoInMilli } from '../internal/bigNano'
import { requireNumberIsInteger } from '../internal/cast'
import { compareInstants, instantsEqual } from '../internal/compare'
import { constructEpochNanoSlots } from '../internal/construct'
import {
  epochMilliToInstant,
  epochNanoToInstant,
  instantToZonedDateTime,
} from '../internal/convert'
import { diffInstants } from '../internal/diff'
import { InternalCalendar } from '../internal/externalCalendar'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatInstantIso } from '../internal/isoFormat'
import { parseInstant } from '../internal/isoParse'
import { moveInstant } from '../internal/move'
import { DiffOptions, RoundingOptions } from '../internal/optionsModel'
import { roundInstant } from '../internal/round'
import {
  EpochNanoFields,
  ZonedEpochNanoFields,
  createEpochNanoSlots,
} from '../internal/slots'
import { queryTimeZone } from '../internal/timeZoneImpl'
import { TimeUnitName } from '../internal/units'
import { NumberSign, bindArgs, isObjectLike } from '../internal/utils'
import {
  Duration,
  DurationArg,
  createDuration,
  toDurationSlots,
} from './duration'
import { prepInstantFormat } from './intlFormatConfig'
import { TimeZoneArg, refineTimeZoneArg } from './timeZoneArg'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'

export type Instant = any
export type InstantArg = Instant | string

export const [Instant, createInstant] = createSlotClass(
  InstantBranding,
  constructEpochNanoSlots,
  bindArgs(formatInstantIso, refineTimeZoneArg),
  epochGetters,
  {
    add(slots: EpochNanoFields, durationArg: DurationArg): Instant {
      return createInstant(
        moveInstant(false, slots, toDurationSlots(durationArg)),
      )
    },
    subtract(slots: EpochNanoFields, durationArg: DurationArg): Instant {
      return createInstant(
        moveInstant(true, slots, toDurationSlots(durationArg)),
      )
    },
    until(
      slots: EpochNanoFields,
      otherArg: InstantArg,
      options?: DiffOptions<TimeUnitName>,
    ): Duration {
      return createDuration(
        diffInstants(false, slots, toInstantSlots(otherArg), options),
      )
    },
    since(
      slots: EpochNanoFields,
      otherArg: InstantArg,
      options?: DiffOptions<TimeUnitName>,
    ): Duration {
      return createDuration(
        diffInstants(true, slots, toInstantSlots(otherArg), options),
      )
    },
    round(
      slots: EpochNanoFields,
      options: TimeUnitName | RoundingOptions<TimeUnitName>,
    ): Instant {
      return createInstant(roundInstant(slots, options))
    },
    equals(slots: EpochNanoFields, otherArg: InstantArg): boolean {
      return instantsEqual(slots, toInstantSlots(otherArg))
    },
    toZonedDateTimeISO(
      slots: EpochNanoFields,
      timeZoneArg: TimeZoneArg,
    ): ZonedDateTime {
      return createZonedDateTime(
        instantToZonedDateTime(
          slots,
          queryTimeZone(refineTimeZoneArg(timeZoneArg)),
        ),
      )
    },
    toLocaleString(
      slots: EpochNanoFields,
      locales?: LocalesArg,
      options?: Intl.DateTimeFormatOptions,
    ): string {
      const [format, epochMilli] = prepInstantFormat(locales, options, slots)
      return format.format(epochMilli)
    },
  },
  {
    from(arg: InstantArg) {
      return createInstant(toInstantSlots(arg))
    },
    fromEpochMilliseconds(epochMilli: number): Instant {
      return createInstant(epochMilliToInstant(epochMilli))
    },
    fromEpochNanoseconds(epochNano: bigint): Instant {
      return createInstant(epochNanoToInstant(epochNano))
    },
    compare(a: InstantArg, b: InstantArg): NumberSign {
      return compareInstants(toInstantSlots(a), toInstantSlots(b))
    },
  },
)

// Utils
// -----------------------------------------------------------------------------

export function toInstantSlots(arg: InstantArg): EpochNanoFields {
  if (isObjectLike(arg)) {
    const brandingAndSlots = getBrandingAndSlots(arg)
    if (brandingAndSlots) {
      const [branding, slots] = brandingAndSlots
      switch (branding) {
        case InstantBranding:
          return slots as EpochNanoFields

        case ZonedDateTimeBranding:
          return createEpochNanoSlots(
            (slots as ZonedEpochNanoFields & { calendar: InternalCalendar })
              .epochNanoseconds,
          )
      }
    }
  }
  return parseInstant(arg as any)
}

// Legacy Date
// -----------------------------------------------------------------------------

export function toTemporalInstant(this: Date): Instant {
  const epochMilli = Date.prototype.valueOf.call(this) // will error if not Date

  // TODO: better error message instead of "non-integer number" or whatever?

  return createInstant(
    createEpochNanoSlots(
      BigInt(requireNumberIsInteger(epochMilli)) * bigNanoInMilli,
    ),
  )
}
