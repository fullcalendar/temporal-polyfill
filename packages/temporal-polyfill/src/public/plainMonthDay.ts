import { isoCalendarId } from '../internal/calendarConfig'
import { MonthDayBag, YearFields, monthDayGetterNames } from '../internal/calendarFields'
import { formatIsoMonthDayFields, formatPossibleDate } from '../internal/isoFormat'
import { LocalesArg, formatMonthDayLocaleString } from '../internal/intlFormat'
import { compareIsoDateFields, isoEpochFirstLeapYear } from '../internal/isoMath'
import { parsePlainMonthDay } from '../internal/isoParse'
import { DateTimeDisplayOptions, OverflowOptions, prepareOptions, refineOverflowOptions } from '../internal/options'
import { defineGetters, defineProps, defineStringTag, isObjectlike, pluckProps } from '../internal/utils'
import { ensureString } from '../internal/cast'
import { IsoDateFields, isoDateFieldNames } from '../internal/isoFields'

// public
import { CalendarBranding, IsoDateSlots, PlainDateBranding, PlainMonthDayBranding, PlainMonthDaySlots, createViaSlots, getSlots, getSpecificSlots, setSlots, refineIsoMonthDaySlots } from './slots'
import {
  convertPlainMonthDayToDate,
  mergePlainMonthDayBag,
  refinePlainMonthDayBag,
  rejectInvalidBag,
} from './convert'
import { PlainDate, createPlainDate } from './plainDate'
import { getCalendarSlotId, isCalendarSlotsEqual } from './calendarSlot'
import { CalendarArg, CalendarProtocol, createCalendar } from './calendar'
import { createCalendarGetterMethods, createCalendarIdGetterMethods, neverValueOf } from './publicMixins'

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
      ...refineIsoMonthDaySlots({
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
    const slots = getPlainMonthDaySlots(this)

    return formatPossibleDate(
      getCalendarSlotId(slots.calendar),
      formatIsoMonthDayFields,
      slots,
      options,
    )
  }

  toJSON(): string {
    const slots = getPlainMonthDaySlots(this)

    return formatPossibleDate(
      getCalendarSlotId(slots.calendar),
      formatIsoMonthDayFields,
      slots,
    )
  }

  toLocaleString(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) {
    const slots = getPlainMonthDaySlots(this)
    return formatMonthDayLocaleString(getCalendarSlotId(slots.calendar), slots, locales, options)
  }

  toPlainDate(bag: YearFields): PlainDate {
    return createPlainDate({
      ...convertPlainMonthDayToDate(this, bag),
      branding: PlainDateBranding,
    })
  }

  // not DRY
  getISOFields(): IsoDateSlots {
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

export function isPlainMonthDaysEqual(
  a: IsoDateSlots,
  b: IsoDateSlots,
): boolean {
  return !compareIsoDateFields(a, b) &&
    isCalendarSlotsEqual(a.calendar, b.calendar)
}
