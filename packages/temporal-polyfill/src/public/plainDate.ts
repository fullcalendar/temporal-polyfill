import { DateBag, DateFields, dateGetterNames } from '../internal/calendarFields'
import { IsoDateFields, isoDateFieldNames } from '../internal/isoFields'
import { LocalesArg, formatDateLocaleString } from '../internal/intlFormat'
import { DateTimeDisplayOptions, DiffOptions, OverflowOptions, prepareOptions, refineOverflowOptions } from '../internal/options'
import { NumSign, defineGetters, defineProps, defineStringTag, isObjectlike, pluckProps } from '../internal/utils'
import { PlainDateBag } from '../internal/genericBag'
import { CalendarBranding, PlainDateBranding, PlainDateTimeBranding, ZonedDateTimeBranding } from '../genericApi/branding'
import { PlainDateSlots, ZonedDateTimeSlots } from '../genericApi/genericTypes'
import * as PlainDateFuncs from '../genericApi/plainDate'

// public
import { CalendarSlot, getCalendarSlotFromBag, refineCalendarSlot } from './calendarSlot'
import { zonedInternalsToIso } from './zonedInternalsToIso'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import { PlainTimeArg } from './plainTime'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { CalendarArg, CalendarProtocol, createCalendar } from './calendar'
import { createCalendarGetterMethods, createCalendarIdGetterMethods, neverValueOf } from './publicMixins'
import { optionalToPlainTimeFields } from './publicUtils'
import { TimeZone, TimeZoneArg } from './timeZone'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { TimeZoneSlot, refineTimeZoneSlot } from './timeZoneSlot'
import { IsoDateSlots, createViaSlots, getSlots, getSpecificSlots, pluckIsoDateInternals, setSlots } from './slots'
import { getDateModCalendarRecord, getMoveCalendarRecord, getDiffCalendarRecord, createTypicalTimeZoneRecord, createYearMonthNewCalendarRecord, createMonthDayNewCalendarRecord, createDateNewCalendarRecord } from './recordCreators'

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
        getDateModCalendarRecord,
        getPlainDateSlots(this),
        this,
        mod,
        prepareOptions(options),
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
        getMoveCalendarRecord,
        getPlainDateSlots(this),
        toDurationSlots(durationArg),
        options,
      )
    )
  }

  subtract(durationArg: DurationArg, options?: OverflowOptions): PlainDate {
    return createPlainDate(
      PlainDateFuncs.subtract(
        getMoveCalendarRecord,
        getPlainDateSlots(this),
        toDurationSlots(durationArg),
        options,
      )
    )
  }

  until(otherArg: PlainDateArg, options?: DiffOptions): Duration {
    return createDuration(
      PlainDateFuncs.until(
        getDiffCalendarRecord,
        getPlainDateSlots(this),
        toPlainDateSlots(otherArg),
        options,
      )
    )
  }

  since(otherArg: PlainDateArg, options?: DiffOptions): Duration {
    return createDuration(
      PlainDateFuncs.since(
        getDiffCalendarRecord,
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

  // TODO: rethink this!!!
  toLocaleString(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) {
    const slots = getPlainDateSlots(this)
    return formatDateLocaleString(slots.calendar, slots, locales, options)
  }

  toZonedDateTime(
    options: TimeZoneArg | { timeZone: TimeZoneArg, plainTime?: PlainTimeArg },
  ): ZonedDateTime {
    let timeZoneArg: TimeZoneArg
    let plainTimeArg: PlainTimeArg | undefined

    if (isObjectlike(options) && !(options instanceof TimeZone)) {
      timeZoneArg = (options as { timeZone: TimeZoneArg }).timeZone
      plainTimeArg = (options as { plainTime?: PlainTimeArg }).plainTime
    } else {
      timeZoneArg = options
    }

    return createZonedDateTime(
      PlainDateFuncs.toZonedDateTime(
        createTypicalTimeZoneRecord,
        getPlainDateSlots(this),
        refineTimeZoneSlot(timeZoneArg),
        optionalToPlainTimeFields(plainTimeArg),
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
        createYearMonthNewCalendarRecord,
        getPlainDateSlots(this),
        this,
      )
    )
  }

  toPlainMonthDay(): PlainMonthDay {
    return createPlainMonthDay(
      PlainDateFuncs.toPlainMonthDay(
        createMonthDayNewCalendarRecord,
        getPlainDateSlots(this),
        this,
      )
    )
  }

  // not DRY
  getISOFields(): IsoDateSlots {
    const slots = getPlainDateSlots(this)
    return { // guaranteed alphabetical
      calendar: slots.calendar,
      ...pluckProps<IsoDateFields>(isoDateFieldNames, slots),
    }
  }

  // not DRY
  getCalendar(): CalendarProtocol {
    const { calendar } = getPlainDateSlots(this)
    return typeof calendar === 'string'
      ? createCalendar({ branding: CalendarBranding, id: calendar })
      : calendar
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

defineGetters(PlainDate.prototype, {
  ...createCalendarIdGetterMethods(PlainDateBranding),
  ...createCalendarGetterMethods(PlainDateBranding, dateGetterNames),
})

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
        return { ...pluckIsoDateInternals(slots as PlainDateSlots<CalendarSlot>), branding: PlainDateBranding }
      case ZonedDateTimeBranding:
        refineOverflowOptions(options) // parse unused options
        return { ...pluckIsoDateInternals(zonedInternalsToIso(slots as ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>)), branding: PlainDateBranding }
    }

    return PlainDateFuncs.fromFields(
      createDateNewCalendarRecord,
      slots.calendar || getCalendarSlotFromBag(arg as PlainDateBag<CalendarArg>),
      arg as PlainDateBag<CalendarArg>,
      options,
    )
  }

  const res = PlainDateFuncs.fromString(arg)
  refineOverflowOptions(options) // parse unused options
  return res
}
