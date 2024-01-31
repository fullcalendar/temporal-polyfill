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
import { UnitName } from '../internal/units'
import { NumberSign, isObjectLike } from '../internal/utils'
import { CalendarSlot } from './calendar'
import {
  Duration,
  DurationArg,
  createDuration,
  toDurationSlots,
} from './duration'
import { prepPlainTimeFormat } from './intlDateTimeFormat'
import { neverValueOf, removeBranding, timeGetters } from './mixins'
import { PlainDateArg, toPlainDateSlots } from './plainDate'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { createSlotClass, getSlots } from './slotClass'
import { TimeZoneArg, TimeZoneSlot, refineTimeZoneSlot } from './timeZone'
import { createTimeZoneOffsetOps, createTimeZoneOps } from './timeZoneOpsQuery'
import { rejectInvalidBag } from './utils'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'

export type PlainTime = any & TimeFields
export type PlainTimeArg = PlainTime | PlainTimeBag | string

export const [PlainTime, createPlainTime] = createSlotClass(
  PlainTimeBranding,
  constructPlainTimeSlots,
  timeGetters,
  {
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
      options?: DiffOptions,
    ): Duration {
      return createDuration(
        diffPlainTimes(false, slots, toPlainTimeSlots(otherArg), options),
      )
    },
    since(
      slots: PlainTimeSlots,
      otherArg: PlainTimeArg,
      options?: DiffOptions,
    ): Duration {
      return createDuration(
        diffPlainTimes(true, slots, toPlainTimeSlots(otherArg), options),
      )
    },
    round(
      slots: PlainTimeSlots,
      options: RoundingOptions | UnitName,
    ): PlainTime {
      return createPlainTime(roundPlainTime(slots, options))
    },
    equals(slots: PlainTimeSlots, other: PlainTimeArg): boolean {
      return plainTimesEqual(slots, toPlainTimeSlots(other))
    },
    toString: formatPlainTimeIso,
    toJSON(slots: PlainTimeSlots): string {
      return formatPlainTimeIso(slots)
    },
    toLocaleString(
      slots: PlainTimeSlots,
      locales?: LocalesArg,
      options?: Intl.DateTimeFormatOptions,
    ): string {
      const [format, epochMilli] = prepPlainTimeFormat(locales, options, slots)
      return format.format(epochMilli)
    },
    toZonedDateTime(
      slots: PlainTimeSlots,
      options: { timeZone: TimeZoneArg; plainDate: PlainDateArg },
    ): ZonedDateTime {
      return createZonedDateTime(
        plainTimeToZonedDateTime(
          refineTimeZoneSlot,
          toPlainDateSlots,
          createTimeZoneOps,
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
    getISOFields: removeBranding,
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
        return createPlainTimeSlots(slots as PlainDateTimeSlots<CalendarSlot>)

      case ZonedDateTimeBranding:
        refineOverflowOptions(options) // parse unused options
        return zonedDateTimeToPlainTime(
          createTimeZoneOffsetOps,
          slots as ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>,
        )
    }

    return refinePlainTimeBag(arg as PlainTimeBag, options)
  }

  refineOverflowOptions(options) // parse unused options
  return parsePlainTime(arg)
}
