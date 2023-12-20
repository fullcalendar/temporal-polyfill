import { DateBag, DateFields } from '../internal/calendarFields'
import { IsoDateFields, isoDateFieldNamesAlpha, isoDateFieldNamesDesc } from '../internal/calendarIsoFields'
import { LocalesArg, prepPlainDateFormat } from '../internal/formatIntl'
import { DateTimeDisplayOptions, DiffOptions, OverflowOptions, prepareOptions, refineOverflowOptions } from '../genericApi/optionsRefine'
import { NumSign, defineGetters, defineProps, defineStringTag, isObjectlike, pluckProps } from '../internal/utils'
import { zonedInternalsToIso } from '../internal/timeZoneOps'
import { getId } from '../internal/cast'
import { PlainDateBag } from '../genericApi/bagGeneric'
import { PlainDateBranding, PlainDateTimeBranding, ZonedDateTimeBranding } from '../genericApi/branding'
import { PlainDateSlots, ZonedDateTimeSlots } from '../genericApi/slotsGeneric'
import * as PlainDateFuncs from '../genericApi/plainDate'

// public
import { CalendarSlot, getCalendarSlotFromBag, refineCalendarSlot } from './calendarSlot'
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
import { TimeZoneSlot, refineTimeZoneSlot } from './timeZoneSlot'
import { PublicDateSlots, createViaSlots, getSlots, getSpecificSlots, rejectInvalidBag, setSlots } from './slotsForClasses'
import { createDateModOps, createDateRefineOps, createDiffOps, createMonthDayRefineOps, createMoveOps, createYearMonthRefineOps } from './calendarOpsQuery'
import { dateCalendarGetters } from './mixins'
import { createSimpleTimeZoneOps, createTimeZoneOps } from './timeZoneOpsQuery'

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
      PlainDateFuncs.create(refineCalendarSlot, isoYear, isoMonth, isoDay, calendar) as
        PlainDateSlots<CalendarSlot>
    )
  }

  with(mod: DateBag, options?: OverflowOptions): PlainDate {
    return createPlainDate(
      PlainDateFuncs.withFields(
        createDateModOps,
        getPlainDateSlots(this),
        this,
        rejectInvalidBag(mod),
        options,
      )
    )
  }

  withCalendar(calendarArg: CalendarArg): PlainDate {
    return createPlainDate({
      ...getPlainDateSlots(this),
      calendar: refineCalendarSlot(calendarArg),
    })
  }

  add(durationArg: DurationArg, options?: OverflowOptions): PlainDate {
    return createPlainDate(
      PlainDateFuncs.add(
        createMoveOps,
        getPlainDateSlots(this),
        toDurationSlots(durationArg),
        options,
      )
    )
  }

  subtract(durationArg: DurationArg, options?: OverflowOptions): PlainDate {
    return createPlainDate(
      PlainDateFuncs.subtract(
        createMoveOps,
        getPlainDateSlots(this),
        toDurationSlots(durationArg),
        options,
      )
    )
  }

  until(otherArg: PlainDateArg, options?: DiffOptions): Duration {
    return createDuration(
      PlainDateFuncs.until(
        createDiffOps,
        getPlainDateSlots(this),
        toPlainDateSlots(otherArg),
        options,
      )
    )
  }

  since(otherArg: PlainDateArg, options?: DiffOptions): Duration {
    return createDuration(
      PlainDateFuncs.since(
        createDiffOps,
        getPlainDateSlots(this),
        toPlainDateSlots(otherArg),
        options,
      )
    )
  }

  equals(otherArg: PlainDateArg): boolean {
    return PlainDateFuncs.equals(getPlainDateSlots(this), toPlainDateSlots(otherArg))
  }

  toString(options?: DateTimeDisplayOptions): string { // TODO: correct options type? time??
    return PlainDateFuncs.toString(getPlainDateSlots(this), options)
  }

  toJSON(): string {
    return PlainDateFuncs.toJSON(getPlainDateSlots(this))
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
      PlainDateFuncs.toZonedDateTime(
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
      PlainDateFuncs.toPlainDateTime(
        getPlainDateSlots(this),
        optionalToPlainTimeFields(plainTimeArg),
      )
    )
  }

  toPlainYearMonth(): PlainYearMonth {
    return createPlainYearMonth(
      PlainDateFuncs.toPlainYearMonth(
        createYearMonthRefineOps,
        getPlainDateSlots(this),
        this,
      )
    )
  }

  toPlainMonthDay(): PlainMonthDay {
    return createPlainMonthDay(
      PlainDateFuncs.toPlainMonthDay(
        createMonthDayRefineOps,
        getPlainDateSlots(this),
        this,
      )
    )
  }

  // not DRY
  getISOFields(): PublicDateSlots {
    const slots = getPlainDateSlots(this)
    return { // alphabetical
      calendar: slots.calendar,
      ...pluckProps<IsoDateFields>(isoDateFieldNamesAlpha, slots),
    }
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
    return PlainDateFuncs.compare(
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
        return {
          ...pluckProps([...isoDateFieldNamesDesc, 'calendar'], slots as PlainDateSlots<CalendarSlot>),
          branding: PlainDateBranding
        }

      case ZonedDateTimeBranding:
        refineOverflowOptions(options) // parse unused options
        return {
          ...pluckProps(
            isoDateFieldNamesDesc,
            zonedInternalsToIso(
              slots as ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>,
              createSimpleTimeZoneOps((slots as ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>).timeZone),
            ),
          ),
          calendar: (slots as ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>).calendar,
          branding: PlainDateBranding,
        }
    }

    return PlainDateFuncs.fromFields(
      createDateRefineOps,
      slots.calendar || getCalendarSlotFromBag(arg as PlainDateBag<CalendarArg>),
      arg as PlainDateBag<CalendarArg>,
      options,
    )
  }

  const res = PlainDateFuncs.fromString(arg)
  refineOverflowOptions(options) // parse unused options
  return res
}
