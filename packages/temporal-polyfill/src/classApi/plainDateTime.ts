import { DateTimeBag, DateTimeFields } from '../internal/calendarFields'
import { isoTimeFieldDefaults } from '../internal/calendarIsoFields'
import { DateTimeDisplayOptions, DiffOptions, EpochDisambigOptions, OverflowOptions, RoundingOptions, copyOptions, refineOverflowOptions } from '../internal/optionsRefine'
import { UnitName } from '../internal/units'
import { NumSign, bindArgs, isObjectLike } from '../internal/utils'
import { PlainDateBranding, PlainDateSlots, PlainDateTimeBranding, PlainDateTimeSlots, ZonedDateTimeBranding, ZonedDateTimeSlots, createPlainDateTimeSlots, createPlainDateSlots, createPlainTimeSlots, getId, removeBranding, BrandingSlots } from '../internal/slots'
import { getSlots, rejectInvalidBag, createSlotClass } from './slotsForClasses'
import { CalendarSlot, getCalendarSlotFromBag, refineCalendarSlot } from './slotsForClasses'
import { TimeZoneSlot, refineTimeZoneSlot } from './slotsForClasses'
import { CalendarArg } from './calendar'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { PlainDate, PlainDateArg, createPlainDate, toPlainDateSlots } from './plainDate'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import { PlainTime, PlainTimeArg, createPlainTime } from './plainTime'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { TimeZoneArg } from './timeZone'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'
import { calendarIdGetters, dateGetters, getCalendarFromSlots, neverValueOf, timeGetters } from './mixins'
import { optionalToPlainTimeFields } from './utils'
import { createDateModOps, createDateRefineOps, createDiffOps, createMonthDayRefineOps, createMoveOps, createYearMonthRefineOps } from './calendarOpsQuery'
import { createTimeZoneOffsetOps, createTimeZoneOps } from './timeZoneOpsQuery'
import { PlainDateBag, PlainDateTimeBag, plainDateTimeWithFields, refinePlainDateTimeBag } from '../internal/bag'
import { constructPlainDateTimeSlots } from '../internal/construct'
import { plainDateTimeWithPlainDate, plainDateTimeWithPlainTime, slotsWithCalendar } from '../internal/mod'
import { movePlainDateTime } from '../internal/move'
import { diffPlainDateTimes } from '../internal/diff'
import { roundPlainDateTime } from '../internal/round'
import { plainDateTimesEqual, compareIsoDateTimeFields } from '../internal/compare'
import { formatPlainDateTimeIso } from '../internal/formatIso'
import { plainDateTimeToPlainMonthDay, plainDateTimeToPlainYearMonth, plainDateTimeToZonedDateTime, zonedDateTimeToPlainDateTime } from '../internal/convert'
import { parsePlainDateTime } from '../internal/parseIso'
import { prepPlainDateTimeFormat } from './dateTimeFormat'
import { LocalesArg } from '../internal/formatIntl'

export type PlainDateTime = any & DateTimeFields
export type PlainDateTimeArg = PlainDateTime | PlainDateTimeBag<CalendarArg> | string

export const [PlainDateTime, createPlainDateTime] = createSlotClass(
  PlainDateTimeBranding,
  bindArgs(constructPlainDateTimeSlots, refineCalendarSlot),
  {
    ...calendarIdGetters,
    ...dateGetters,
    ...timeGetters,
  },
  {
    with(slots: PlainDateTimeSlots<CalendarSlot>, mod: DateTimeBag, options?: OverflowOptions): PlainDateTime {
      return createPlainDateTime(
        plainDateTimeWithFields(createDateModOps, slots, this, rejectInvalidBag(mod), options)
      )
    },
    withPlainTime(slots: PlainDateTimeSlots<CalendarSlot>, plainTimeArg?: PlainTimeArg): PlainDateTime {
      return createPlainDateTime(
        plainDateTimeWithPlainTime(slots, optionalToPlainTimeFields(plainTimeArg))
      )
    },
    withPlainDate(slots: PlainDateTimeSlots<CalendarSlot>, plainDateArg: PlainDateArg): PlainDateTime {
      return createPlainDateTime(
        plainDateTimeWithPlainDate(slots, toPlainDateSlots(plainDateArg))
      )
    },
    withCalendar(slots: PlainDateTimeSlots<CalendarSlot>, calendarArg: CalendarArg): PlainDateTime {
      return createPlainDateTime(
        slotsWithCalendar(slots, refineCalendarSlot(calendarArg))
      )
    },
    add(slots: PlainDateTimeSlots<CalendarSlot>, durationArg: DurationArg, options?: OverflowOptions): PlainDateTime {
      return createPlainDateTime(
        movePlainDateTime(createMoveOps, false, slots, toDurationSlots(durationArg), options)
      )
    },
    subtract(slots: PlainDateTimeSlots<CalendarSlot>, durationArg: DurationArg, options?: OverflowOptions): PlainDateTime {
      return createPlainDateTime(
        movePlainDateTime(createMoveOps, true, slots, toDurationSlots(durationArg), options)
      )
    },
    until(slots: PlainDateTimeSlots<CalendarSlot>, otherArg: PlainDateTimeArg, options?: DiffOptions): Duration {
      return createDuration(
        diffPlainDateTimes(createDiffOps, false, slots, toPlainDateTimeSlots(otherArg), options)
      )
    },
    since(slots: PlainDateTimeSlots<CalendarSlot>, otherArg: PlainDateTimeArg, options?: DiffOptions): Duration {
      return createDuration(
        diffPlainDateTimes(createDiffOps, true, slots, toPlainDateTimeSlots(otherArg), options)
      )
    },
    round(slots: PlainDateTimeSlots<CalendarSlot>, options: RoundingOptions | UnitName): PlainDateTime {
      return createPlainDateTime(
        roundPlainDateTime(slots, options)
      )
    },
    equals(slots: PlainDateTimeSlots<CalendarSlot>, otherArg: PlainDateTimeArg): boolean {
      return plainDateTimesEqual(slots, toPlainDateTimeSlots(otherArg))
    },
    toString(slots: PlainDateTimeSlots<CalendarSlot>, options?: DateTimeDisplayOptions): string {
      return formatPlainDateTimeIso(slots, options)
    },
    toJSON(slots: PlainDateTimeSlots<CalendarSlot>): string {
      return formatPlainDateTimeIso(slots)
    },
    toLocaleString(slots: PlainDateTimeSlots<CalendarSlot>, locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) {
      const [format, epochMilli] = prepPlainDateTimeFormat(locales, options, slots)
      return format.format(epochMilli)
    },
    toZonedDateTime(slots: PlainDateTimeSlots<CalendarSlot>, timeZoneArg: TimeZoneArg, options?: EpochDisambigOptions): ZonedDateTime {
      return createZonedDateTime(
        plainDateTimeToZonedDateTime(createTimeZoneOps, slots, refineTimeZoneSlot(timeZoneArg), options)
      )
    },
    toPlainDate(slots: PlainDateTimeSlots<CalendarSlot>): PlainDate {
      return createPlainDate(
        createPlainDateSlots(slots)
      )
    },
    toPlainYearMonth(slots: PlainDateTimeSlots<CalendarSlot>): PlainYearMonth {
      return createPlainYearMonth(
        plainDateTimeToPlainYearMonth(createYearMonthRefineOps, slots, this)
      )
    },
    toPlainMonthDay(slots: PlainDateTimeSlots<CalendarSlot>): PlainMonthDay {
      return createPlainMonthDay(
        plainDateTimeToPlainMonthDay(createMonthDayRefineOps, slots, this)
      )
    },
    toPlainTime(slots: PlainDateTimeSlots<CalendarSlot>): PlainTime {
      return createPlainTime(
        createPlainTimeSlots(slots),
      )
    },
    getISOFields: removeBranding,
    getCalendar: getCalendarFromSlots,
    valueOf: neverValueOf,
  },
  {
    from(arg: PlainDateTimeArg, options: OverflowOptions): PlainDateTime {
      return createPlainDateTime(
        toPlainDateTimeSlots(arg, options)
      )
    },
    compare(arg0: PlainDateTimeArg, arg1: PlainDateTimeArg): NumSign {
      return compareIsoDateTimeFields(
        toPlainDateTimeSlots(arg0),
        toPlainDateTimeSlots(arg1),
      )
    }
  }
)

// Utils
// -------------------------------------------------------------------------------------------------

export function toPlainDateTimeSlots(arg: PlainDateTimeArg, options?: OverflowOptions): PlainDateTimeSlots<CalendarSlot> {
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
      createDateRefineOps(getCalendarSlotFromBag(arg as PlainDateBag<CalendarArg>)),
      arg as PlainDateBag<CalendarArg>,
      options,
    )
  }

  const res = parsePlainDateTime(arg)
  refineOverflowOptions(options) // parse unused options
  return res
}
