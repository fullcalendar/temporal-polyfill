import { DateBag, DateFields } from '../internal/fields'
import { LocalesArg } from '../internal/intlFormat'
import { DateTimeDisplayOptions, DiffOptions, OverflowOptions, copyOptions, refineOverflowOptions } from '../internal/optionsRefine'
import { NumSign, bindArgs, isObjectLike } from '../internal/utils'
import { BrandingSlots, PlainDateBranding, PlainDateSlots, PlainDateTimeBranding, PlainDateTimeSlots, ZonedDateTimeBranding, ZonedDateTimeSlots, createPlainDateSlots, getId, removeBranding } from '../internal/slots'
import { CalendarSlot, createSlotClass, getCalendarSlotFromBag, refineCalendarSlot } from './slotClass'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import { PlainTimeArg, toPlainTimeSlots } from './plainTime'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { CalendarArg } from './calendar'
import { calendarIdGetters, dateGetters, buildCalendarFromSlots, neverValueOf } from './mixins'
import { optionalToPlainTimeFields } from './utils'
import { TimeZone, TimeZoneArg } from './timeZone'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { TimeZoneSlot, refineTimeZoneSlot } from './slotClass'
import { getSlots, rejectInvalidBag } from './slotClass'
import { createDateModOps, createDateRefineOps, createDiffOps, createMonthDayRefineOps, createMoveOps, createYearMonthRefineOps } from './calendarOpsQuery'
import { createTimeZoneOffsetOps, createTimeZoneOps } from './timeZoneOpsQuery'
import { PlainDateBag, plainDateWithFields, refinePlainDateBag } from '../internal/bagRefine'
import { constructPlainDateSlots } from '../internal/construct'
import { slotsWithCalendar } from '../internal/modify'
import { movePlainDate } from '../internal/move'
import { diffPlainDates } from '../internal/diff'
import { plainDatesEqual, compareIsoDateFields } from '../internal/compare'
import { formatPlainDateIso } from '../internal/isoFormat'
import { plainDateToPlainDateTime, plainDateToPlainMonthDay, plainDateToPlainYearMonth, plainDateToZonedDateTime, zonedDateTimeToPlainDate } from '../internal/convert'
import { parsePlainDate } from '../internal/isoParse'
import { prepPlainDateFormat } from './intlDateTimeFormat'

export type PlainDate = any & DateFields
export type PlainDateArg = PlainDate | PlainDateBag<CalendarArg> | string

// TODO: give `this` a type

export const [PlainDate, createPlainDate, getPlainDateSlots] = createSlotClass(
  PlainDateBranding,
  bindArgs(constructPlainDateSlots, refineCalendarSlot),
  {
    ...calendarIdGetters,
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
        movePlainDate(createMoveOps, false, slots, toDurationSlots(durationArg), options)
      )
    },
    subtract(slots: PlainDateSlots<CalendarSlot>, durationArg: DurationArg, options?: OverflowOptions): PlainDate {
      return createPlainDate(
        movePlainDate(createMoveOps, true, slots, toDurationSlots(durationArg), options)
      )
    },
    until(slots: PlainDateSlots<CalendarSlot>, otherArg: PlainDateArg, options?: DiffOptions): Duration {
      return createDuration(
        diffPlainDates(createDiffOps, false, slots, toPlainDateSlots(otherArg), options)
      )
    },
    since(slots: PlainDateSlots<CalendarSlot>, otherArg: PlainDateArg, options?: DiffOptions): Duration {
      return createDuration(
        diffPlainDates(createDiffOps, true, slots, toPlainDateSlots(otherArg), options)
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
        (!isObjectLike(options) || options instanceof TimeZone)
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
    getCalendar: buildCalendarFromSlots,
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

  if (isObjectLike(arg)) {
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
          createTimeZoneOffsetOps,
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
