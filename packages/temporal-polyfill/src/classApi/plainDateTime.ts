import {
  PlainDateBag,
  PlainDateTimeBag,
  plainDateTimeWithFields,
  refinePlainDateTimeBag,
} from '../internal/bagRefine'
import {
  compareIsoDateTimeFields,
  plainDateTimesEqual,
} from '../internal/compare'
import { constructPlainDateTimeSlots } from '../internal/construct'
import {
  plainDateTimeToPlainMonthDay,
  plainDateTimeToPlainYearMonth,
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
  slotsWithCalendar,
} from '../internal/modify'
import { movePlainDateTime } from '../internal/move'
import {
  DateTimeDisplayOptions,
  DiffOptions,
  EpochDisambigOptions,
  OverflowOptions,
  RoundingOptions,
  copyOptions,
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
import { UnitName } from '../internal/units'
import { NumberSign, bindArgs, isObjectLike } from '../internal/utils'
import {
  CalendarArg,
  CalendarSlot,
  getCalendarSlotFromBag,
  refineCalendarSlot,
} from './calendar'
import {
  createDateModOps,
  createDateRefineOps,
  createDiffOps,
  createMonthDayRefineOps,
  createMoveOps,
  createYearMonthRefineOps,
} from './calendarOpsQuery'
import {
  Duration,
  DurationArg,
  createDuration,
  toDurationSlots,
} from './duration'
import { prepPlainDateTimeFormat } from './intlDateTimeFormat'
import {
  calendarIdGetters,
  createCalendarFromSlots,
  dateGetters,
  neverValueOf,
  removeBranding,
  timeGetters,
} from './mixins'
import {
  PlainDate,
  PlainDateArg,
  createPlainDate,
  toPlainDateSlots,
} from './plainDate'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import { PlainTime, PlainTimeArg, createPlainTime } from './plainTime'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { createSlotClass, getSlots } from './slotClass'
import { TimeZoneArg, TimeZoneSlot, refineTimeZoneSlot } from './timeZone'
import { createTimeZoneOffsetOps, createTimeZoneOps } from './timeZoneOpsQuery'
import { optionalToPlainTimeFields, rejectInvalidBag } from './utils'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'

export type PlainDateTime = any & DateTimeFields
export type PlainDateTimeArg =
  | PlainDateTime
  | PlainDateTimeBag<CalendarArg>
  | string

export const [PlainDateTime, createPlainDateTime] = createSlotClass(
  PlainDateTimeBranding,
  bindArgs(constructPlainDateTimeSlots, refineCalendarSlot),
  {
    ...calendarIdGetters,
    ...dateGetters,
    ...timeGetters,
  },
  {
    with(
      slots: PlainDateTimeSlots<CalendarSlot>,
      mod: DateTimeBag,
      options?: OverflowOptions,
    ): PlainDateTime {
      return createPlainDateTime(
        plainDateTimeWithFields(
          createDateModOps,
          slots,
          this,
          rejectInvalidBag(mod),
          options,
        ),
      )
    },
    withPlainTime(
      slots: PlainDateTimeSlots<CalendarSlot>,
      plainTimeArg?: PlainTimeArg,
    ): PlainDateTime {
      return createPlainDateTime(
        plainDateTimeWithPlainTime(
          slots,
          optionalToPlainTimeFields(plainTimeArg),
        ),
      )
    },
    withPlainDate(
      slots: PlainDateTimeSlots<CalendarSlot>,
      plainDateArg: PlainDateArg,
    ): PlainDateTime {
      return createPlainDateTime(
        plainDateTimeWithPlainDate(slots, toPlainDateSlots(plainDateArg)),
      )
    },
    withCalendar(
      slots: PlainDateTimeSlots<CalendarSlot>,
      calendarArg: CalendarArg,
    ): PlainDateTime {
      return createPlainDateTime(
        slotsWithCalendar(slots, refineCalendarSlot(calendarArg)),
      )
    },
    add(
      slots: PlainDateTimeSlots<CalendarSlot>,
      durationArg: DurationArg,
      options?: OverflowOptions,
    ): PlainDateTime {
      return createPlainDateTime(
        movePlainDateTime(
          createMoveOps,
          false,
          slots,
          toDurationSlots(durationArg),
          options,
        ),
      )
    },
    subtract(
      slots: PlainDateTimeSlots<CalendarSlot>,
      durationArg: DurationArg,
      options?: OverflowOptions,
    ): PlainDateTime {
      return createPlainDateTime(
        movePlainDateTime(
          createMoveOps,
          true,
          slots,
          toDurationSlots(durationArg),
          options,
        ),
      )
    },
    until(
      slots: PlainDateTimeSlots<CalendarSlot>,
      otherArg: PlainDateTimeArg,
      options?: DiffOptions,
    ): Duration {
      return createDuration(
        diffPlainDateTimes(
          createDiffOps,
          false,
          slots,
          toPlainDateTimeSlots(otherArg),
          options,
        ),
      )
    },
    since(
      slots: PlainDateTimeSlots<CalendarSlot>,
      otherArg: PlainDateTimeArg,
      options?: DiffOptions,
    ): Duration {
      return createDuration(
        diffPlainDateTimes(
          createDiffOps,
          true,
          slots,
          toPlainDateTimeSlots(otherArg),
          options,
        ),
      )
    },
    round(
      slots: PlainDateTimeSlots<CalendarSlot>,
      options: RoundingOptions | UnitName,
    ): PlainDateTime {
      return createPlainDateTime(roundPlainDateTime(slots, options))
    },
    equals(
      slots: PlainDateTimeSlots<CalendarSlot>,
      otherArg: PlainDateTimeArg,
    ): boolean {
      return plainDateTimesEqual(slots, toPlainDateTimeSlots(otherArg))
    },
    toString(
      slots: PlainDateTimeSlots<CalendarSlot>,
      options?: DateTimeDisplayOptions,
    ): string {
      return formatPlainDateTimeIso(slots, options)
    },
    toJSON(slots: PlainDateTimeSlots<CalendarSlot>): string {
      return formatPlainDateTimeIso(slots)
    },
    toLocaleString(
      slots: PlainDateTimeSlots<CalendarSlot>,
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
    toZonedDateTime(
      slots: PlainDateTimeSlots<CalendarSlot>,
      timeZoneArg: TimeZoneArg,
      options?: EpochDisambigOptions,
    ): ZonedDateTime {
      return createZonedDateTime(
        plainDateTimeToZonedDateTime(
          createTimeZoneOps,
          slots,
          refineTimeZoneSlot(timeZoneArg),
          options,
        ),
      )
    },
    toPlainDate(slots: PlainDateTimeSlots<CalendarSlot>): PlainDate {
      return createPlainDate(createPlainDateSlots(slots))
    },
    toPlainYearMonth(slots: PlainDateTimeSlots<CalendarSlot>): PlainYearMonth {
      return createPlainYearMonth(
        plainDateTimeToPlainYearMonth(createYearMonthRefineOps, slots, this),
      )
    },
    toPlainMonthDay(slots: PlainDateTimeSlots<CalendarSlot>): PlainMonthDay {
      return createPlainMonthDay(
        plainDateTimeToPlainMonthDay(createMonthDayRefineOps, slots, this),
      )
    },
    toPlainTime(slots: PlainDateTimeSlots<CalendarSlot>): PlainTime {
      return createPlainTime(createPlainTimeSlots(slots))
    },
    getISOFields: removeBranding,
    getCalendar: createCalendarFromSlots,
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
): PlainDateTimeSlots<CalendarSlot> {
  options = copyOptions(options)

  if (isObjectLike(arg)) {
    const slots = (getSlots(arg) || {}) as Partial<BrandingSlots>

    switch (slots.branding) {
      case PlainDateTimeBranding:
        refineOverflowOptions(options) // parse unused options
        return slots as PlainDateTimeSlots<CalendarSlot>

      case PlainDateBranding:
        refineOverflowOptions(options) // parse unused options
        return createPlainDateTimeSlots({
          ...(slots as PlainDateSlots<CalendarSlot>),
          ...isoTimeFieldDefaults,
        })

      case ZonedDateTimeBranding:
        refineOverflowOptions(options) // parse unused options
        return zonedDateTimeToPlainDateTime(
          createTimeZoneOffsetOps,
          slots as ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>,
        )
    }

    return refinePlainDateTimeBag(
      createDateRefineOps(
        getCalendarSlotFromBag(arg as PlainDateBag<CalendarArg>),
      ),
      arg as PlainDateBag<CalendarArg>,
      options,
    )
  }

  const res = parsePlainDateTime(arg)
  refineOverflowOptions(options) // parse unused options
  return res
}
