import { CalendarArg, CalendarProtocol, createCalendar } from './calendar'
import { isoCalendarId } from '../internal/calendarConfig'
import { MonthDayBag, YearFields, monthDayGetterNames } from '../internal/calendarFields'
import {
  convertPlainMonthDayToDate,
  mergePlainMonthDayBag,
  refinePlainMonthDayBag,
  rejectInvalidBag,
} from '../internal/convert'
import { IsoDatePublic, refineIsoDateInternals, refineIsoMonthDayInternals } from '../internal/isoInternals'
import { formatIsoMonthDayFields, formatPossibleDate } from '../internal/isoFormat'
import { createToLocaleStringMethods } from '../internal/intlFormat'
import { isoEpochFirstLeapYear } from '../internal/isoMath'
import { isPlainMonthDaysEqual } from '../internal/equality'
import { parsePlainMonthDay } from '../internal/isoParse'
import { DateTimeDisplayOptions, OverflowOptions, prepareOptions, refineOverflowOptions } from '../internal/options'
import { PlainDate, createPlainDate } from './plainDate'
import { CalendarBranding, PlainDateBranding, PlainMonthDayBranding, PlainMonthDaySlots, createViaSlots, getSlots, getSpecificSlots, setSlots } from '../internal/slots'
import { createCalendarGetterMethods, createCalendarIdGetterMethods, neverValueOf } from './publicMixins'
import { defineGetters, defineProps, defineStringTag, isObjectlike, pluckProps } from '../internal/utils'
import { ensureString } from '../internal/cast'
import { IsoDateFields, isoDateFieldNames } from '../internal/isoFields'

export type PlainMonthDayBag = MonthDayBag & { calendar?: CalendarArg }
export type PlainMonthDayMod = MonthDayBag
export type PlainMonthDayArg = PlainMonthDay | PlainMonthDayBag | string

export class PlainMonthDay {
  constructor(
    isoMonth: number,
    isoDay: number,
    calendar: CalendarArg = isoCalendarId,
    referenceIsoYear: number = isoEpochFirstLeapYear
  ) {
    setSlots(this, {
      branding: PlainMonthDayBranding,
      ...refineIsoMonthDayInternals({
        isoYear: referenceIsoYear,
        isoMonth,
        isoDay,
        calendar,
      })
    })
  }

  with(mod: PlainMonthDayMod, options?: OverflowOptions): PlainMonthDay {
    getPlainMonthDaySlots(this) // validate `this`
    return createPlainMonthDay({
      branding: PlainMonthDayBranding,
      ...mergePlainMonthDayBag(this, rejectInvalidBag(mod), prepareOptions(options))
    })
  }

  equals(otherArg: PlainMonthDayArg): boolean {
    return isPlainMonthDaysEqual(getPlainMonthDaySlots(this), toPlainMonthDaySlots(otherArg))
  }

  toString(options?: DateTimeDisplayOptions): string {
    return formatPossibleDate(formatIsoMonthDayFields, getPlainMonthDaySlots(this), options)
  }

  toJSON(): string {
    return formatPossibleDate(formatIsoMonthDayFields, getPlainMonthDaySlots(this))
  }

  toPlainDate(bag: YearFields): PlainDate {
    return createPlainDate({
      ...convertPlainMonthDayToDate(this, bag),
      branding: PlainDateBranding,
    })
  }

  // not DRY
  getISOFields(): IsoDatePublic {
    const slots = getPlainMonthDaySlots(this)
    return { // !!!
      calendar: slots.calendar,
      ...pluckProps<IsoDateFields>(isoDateFieldNames, slots),
    }
  }

  // not DRY
  getCalendar(): CalendarProtocol {
    const { calendar } = getPlainMonthDaySlots(this)
    return typeof calendar === 'string'
      ? createCalendar({ branding: CalendarBranding, id: calendar })
      : calendar
  }

  static from(arg: PlainMonthDayArg, options?: OverflowOptions): PlainMonthDay {
    return createPlainMonthDay(toPlainMonthDaySlots(arg, options))
  }
}

defineStringTag(PlainMonthDay.prototype, PlainMonthDayBranding)

defineProps(PlainMonthDay.prototype, {
  ...createToLocaleStringMethods(PlainMonthDayBranding),
  valueOf: neverValueOf,
})

const cdm = createCalendarGetterMethods(PlainMonthDayBranding, monthDayGetterNames)
delete (cdm as any).month // hack

defineGetters(PlainMonthDay.prototype, {
  ...createCalendarIdGetterMethods(PlainMonthDayBranding),
  ...cdm,
})

// Utils
// -------------------------------------------------------------------------------------------------

export function createPlainMonthDay(slots: PlainMonthDaySlots): PlainMonthDay {
  return createViaSlots(PlainMonthDay, slots)
}

export function getPlainMonthDaySlots(plainMonthDay: PlainMonthDay): PlainMonthDaySlots {
  return getSpecificSlots(PlainMonthDayBranding, plainMonthDay) as PlainMonthDaySlots
}

export function toPlainMonthDaySlots(arg: PlainMonthDayArg, options?: OverflowOptions): PlainMonthDaySlots {
  options = prepareOptions(options)

  if (isObjectlike(arg)) {
    const slots = getSlots(arg)
    if (slots && slots.branding === PlainMonthDayBranding) {
      refineOverflowOptions(options) // parse unused options
      return slots as PlainMonthDaySlots
    }
    return { ...refinePlainMonthDayBag(arg as PlainMonthDayBag, options), branding: PlainMonthDayBranding }
  }

  const res = { ...parsePlainMonthDay(ensureString(arg)), branding: PlainMonthDayBranding }
  refineOverflowOptions(options) // parse unused options
  return res
}
