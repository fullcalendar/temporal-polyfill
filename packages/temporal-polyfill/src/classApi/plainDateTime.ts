import {
  compareIsoDateTimeFields,
  plainDateTimesEqual,
} from '../internal/compare'
import { constructPlainDateTimeSlots } from '../internal/construct'
import {
  plainDateTimeToZonedDateTime,
  zonedDateTimeToPlainDateTime,
} from '../internal/convert'
import { refinePlainDateTimeObjectLike } from '../internal/createFromFields'
import { diffPlainDateTimes } from '../internal/diff'
import { timeFieldDefaults } from '../internal/fieldNames'
import { DateLikeObject, DateTimeLikeObject } from '../internal/fieldTypes'
import { DateTimeFields } from '../internal/fieldTypes'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatPlainDateTimeIso } from '../internal/isoFormat'
import { parsePlainDateTime } from '../internal/isoParse'
import { mergePlainDateTimeFields } from '../internal/merge'
import {
  plainDateTimeWithPlainTime,
  slotsWithCalendarId,
} from '../internal/modify'
import { movePlainDateTime } from '../internal/move'
import { refineOverflowOptions } from '../internal/optionsFieldRefine'
import {
  DiffOptions,
  EpochDisambigOptions,
  OverflowOptions,
  RoundingOptions,
} from '../internal/optionsModel'
import { roundPlainDateTime } from '../internal/round'
import {
  BrandingSlots,
  PlainDateBranding,
  PlainDateSlots,
  PlainDateTimeBranding,
  PlainDateTimeSlots,
  ZonedDateTimeBranding,
  ZonedDateTimeSlots,
  createPlainDateSlots,
  createPlainDateTimeSlots,
  createPlainTimeSlots,
} from '../internal/slots'
import { DayTimeUnitName, UnitName } from '../internal/units'
import { NumberSign, isObjectLike } from '../internal/utils'
import {
  CalendarArg,
  getCalendarIdFromBag,
  refineCalendarArg,
} from './calendarArg'
import {
  Duration,
  DurationArg,
  createDuration,
  toDurationSlots,
} from './duration'
import { prepPlainDateTimeFormat } from './intlFormatConfig'
import {
  calendarIdGetters,
  dateGetters,
  neverValueOf,
  timeGetters,
} from './mixins'
import { PlainDate, createPlainDate } from './plainDate'
import {
  PlainTime,
  PlainTimeArg,
  createPlainTime,
  optionalToPlainTimeFields,
} from './plainTime'
import { createSlotClass, getSlots, rejectInvalidBag } from './slotClass'
import { TimeZoneArg, refineTimeZoneArg } from './timeZoneArg'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'

export type PlainDateTime = any & DateTimeFields
export type PlainDateTimeArg = PlainDateTime | DateTimeLikeObject | string

export const [PlainDateTime, createPlainDateTime] = createSlotClass(
  PlainDateTimeBranding,
  constructPlainDateTimeSlots,
  {
    ...calendarIdGetters,
    ...dateGetters,
    ...timeGetters,
  },
  {
    with(
      slots: PlainDateTimeSlots,
      mod: Partial<DateTimeFields>,
      options?: OverflowOptions,
    ): PlainDateTime {
      return createPlainDateTime(
        mergePlainDateTimeFields(slots, rejectInvalidBag(mod), options),
      )
    },
    withCalendar(
      slots: PlainDateTimeSlots,
      calendarArg: CalendarArg,
    ): PlainDateTime {
      return createPlainDateTime(
        slotsWithCalendarId(slots, refineCalendarArg(calendarArg)),
      )
    },
    withPlainTime(
      slots: PlainDateTimeSlots,
      plainTimeArg?: PlainTimeArg,
    ): PlainDateTime {
      return createPlainDateTime(
        plainDateTimeWithPlainTime(
          slots,
          optionalToPlainTimeFields(plainTimeArg),
        ),
      )
    },
    add(
      slots: PlainDateTimeSlots,
      durationArg: DurationArg,
      options?: OverflowOptions,
    ): PlainDateTime {
      return createPlainDateTime(
        movePlainDateTime(false, slots, toDurationSlots(durationArg), options),
      )
    },
    subtract(
      slots: PlainDateTimeSlots,
      durationArg: DurationArg,
      options?: OverflowOptions,
    ): PlainDateTime {
      return createPlainDateTime(
        movePlainDateTime(true, slots, toDurationSlots(durationArg), options),
      )
    },
    until(
      slots: PlainDateTimeSlots,
      otherArg: PlainDateTimeArg,
      options?: DiffOptions<UnitName>,
    ): Duration {
      return createDuration(
        diffPlainDateTimes(
          false,
          slots,
          toPlainDateTimeSlots(otherArg),
          options,
        ),
      )
    },
    since(
      slots: PlainDateTimeSlots,
      otherArg: PlainDateTimeArg,
      options?: DiffOptions<UnitName>,
    ): Duration {
      return createDuration(
        diffPlainDateTimes(
          true,
          slots,
          toPlainDateTimeSlots(otherArg),
          options,
        ),
      )
    },
    round(
      slots: PlainDateTimeSlots,
      options: DayTimeUnitName | RoundingOptions<DayTimeUnitName>,
    ): PlainDateTime {
      return createPlainDateTime(roundPlainDateTime(slots, options))
    },
    equals(slots: PlainDateTimeSlots, otherArg: PlainDateTimeArg): boolean {
      return plainDateTimesEqual(slots, toPlainDateTimeSlots(otherArg))
    },
    toZonedDateTime(
      slots: PlainDateTimeSlots,
      timeZoneArg: TimeZoneArg,
      options?: EpochDisambigOptions,
    ): ZonedDateTime {
      return createZonedDateTime(
        plainDateTimeToZonedDateTime(
          slots,
          refineTimeZoneArg(timeZoneArg),
          options,
        ),
      )
    },
    toPlainDate(slots: PlainDateTimeSlots): PlainDate {
      return createPlainDate(createPlainDateSlots(slots))
    },
    toPlainTime(slots: PlainDateTimeSlots): PlainTime {
      return createPlainTime(createPlainTimeSlots(slots))
    },
    toLocaleString(
      slots: PlainDateTimeSlots,
      locales?: LocalesArg,
      options?: Intl.DateTimeFormatOptions,
    ) {
      const [format, epochMilli] = prepPlainDateTimeFormat(
        locales,
        options,
        slots,
      )
      return format.format(epochMilli)
    },
    toString: formatPlainDateTimeIso,
    toJSON(slots: PlainDateTimeSlots): string {
      return formatPlainDateTimeIso(slots)
    },
    valueOf: neverValueOf,
  },
  {
    from(arg: PlainDateTimeArg, options: OverflowOptions): PlainDateTime {
      return createPlainDateTime(toPlainDateTimeSlots(arg, options))
    },
    compare(arg0: PlainDateTimeArg, arg1: PlainDateTimeArg): NumberSign {
      return compareIsoDateTimeFields(
        toPlainDateTimeSlots(arg0),
        toPlainDateTimeSlots(arg1),
      )
    },
  },
  formatPlainDateTimeIso,
)

// Utils
// -----------------------------------------------------------------------------

export function toPlainDateTimeSlots(
  arg: PlainDateTimeArg,
  options?: OverflowOptions,
): PlainDateTimeSlots {
  if (isObjectLike(arg)) {
    const slots = (getSlots(arg) || {}) as Partial<BrandingSlots>

    switch (slots.branding) {
      case PlainDateTimeBranding:
        refineOverflowOptions(options) // parse unused options
        return slots as PlainDateTimeSlots

      case PlainDateBranding:
        refineOverflowOptions(options) // parse unused options
        return createPlainDateTimeSlots({
          ...(slots as PlainDateSlots),
          ...timeFieldDefaults,
        })

      case ZonedDateTimeBranding:
        refineOverflowOptions(options) // parse unused options
        return zonedDateTimeToPlainDateTime(slots as ZonedDateTimeSlots)
    }

    return refinePlainDateTimeObjectLike(
      getCalendarIdFromBag(arg as DateLikeObject),
      arg as DateLikeObject,
      options,
    )
  }

  const res = parsePlainDateTime(arg)
  refineOverflowOptions(options) // parse unused options
  return res
}
