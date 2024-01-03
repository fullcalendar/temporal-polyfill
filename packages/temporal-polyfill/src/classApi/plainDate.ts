import { DateBag, DateFields } from '../internal/calendarFields'
import { LocalesArg } from '../internal/formatIntl'
import { DateTimeDisplayOptions, DiffOptions, OverflowOptions, copyOptions, refineOverflowOptions } from '../internal/optionsRefine'
import { NumSign, bindArgs, isObjectlike } from '../internal/utils'
import { BrandingSlots, PlainDateBranding, PlainDateSlots, PlainDateTimeBranding, PlainDateTimeSlots, ZonedDateTimeBranding, ZonedDateTimeSlots, createPlainDateSlots, getId, removeBranding } from '../internal/slots'
import { CalendarSlot, createSlotClass, getCalendarSlotFromBag, refineCalendarSlot } from './slotsForClasses'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import { PlainTimeArg, toPlainTimeSlots } from './plainTime'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { CalendarArg } from './calendar'
import { dateGetters, getCalendarFromSlots, neverValueOf } from './mixins'
import { optionalToPlainTimeFields } from './utils'
import { TimeZone, TimeZoneArg } from './timeZone'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { TimeZoneSlot, refineTimeZoneSlot } from './slotsForClasses'
import { getSlots, rejectInvalidBag } from './slotsForClasses'
import { createDateModOps, createDateRefineOps, createDiffOps, createMonthDayRefineOps, createMoveOps, createYearMonthRefineOps } from './calendarOpsQuery'
import { createSimpleTimeZoneOps, createTimeZoneOps } from './timeZoneOpsQuery'
import { PlainDateBag, plainDateWithFields, refinePlainDateBag } from '../internal/bag'
import { constructPlainDateSlots } from '../internal/construct'
import { slotsWithCalendar } from '../internal/mod'
import { movePlainDate } from '../internal/move'
import { diffPlainDates } from '../internal/diff'
import { plainDatesEqual, compareIsoDateFields } from '../internal/compare'
import { formatPlainDateIso } from '../internal/formatIso'
import { plainDateToPlainDateTime, plainDateToPlainMonthDay, plainDateToPlainYearMonth, plainDateToZonedDateTime, zonedDateTimeToPlainDate } from '../internal/convert'
import { parsePlainDate } from '../internal/parseIso'
import { prepPlainDateFormat } from './dateTimeFormat'

export type PlainDate = any & DateFields
export type PlainDateArg = PlainDate | PlainDateBag<CalendarArg> | string

// TODO: give `this` a type

export const [PlainDate, createPlainDate, getPlainDateSlots] = createSlotClass(
  PlainDateBranding,
  bindArgs(constructPlainDateSlots, refineCalendarSlot),
  {
    calendarId(slots: PlainDateSlots<CalendarSlot>): string {
      return getId(slots.calendar)
    },
    ...dateGetters,
  },
  {
    with(slots: PlainDateSlots<CalendarSlot>, mod: DateBag, options?: OverflowOptions) {
      return createPlainDate(
        plainDateWithFields(createDateModOps, slots, this, rejectInvalidBag(mod), options)
      )
    },
    withCalendar(slots: PlainDateSlots<CalendarSlot>, calendarArg: CalendarArg): PlainDate {
      return createPlainDate(
        slotsWithCalendar(slots, refineCalendarSlot(calendarArg))
      )
    },
    add(slots: PlainDateSlots<CalendarSlot>, durationArg: DurationArg, options?: OverflowOptions): PlainDate {
      return createPlainDate(
        movePlainDate(createMoveOps, slots, toDurationSlots(durationArg), options)
      )
    },
    subtract(slots: PlainDateSlots<CalendarSlot>, durationArg: DurationArg, options?: OverflowOptions): PlainDate {
      return createPlainDate(
        movePlainDate(createMoveOps, slots, toDurationSlots(durationArg), options, true)
      )
    },
    until(slots: PlainDateSlots<CalendarSlot>, otherArg: PlainDateArg, options?: DiffOptions): Duration {
      return createDuration(
        diffPlainDates(createDiffOps, slots, toPlainDateSlots(otherArg), options)
      )
    },
    since(slots: PlainDateSlots<CalendarSlot>, otherArg: PlainDateArg, options?: DiffOptions): Duration {
      return createDuration(
        diffPlainDates(createDiffOps, slots, toPlainDateSlots(otherArg), options, true)
      )
    },
    equals(slots: PlainDateSlots<CalendarSlot>, otherArg: PlainDateArg): boolean {
      return plainDatesEqual(slots, toPlainDateSlots(otherArg))
    },
    toString: formatPlainDateIso,
    toJSON(slots: PlainDateSlots<CalendarSlot>): string {
      return formatPlainDateIso(slots)
    },
    toLocaleString(slots: PlainDateSlots<CalendarSlot>, locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) {
      const [format, epochMilli] = prepPlainDateFormat(locales, options, slots)
      return format.format(epochMilli)
    },
    toZonedDateTime(
      slots: PlainDateSlots<CalendarSlot>,
      options: TimeZoneArg | { timeZone: TimeZoneArg, plainTime?: PlainTimeArg },
    ): ZonedDateTime {
      const optionsObj =
        (!isObjectlike(options) || options instanceof TimeZone)
          ? { timeZone: options }
          : options as { timeZone: TimeZoneArg, plainTime?: PlainTimeArg }

      return createZonedDateTime(
        plainDateToZonedDateTime(refineTimeZoneSlot, toPlainTimeSlots, createTimeZoneOps, slots, optionsObj)
      )
    },
    toPlainDateTime(slots: PlainDateSlots<CalendarSlot>, plainTimeArg?: PlainTimeArg): PlainDateTime {
      return createPlainDateTime(
        plainDateToPlainDateTime(slots, optionalToPlainTimeFields(plainTimeArg))
      )
    },
    toPlainYearMonth(slots: PlainDateSlots<CalendarSlot>): PlainYearMonth {
      return createPlainYearMonth(
        plainDateToPlainYearMonth(createYearMonthRefineOps, slots, this)
      )
    },
    toPlainMonthDay(slots: PlainDateSlots<CalendarSlot>): PlainMonthDay {
      return createPlainMonthDay(
        plainDateToPlainMonthDay(createMonthDayRefineOps, slots, this)
      )
    },
    getISOFields: removeBranding,
    getCalendar: getCalendarFromSlots,
    valueOf: neverValueOf,
  },
  {
    from(arg: any, options?: OverflowOptions): PlainDate {
      return createPlainDate(
        toPlainDateSlots(arg, options)
      )
    },
    compare(arg0: PlainDateArg, arg1: PlainDateArg): NumSign {
      return compareIsoDateFields(
        toPlainDateSlots(arg0),
        toPlainDateSlots(arg1),
      )
    }
  },
)

// Utils
// -------------------------------------------------------------------------------------------------

export function toPlainDateSlots(arg: PlainDateArg, options?: OverflowOptions): PlainDateSlots<CalendarSlot> {
  options = copyOptions(options)

  if (isObjectlike(arg)) {
    const slots = (getSlots(arg) || {}) as Partial<BrandingSlots>

    switch (slots.branding) {
      case PlainDateBranding:
        refineOverflowOptions(options) // parse unused options
        return slots as PlainDateSlots<CalendarSlot>

      case PlainDateTimeBranding:
        refineOverflowOptions(options) // parse unused options
        return createPlainDateSlots(slots as PlainDateTimeSlots<CalendarSlot>)

      case ZonedDateTimeBranding:
        refineOverflowOptions(options) // parse unused options
        return zonedDateTimeToPlainDate(
          createSimpleTimeZoneOps,
          slots as ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>
        )
    }

    return refinePlainDateBag(
      createDateRefineOps(getCalendarSlotFromBag(arg as PlainDateBag<CalendarArg>)),
      arg as PlainDateBag<CalendarArg>,
      options,
    )
  }

  const res = parsePlainDate(arg)
  refineOverflowOptions(options) // parse unused options
  return res
}
