import { DateBag, DateFields } from '../internal/calendarFields'
import { LocalesArg } from '../internal/formatIntl'
import { DateTimeDisplayOptions, DiffOptions, OverflowOptions, prepareOptions, refineOverflowOptions } from '../internal/optionsRefine'
import { NumSign, defineGetters, defineProps, defineStringTag, isObjectlike, pluckProps } from '../internal/utils'
import { PlainDateBranding, PlainDateSlots, PlainDateTimeBranding, PlainDateTimeSlots, ZonedDateTimeBranding, ZonedDateTimeSlots, createPlainDateX, getId, removeBranding } from '../internal/slots'
import { CalendarSlot, PublicDateSlots, getCalendarSlotFromBag, refineCalendarSlot } from './slotsForClasses'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import { PlainTimeArg, toPlainTimeSlots } from './plainTime'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { Calendar, CalendarArg } from './calendar'
import { CalendarProtocol } from './calendarProtocol'
import { neverValueOf } from './mixins'
import { optionalToPlainTimeFields } from './utils'
import { TimeZone, TimeZoneArg } from './timeZone'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { TimeZoneSlot, refineTimeZoneSlot } from './slotsForClasses'
import { createViaSlots, getSlots, getSpecificSlots, rejectInvalidBag, setSlots } from './slotsForClasses'
import { createDateModOps, createDateRefineOps, createDiffOps, createMonthDayRefineOps, createMoveOps, createYearMonthRefineOps } from './calendarOpsQuery'
import { dateCalendarGetters } from './mixins'
import { createSimpleTimeZoneOps, createTimeZoneOps } from './timeZoneOpsQuery'
import { PlainDateBag, plainDateWithFields, refinePlainDateBag } from '../internal/bag'
import { createPlainDateSlots } from '../internal/slotsCreate'
import { slotsWithCalendar } from '../internal/slotsMod'
import { movePlainDate } from '../internal/move'
import { diffPlainDates } from '../internal/diff'
import { plainDatesEqual, compareIsoDateFields } from '../internal/compare'
import { formatPlainDateIso } from '../internal/formatIso'
import { plainDateToPlainDateTime, plainDateToPlainMonthDay, plainDateToPlainYearMonth, plainDateToZonedDateTime, zonedDateTimeToPlainDate } from '../internal/convert'
import { parsePlainDate } from '../internal/parseIso'
import { prepPlainDateFormat } from './dateTimeFormat'

export type PlainDateArg = PlainDate | PlainDateBag<CalendarArg> | string

export class PlainDate {
  constructor(
    isoYear: number,
    isoMonth: number,
    isoDay: number,
    calendar?: CalendarArg,
  ) {
    setSlots(
      this,
      createPlainDateSlots(refineCalendarSlot, isoYear, isoMonth, isoDay, calendar) as
        PlainDateSlots<CalendarSlot>
    )
  }

  with(mod: DateBag, options?: OverflowOptions): PlainDate {
    return createPlainDate(
      plainDateWithFields(
        createDateModOps,
        getPlainDateSlots(this),
        this,
        rejectInvalidBag(mod), // TODO: put these into *WithFields funcs?... for compat
        options,
      )
    )
  }

  withCalendar(calendarArg: CalendarArg): PlainDate {
    return createPlainDate(
      slotsWithCalendar(
        getPlainDateSlots(this),
        refineCalendarSlot(calendarArg),
      )
    )
  }

  add(durationArg: DurationArg, options?: OverflowOptions): PlainDate {
    return createPlainDate(
      movePlainDate(
        createMoveOps,
        false,
        getPlainDateSlots(this),
        toDurationSlots(durationArg),
        options,
      )
    )
  }

  subtract(durationArg: DurationArg, options?: OverflowOptions): PlainDate {
    return createPlainDate(
      movePlainDate(
        createMoveOps,
        true,
        getPlainDateSlots(this),
        toDurationSlots(durationArg),
        options,
      )
    )
  }

  until(otherArg: PlainDateArg, options?: DiffOptions): Duration {
    return createDuration(
      diffPlainDates(
        createDiffOps,
        getPlainDateSlots(this),
        toPlainDateSlots(otherArg),
        options,
      )
    )
  }

  since(otherArg: PlainDateArg, options?: DiffOptions): Duration {
    return createDuration(
      diffPlainDates(
        createDiffOps,
        getPlainDateSlots(this),
        toPlainDateSlots(otherArg),
        options,
        true,
      )
    )
  }

  equals(otherArg: PlainDateArg): boolean {
    return plainDatesEqual(getPlainDateSlots(this), toPlainDateSlots(otherArg))
  }

  toString(options?: DateTimeDisplayOptions): string { // TODO: correct options type? time??
    return formatPlainDateIso(getPlainDateSlots(this), options)
  }

  toJSON(): string {
    return formatPlainDateIso(getPlainDateSlots(this))
  }

  toLocaleString(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) {
    const [format, epochMilli] = prepPlainDateFormat(locales, options, getPlainDateSlots(this))
    return format.format(epochMilli)
  }

  toZonedDateTime(
    options: TimeZoneArg | { timeZone: TimeZoneArg, plainTime?: PlainTimeArg },
  ): ZonedDateTime {
    const optionsObj =
      (!isObjectlike(options) || options instanceof TimeZone)
        ? { timeZone: options }
        : options as { timeZone: TimeZoneArg, plainTime?: PlainTimeArg }

    return createZonedDateTime(
      plainDateToZonedDateTime(
        refineTimeZoneSlot,
        toPlainTimeSlots,
        createTimeZoneOps,
        getPlainDateSlots(this),
        optionsObj,
      )
    )
  }

  toPlainDateTime(plainTimeArg?: PlainTimeArg): PlainDateTime {
    return createPlainDateTime(
      plainDateToPlainDateTime(
        getPlainDateSlots(this),
        optionalToPlainTimeFields(plainTimeArg),
      )
    )
  }

  toPlainYearMonth(): PlainYearMonth {
    return createPlainYearMonth(
      plainDateToPlainYearMonth(
        createYearMonthRefineOps,
        getPlainDateSlots(this),
        this,
      )
    )
  }

  toPlainMonthDay(): PlainMonthDay {
    return createPlainMonthDay(
      plainDateToPlainMonthDay(
        createMonthDayRefineOps,
        getPlainDateSlots(this),
        this,
      )
    )
  }

  // not DRY
  getISOFields(): PublicDateSlots {
    return removeBranding(getPlainDateSlots(this))
  }

  // not DRY
  getCalendar(): CalendarProtocol {
    const { calendar } = getPlainDateSlots(this)
    return typeof calendar === 'string'
      ? new Calendar(calendar)
      : calendar
  }

  // not DRY
  get calendarId(): string {
    return getId(getPlainDateSlots(this).calendar)
  }

  static from(arg: any, options?: OverflowOptions): PlainDate {
    return createPlainDate(toPlainDateSlots(arg, options))
  }

  static compare(arg0: PlainDateArg, arg1: PlainDateArg): NumSign {
    return compareIsoDateFields(
      toPlainDateSlots(arg0),
      toPlainDateSlots(arg1),
    )
  }
}

export interface PlainDate extends DateFields {}

defineStringTag(PlainDate.prototype, PlainDateBranding)

defineProps(PlainDate.prototype, {
  valueOf: neverValueOf,
})

defineGetters(PlainDate.prototype, dateCalendarGetters)

// Utils
// -------------------------------------------------------------------------------------------------

export function createPlainDate(slots: PlainDateSlots<CalendarSlot>): PlainDate {
  return createViaSlots(PlainDate, slots)
}

export function getPlainDateSlots(plainDate: PlainDate): PlainDateSlots<CalendarSlot> {
  return getSpecificSlots(PlainDateBranding, plainDate) as PlainDateSlots<CalendarSlot>
}

export function toPlainDateSlots(arg: PlainDateArg, options?: OverflowOptions): PlainDateSlots<CalendarSlot> {
  options = prepareOptions(options)

  if (isObjectlike(arg)) {
    const slots = (getSlots(arg) || {}) as { branding?: string, calendar?: CalendarSlot }

    switch (slots.branding) {
      case PlainDateBranding:
        refineOverflowOptions(options) // parse unused options
        return slots as PlainDateSlots<CalendarSlot>

      case PlainDateTimeBranding:
        refineOverflowOptions(options) // parse unused options
        return createPlainDateX(slots as PlainDateTimeSlots<CalendarSlot>)

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
