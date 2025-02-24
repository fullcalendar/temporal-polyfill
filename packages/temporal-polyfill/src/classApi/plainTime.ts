import {
  PlainTimeBag,
  plainTimeWithFields,
  refinePlainTimeBag,
} from '../internal/bagRefine'
import { compareIsoTimeFields, plainTimesEqual } from '../internal/compare'
import { constructPlainTimeSlots } from '../internal/construct'
import {
  plainTimeToPlainDateTime,
  plainTimeToZonedDateTime,
  zonedDateTimeToPlainTime,
} from '../internal/convert'
import { diffPlainTimes } from '../internal/diff'
import { TimeBag, TimeFields } from '../internal/fields'
import { LocalesArg } from '../internal/intlFormatUtils'
import { IsoTimeFields } from '../internal/isoFields'
import { formatPlainTimeIso } from '../internal/isoFormat'
import { parsePlainTime } from '../internal/isoParse'
import { movePlainTime } from '../internal/move'
import {
  DiffOptions,
  OverflowOptions,
  RoundingOptions,
  refineOverflowOptions,
} from '../internal/optionsRefine'
import { roundPlainTime } from '../internal/round'
import {
  BrandingSlots,
  PlainDateTimeBranding,
  PlainDateTimeSlots,
  PlainTimeBranding,
  PlainTimeSlots,
  ZonedDateTimeBranding,
  ZonedDateTimeSlots,
  createPlainTimeSlots,
} from '../internal/slots'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { TimeUnitName } from '../internal/units'
import { NumberSign, isObjectLike } from '../internal/utils'
import {
  Duration,
  DurationArg,
  createDuration,
  toDurationSlots,
} from './duration'
import { prepPlainTimeFormat } from './intlFormatConfig'
import { neverValueOf, removeBranding, timeGetters } from './mixins'
import { PlainDateArg, toPlainDateSlots } from './plainDate'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { createSlotClass, getSlots, rejectInvalidBag } from './slotClass'
import { TimeZoneArg, refineTimeZoneArg } from './timeZoneArg'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'

export type PlainTime = any & TimeFields
export type PlainTimeArg = PlainTime | PlainTimeBag | string

export const [PlainTime, createPlainTime] = createSlotClass(
  PlainTimeBranding,
  constructPlainTimeSlots,
  timeGetters,
  {
    getISOFields: removeBranding,
    with(
      _slots: PlainTimeSlots,
      mod: TimeBag,
      options?: OverflowOptions,
    ): PlainTime {
      return createPlainTime(
        plainTimeWithFields(this, rejectInvalidBag(mod), options),
      )
    },
    add(slots: PlainTimeSlots, durationArg: DurationArg): PlainTime {
      return createPlainTime(
        movePlainTime(false, slots, toDurationSlots(durationArg)),
      )
    },
    subtract(slots: PlainTimeSlots, durationArg: DurationArg): PlainTime {
      return createPlainTime(
        movePlainTime(true, slots, toDurationSlots(durationArg)),
      )
    },
    until(
      slots: PlainTimeSlots,
      otherArg: PlainTimeArg,
      options?: DiffOptions<TimeUnitName>,
    ): Duration {
      return createDuration(
        diffPlainTimes(false, slots, toPlainTimeSlots(otherArg), options),
      )
    },
    since(
      slots: PlainTimeSlots,
      otherArg: PlainTimeArg,
      options?: DiffOptions<TimeUnitName>,
    ): Duration {
      return createDuration(
        diffPlainTimes(true, slots, toPlainTimeSlots(otherArg), options),
      )
    },
    round(
      slots: PlainTimeSlots,
      options: TimeUnitName | RoundingOptions<TimeUnitName>,
    ): PlainTime {
      return createPlainTime(roundPlainTime(slots, options))
    },
    equals(slots: PlainTimeSlots, other: PlainTimeArg): boolean {
      return plainTimesEqual(slots, toPlainTimeSlots(other))
    },
    toZonedDateTime(
      slots: PlainTimeSlots,
      options: { timeZone: TimeZoneArg; plainDate: PlainDateArg },
    ): ZonedDateTime {
      return createZonedDateTime(
        plainTimeToZonedDateTime(
          refineTimeZoneArg,
          toPlainDateSlots,
          queryNativeTimeZone,
          slots,
          options,
        ),
      )
    },
    toPlainDateTime(
      slots: PlainTimeSlots,
      plainDateArg: PlainDateArg,
    ): PlainDateTime {
      return createPlainDateTime(
        plainTimeToPlainDateTime(slots, toPlainDateSlots(plainDateArg)),
      )
    },
    toLocaleString(
      slots: PlainTimeSlots,
      locales?: LocalesArg,
      options?: Intl.DateTimeFormatOptions,
    ): string {
      const [format, epochMilli] = prepPlainTimeFormat(locales, options, slots)
      return format.format(epochMilli)
    },
    toString: formatPlainTimeIso,
    toJSON(slots: PlainTimeSlots): string {
      return formatPlainTimeIso(slots)
    },
    valueOf: neverValueOf,
  },
  {
    from(arg: PlainTimeArg, options?: OverflowOptions): PlainTime {
      return createPlainTime(toPlainTimeSlots(arg, options))
    },
    compare(arg0: PlainTimeArg, arg1: PlainTimeArg): NumberSign {
      return compareIsoTimeFields(
        toPlainTimeSlots(arg0),
        toPlainTimeSlots(arg1),
      )
    },
  },
)

// Utils
// -----------------------------------------------------------------------------

export function toPlainTimeSlots(
  arg: PlainTimeArg,
  options?: OverflowOptions,
): PlainTimeSlots {
  if (isObjectLike(arg)) {
    const slots = (getSlots(arg) || {}) as Partial<BrandingSlots>

    switch (slots.branding) {
      case PlainTimeBranding:
        refineOverflowOptions(options) // parse unused options
        return slots as PlainTimeSlots

      case PlainDateTimeBranding:
        refineOverflowOptions(options) // parse unused options
        return createPlainTimeSlots(slots as PlainDateTimeSlots)

      case ZonedDateTimeBranding:
        refineOverflowOptions(options) // parse unused options
        return zonedDateTimeToPlainTime(
          queryNativeTimeZone,
          slots as ZonedDateTimeSlots,
        )
    }

    return refinePlainTimeBag(arg as PlainTimeBag, options)
  }

  refineOverflowOptions(options) // parse unused options
  return parsePlainTime(arg)
}

export function optionalToPlainTimeFields(
  timeArg: PlainTimeArg | undefined,
): IsoTimeFields | undefined {
  return timeArg === undefined ? undefined : toPlainTimeSlots(timeArg)
}
