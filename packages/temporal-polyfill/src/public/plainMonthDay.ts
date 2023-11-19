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
import { calendarImplDateFromFields, calendarImplFields, calendarImplMergeFields, calendarImplMonthDayFromFields } from '../internal/calendarRecordSimple'
import { convertPlainMonthDayToDate, mergePlainMonthDayBag, refinePlainMonthDayBag } from '../internal/convert'
import { PlainMonthDayBag } from '../internal/genericBag'

// public
import { CalendarBranding, IsoDateSlots, PlainDateBranding, PlainMonthDayBranding, PlainMonthDaySlots, createViaSlots, getSlots, getSpecificSlots, setSlots, refineIsoMonthDaySlots, rejectInvalidBag } from './slots'
import { PlainDate, createPlainDate } from './plainDate'
import { extractBagCalendarSlot, getCalendarSlotId, isCalendarSlotsEqual } from './calendarSlot'
import { CalendarArg, CalendarProtocol, createCalendar } from './calendar'
import { createCalendarGetterMethods, createCalendarIdGetterMethods, neverValueOf } from './publicMixins'
import { calendarProtocolDateFromFields, calendarProtocolFields, calendarProtocolMergeFields, calendarProtocolMonthDayFromFields, createCalendarSlotRecord } from './calendarRecordComplex'

export type PlainMonthDayArg = PlainMonthDay | PlainMonthDayBag<CalendarArg> | string

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

  with(mod: MonthDayBag, options?: OverflowOptions): PlainMonthDay {
    const { calendar } = getPlainMonthDaySlots(this)
    const calendarRecord = createCalendarSlotRecord(calendar, {
      monthDayFromFields: calendarImplMonthDayFromFields,
      fields: calendarImplFields,
      mergeFields: calendarImplMergeFields,
    }, {
      monthDayFromFields: calendarProtocolMonthDayFromFields,
      fields: calendarProtocolFields,
      mergeFields: calendarProtocolMergeFields,
    })

    return createPlainMonthDay({
      ...mergePlainMonthDayBag(calendarRecord, this, rejectInvalidBag(mod), prepareOptions(options)),
      calendar,
      branding: PlainMonthDayBranding,
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
    const { calendar } = getPlainMonthDaySlots(this)
    const calendarRecord = createCalendarSlotRecord(calendar, {
      dateFromFields: calendarImplDateFromFields,
      fields: calendarImplFields,
      mergeFields: calendarImplMergeFields,
    }, {
      dateFromFields: calendarProtocolDateFromFields,
      fields: calendarProtocolFields,
      mergeFields: calendarProtocolMergeFields,
    })

    return createPlainDate({
      ...convertPlainMonthDayToDate(calendarRecord, this, bag),
      calendar,
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

    const calendarMaybe = extractBagCalendarSlot(arg) // TODO: double-access of slots(.calendar)
    const calendar = calendarMaybe || isoCalendarId

    const calendarRecord = createCalendarSlotRecord(calendar, {
      monthDayFromFields: calendarImplMonthDayFromFields,
      fields: calendarImplFields,
    }, {
      monthDayFromFields: calendarProtocolMonthDayFromFields,
      fields: calendarProtocolFields,
    })

    return {
      ...refinePlainMonthDayBag(calendarRecord, !calendarMaybe, arg as MonthDayBag, options),
      calendar,
      branding: PlainMonthDayBranding,
    }
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
