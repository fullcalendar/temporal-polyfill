import { isoCalendarId } from '../internal/calendarConfig'
import { MonthDayBag, YearFields } from '../internal/calendarFields'
import { LocalesArg, prepPlainMonthDayFormat } from '../internal/formatIntl'
import { DateTimeDisplayOptions, OverflowOptions, prepareOptions, refineOverflowOptions } from '../genericApi/optionsRefine'
import { defineGetters, defineProps, defineStringTag, isObjectlike, pluckProps } from '../internal/utils'
import { IsoDateFields, isoDateFieldNamesAlpha } from '../internal/calendarIsoFields'
import { getId } from '../internal/cast'
import { PlainMonthDayBag } from '../genericApi/bagGeneric'
import { PlainMonthDayBranding } from '../genericApi/branding'
import { PlainMonthDaySlots } from '../genericApi/slotsGeneric'
import * as PlainMonthDayFuncs from '../genericApi/plainMonthDay'

// public
import { PublicDateSlots, createViaSlots, getSlots, getSpecificSlots, rejectInvalidBag, setSlots } from './slotsForClasses'
import { PlainDate, createPlainDate } from './plainDate'
import { CalendarSlot, extractCalendarSlotFromBag, refineCalendarSlot } from './calendarSlot'
import { Calendar, CalendarArg } from './calendar'
import { CalendarProtocol } from './calendarProtocol'
import { neverValueOf } from './mixins'
import { createDateModOps, createMonthDayModOps, createMonthDayRefineOps } from './calendarOpsQuery'
import { monthDayGetters } from './mixins'
import { createNativeStandardOps } from '../internal/calendarNativeQuery'

export type PlainMonthDayArg = PlainMonthDay | PlainMonthDayBag<CalendarArg> | string

export class PlainMonthDay {
  constructor(
    isoMonth: number,
    isoDay: number,
    calendar?: CalendarArg,
    referenceIsoYear?: number,
  ) {
    setSlots(
      this,
      PlainMonthDayFuncs.create(refineCalendarSlot, isoMonth, isoDay, calendar, referenceIsoYear)
    )
  }

  with(mod: MonthDayBag, options?: OverflowOptions): PlainMonthDay {
    return createPlainMonthDay(
      PlainMonthDayFuncs.withFields(
        createMonthDayModOps,
        getPlainMonthDaySlots(this),
        this as any, // !!!
        rejectInvalidBag(mod),
        prepareOptions(options),
      )
    )
  }

  equals(otherArg: PlainMonthDayArg): boolean {
    return PlainMonthDayFuncs.equals(getPlainMonthDaySlots(this), toPlainMonthDaySlots(otherArg))
  }

  toString(options?: DateTimeDisplayOptions): string {
    return PlainMonthDayFuncs.toString(getPlainMonthDaySlots(this), options)
  }

  toJSON(): string {
    return PlainMonthDayFuncs.toJSON(getPlainMonthDaySlots(this))
  }

  toLocaleString(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions): string {
    const [format, epochMilli] = prepPlainMonthDayFormat(locales, options, getPlainMonthDaySlots(this))
    return format.format(epochMilli)
  }

  toPlainDate(bag: YearFields): PlainDate {
    return createPlainDate(
      PlainMonthDayFuncs.toPlainDate(
        createDateModOps,
        getPlainMonthDaySlots(this),
        this as any, // !!!
        bag,
      )
    )
  }

  // not DRY
  getISOFields(): PublicDateSlots {
    const slots = getPlainMonthDaySlots(this)
    return { // alphabetical
      calendar: slots.calendar,
      ...pluckProps<IsoDateFields>(isoDateFieldNamesAlpha, slots),
    }
  }

  // not DRY
  getCalendar(): CalendarProtocol {
    const { calendar } = getPlainMonthDaySlots(this)
    return typeof calendar === 'string'
      ? new Calendar(calendar)
      : calendar
  }

  // not DRY
  get calendarId(): string {
    return getId(getPlainMonthDaySlots(this).calendar)
  }

  static from(arg: PlainMonthDayArg, options?: OverflowOptions): PlainMonthDay {
    return createPlainMonthDay(toPlainMonthDaySlots(arg, options))
  }
}

defineStringTag(PlainMonthDay.prototype, PlainMonthDayBranding)

defineProps(PlainMonthDay.prototype, {
  valueOf: neverValueOf,
})

defineGetters(PlainMonthDay.prototype, monthDayGetters)

// Utils
// -------------------------------------------------------------------------------------------------

export function createPlainMonthDay(slots: PlainMonthDaySlots<CalendarSlot>): PlainMonthDay {
  return createViaSlots(PlainMonthDay, slots)
}

export function getPlainMonthDaySlots(plainMonthDay: PlainMonthDay): PlainMonthDaySlots<CalendarSlot> {
  return getSpecificSlots(PlainMonthDayBranding, plainMonthDay) as PlainMonthDaySlots<CalendarSlot>
}

export function toPlainMonthDaySlots(arg: PlainMonthDayArg, options?: OverflowOptions): PlainMonthDaySlots<CalendarSlot> {
  options = prepareOptions(options)

  if (isObjectlike(arg)) {
    const slots = (getSlots(arg) || {}) as { branding?: string, calendar?: CalendarSlot }

    if (slots.branding === PlainMonthDayBranding) {
      refineOverflowOptions(options) // parse unused options
      return slots as PlainMonthDaySlots<CalendarSlot>
    }

    const calendarMaybe = slots.calendar || extractCalendarSlotFromBag(arg as PlainMonthDaySlots<CalendarSlot>)
    const calendar = calendarMaybe || isoCalendarId // TODO: DRY-up this logic

    return PlainMonthDayFuncs.fromFields(
      createMonthDayRefineOps,
      calendar,
      !calendarMaybe,
      arg as MonthDayBag,
      options,
    )
  }

  const res = PlainMonthDayFuncs.fromString(createNativeStandardOps, arg)
  refineOverflowOptions(options) // parse unused options
  return res
}
