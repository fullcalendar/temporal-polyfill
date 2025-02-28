import {
  PlainDateBag,
  PlainDateTimeBag,
  plainDateTimeWithFields,
  refinePlainDateTimeBag,
} from '../internal/bagRefine'
import { refineCalendarId } from '../internal/calendarId'
import { createNativeStandardOps } from '../internal/calendarNativeQuery'
import {
  compareIsoDateTimeFields,
  plainDateTimesEqual,
} from '../internal/compare'
import { constructPlainDateTimeSlots } from '../internal/construct'
import {
  plainDateTimeToZonedDateTime,
  zonedDateTimeToPlainDateTime,
} from '../internal/convert'
import { diffPlainDateTimes } from '../internal/diff'
import { DateTimeBag, DateTimeFields } from '../internal/fields'
import { LocalesArg } from '../internal/intlFormatUtils'
import { isoTimeFieldDefaults } from '../internal/isoFields'
import { formatPlainDateTimeIso } from '../internal/isoFormat'
import { parsePlainDateTime } from '../internal/isoParse'
import {
  plainDateTimeWithPlainDate,
  plainDateTimeWithPlainTime,
  slotsWithCalendarId,
} from '../internal/modify'
import { movePlainDateTime } from '../internal/move'
import {
  DiffOptions,
  EpochDisambigOptions,
  OverflowOptions,
  RoundingOptions,
  refineOverflowOptions,
} from '../internal/optionsRefine'
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
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { DayTimeUnitName, UnitName } from '../internal/units'
import { NumberSign, bindArgs, isObjectLike } from '../internal/utils'
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
import {
  PlainDate,
  PlainDateArg,
  createPlainDate,
  toPlainDateSlots,
} from './plainDate'
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
export type PlainDateTimeArg = PlainDateTime | PlainDateTimeBag | string

export const [PlainDateTime, createPlainDateTime] = createSlotClass(
  PlainDateTimeBranding,
  bindArgs(constructPlainDateTimeSlots, refineCalendarId),
  {
    ...calendarIdGetters,
    ...dateGetters,
    ...timeGetters,
  },
  {
    with(
      slots: PlainDateTimeSlots,
      mod: DateTimeBag,
      options?: OverflowOptions,
    ): PlainDateTime {
      return createPlainDateTime(
        plainDateTimeWithFields(
          createNativeStandardOps,
          slots,
          this,
          rejectInvalidBag(mod),
          options,
        ),
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
    withPlainDate(
      slots: PlainDateTimeSlots,
      plainDateArg: PlainDateArg,
    ): PlainDateTime {
      return createPlainDateTime(
        plainDateTimeWithPlainDate(slots, toPlainDateSlots(plainDateArg)),
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
        movePlainDateTime(
          createNativeStandardOps,
          false,
          slots,
          toDurationSlots(durationArg),
          options,
        ),
      )
    },
    subtract(
      slots: PlainDateTimeSlots,
      durationArg: DurationArg,
      options?: OverflowOptions,
    ): PlainDateTime {
      return createPlainDateTime(
        movePlainDateTime(
          createNativeStandardOps,
          true,
          slots,
          toDurationSlots(durationArg),
          options,
        ),
      )
    },
    until(
      slots: PlainDateTimeSlots,
      otherArg: PlainDateTimeArg,
      options?: DiffOptions<UnitName>,
    ): Duration {
      return createDuration(
        diffPlainDateTimes(
          createNativeStandardOps,
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
          createNativeStandardOps,
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
          queryNativeTimeZone,
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
          ...isoTimeFieldDefaults,
        })

      case ZonedDateTimeBranding:
        refineOverflowOptions(options) // parse unused options
        return zonedDateTimeToPlainDateTime(
          queryNativeTimeZone,
          slots as ZonedDateTimeSlots,
        )
    }

    return refinePlainDateTimeBag(
      createNativeStandardOps(getCalendarIdFromBag(arg as PlainDateBag)),
      arg as PlainDateBag,
      options,
    )
  }

  const res = parsePlainDateTime(arg)
  refineOverflowOptions(options) // parse unused options
  return res
}
