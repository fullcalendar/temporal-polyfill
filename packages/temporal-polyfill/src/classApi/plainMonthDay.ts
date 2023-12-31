import { isoCalendarId } from '../internal/calendarConfig'
import { MonthDayBag, YearFields } from '../internal/calendarFields'
import { LocalesArg } from '../internal/formatIntl'
import { DateTimeDisplayOptions, OverflowOptions, copyOptions, refineOverflowOptions } from '../internal/optionsRefine'
import { defineGetters, defineProps, defineStringTag, isObjectlike } from '../internal/utils'
import { BrandingSlots, PlainMonthDayBranding, PlainMonthDaySlots, getId, removeBranding } from '../internal/slots'
import { PublicDateSlots, createViaSlots, getSlots, getSpecificSlots, rejectInvalidBag, setSlots } from './slotsForClasses'
import { PlainDate, createPlainDate } from './plainDate'
import { CalendarSlot, extractCalendarSlotFromBag, refineCalendarSlot } from './slotsForClasses'
import { Calendar, CalendarArg } from './calendar'
import { CalendarProtocol } from './calendarProtocol'
import { neverValueOf } from './mixins'
import { createDateModOps, createMonthDayModOps, createMonthDayRefineOps } from './calendarOpsQuery'
import { monthDayGetters } from './mixins'
import { createNativeStandardOps } from '../internal/calendarNativeQuery'
import { PlainMonthDayBag, plainMonthDayWithFields, refinePlainMonthDayBag } from '../internal/bag'
import { constructPlainMonthDaySlots } from '../internal/construct'
import { plainMonthDaysEqual } from '../internal/compare'
import { formatPlainMonthDayIso } from '../internal/formatIso'
import { plainMonthDayToPlainDate } from '../internal/convert'
import { parsePlainMonthDay } from '../internal/parseIso'
import { prepPlainMonthDayFormat } from './dateTimeFormat'

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
      constructPlainMonthDaySlots(refineCalendarSlot, isoMonth, isoDay, calendar, referenceIsoYear)
    )
  }

  with(mod: MonthDayBag, options?: OverflowOptions): PlainMonthDay {
    return createPlainMonthDay(
      plainMonthDayWithFields(
        createMonthDayModOps,
        getPlainMonthDaySlots(this),
        this as any, // !!!
        rejectInvalidBag(mod),
        options,
      )
    )
  }

  equals(otherArg: PlainMonthDayArg): boolean {
    return plainMonthDaysEqual(getPlainMonthDaySlots(this), toPlainMonthDaySlots(otherArg))
  }

  toString(options?: DateTimeDisplayOptions): string {
    return formatPlainMonthDayIso(getPlainMonthDaySlots(this), options)
  }

  toJSON(): string {
    return formatPlainMonthDayIso(getPlainMonthDaySlots(this))
  }

  toLocaleString(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions): string {
    const [format, epochMilli] = prepPlainMonthDayFormat(locales, options, getPlainMonthDaySlots(this))
    return format.format(epochMilli)
  }

  toPlainDate(bag: YearFields): PlainDate {
    return createPlainDate(
      plainMonthDayToPlainDate(
        createDateModOps,
        getPlainMonthDaySlots(this),
        this as any, // !!!
        bag,
      )
    )
  }

  // not DRY
  getISOFields(): PublicDateSlots {
    return removeBranding(getPlainMonthDaySlots(this))
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
  options = copyOptions(options)

  if (isObjectlike(arg)) {
    const slots = getSlots(arg)

    if (slots && slots.branding === PlainMonthDayBranding) {
      refineOverflowOptions(options) // parse unused options
      return slots as PlainMonthDaySlots<CalendarSlot>
    }

    const calendarMaybe = extractCalendarSlotFromBag(arg as PlainMonthDaySlots<CalendarSlot>)
    const calendar = calendarMaybe || isoCalendarId

    return refinePlainMonthDayBag(
      createMonthDayRefineOps(calendar),
      !calendarMaybe,
      arg as MonthDayBag,
      options,
    )
  }

  const res = parsePlainMonthDay(createNativeStandardOps, arg)
  refineOverflowOptions(options) // parse unused options
  return res
}
