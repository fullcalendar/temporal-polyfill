import { isoCalendarId } from '../internal/calendarConfig'
import { YearMonthBag, yearMonthGetterNames } from '../internal/calendarFields'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { IsoDateFields, isoDateFieldNamesAlpha } from '../internal/isoFields'
import { LocalesArg, prepPlainYearMonthFormat } from '../internal/intlFormat'
import { DateTimeDisplayOptions, DiffOptions, OverflowOptions, prepareOptions, refineOverflowOptions } from '../genericApi/options'
import { NumSign, defineGetters, defineProps, defineStringTag, isObjectlike, pluckProps } from '../internal/utils'
import { getId } from '../internal/idLike'
import { PlainYearMonthBag } from '../genericApi/genericBag'
import { CalendarBranding, PlainYearMonthBranding } from '../genericApi/branding'
import * as PlainYearMonthFuncs from '../genericApi/plainYearMonth'
import { PlainYearMonthSlots } from '../genericApi/genericTypes'

// public
import { IsoDateSlots, createViaSlots, getSlots, getSpecificSlots, setSlots, rejectInvalidBag } from './slots'
import { CalendarSlot, getCalendarSlotFromBag, refineCalendarSlot } from './calendarSlot'
import { CalendarArg, CalendarProtocol, createCalendar } from './calendar'
import { PlainDate, createPlainDate } from './plainDate'
import { createCalendarGetterMethods, neverValueOf } from './publicMixins'
import { createYearMonthDiffCalendarRecord, createYearMonthModCalendarRecord, createYearMonthMoveCalendarRecord, createYearMonthNewCalendarRecord, getDateModCalendarRecord } from './recordCreators'

export type PlainYearMonthArg = PlainYearMonth | PlainYearMonthBag<CalendarArg> | string

export class PlainYearMonth {
  constructor(
    isoYear: number,
    isoMonth: number,
    calendar: CalendarArg = isoCalendarId,
    referenceIsoDay: number = 1
  ) {
    setSlots(
      this,
      PlainYearMonthFuncs.create(refineCalendarSlot, isoYear, isoMonth, calendar, referenceIsoDay)
    )
  }

  with(mod: YearMonthBag, options?: OverflowOptions): PlainYearMonth {
    return createPlainYearMonth(
      PlainYearMonthFuncs.withFields(
        createYearMonthModCalendarRecord,
        getPlainYearMonthSlots(this),
        this as any, // !!!
        rejectInvalidBag(mod),
        prepareOptions(options),
      )
    )
  }

  add(
    durationArg: DurationArg,
    options: OverflowOptions = Object.create(null), // b/c CalendarProtocol likes empty object
  ): PlainYearMonth {
    return createPlainYearMonth(
      PlainYearMonthFuncs.add(
        createYearMonthMoveCalendarRecord,
        getPlainYearMonthSlots(this),
        toDurationSlots(durationArg),
        options,
      )
    )
  }

  subtract(
    durationArg: DurationArg,
    options: OverflowOptions = Object.create(null), // b/c CalendarProtocol likes empty object
  ): PlainYearMonth {
    return createPlainYearMonth(
      PlainYearMonthFuncs.subtract(
        createYearMonthMoveCalendarRecord,
        getPlainYearMonthSlots(this),
        toDurationSlots(durationArg),
        options,
      )
    )
  }

  until(otherArg: PlainYearMonthArg, options?: DiffOptions): Duration {
    return createDuration(
      PlainYearMonthFuncs.until(
        createYearMonthDiffCalendarRecord,
        getPlainYearMonthSlots(this),
        toPlainYearMonthSlots(otherArg),
        options
      )
    )
  }

  since(otherArg: PlainYearMonthArg, options?: DiffOptions): Duration {
    return createDuration(
      PlainYearMonthFuncs.since(
        createYearMonthDiffCalendarRecord,
        getPlainYearMonthSlots(this),
        toPlainYearMonthSlots(otherArg),
        options
      )
    )
  }

  equals(otherArg: PlainYearMonthArg): boolean {
    return PlainYearMonthFuncs.equals(getPlainYearMonthSlots(this), toPlainYearMonthSlots(otherArg))
  }

  toString(options?: DateTimeDisplayOptions) {
    return PlainYearMonthFuncs.toString(getPlainYearMonthSlots(this), options)
  }

  toJSON() {
    return PlainYearMonthFuncs.toJSON(getPlainYearMonthSlots(this))
  }

  toLocaleString(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions): string {
    const [format, epochMilli] = prepPlainYearMonthFormat(locales, options, getPlainYearMonthSlots(this))
    return format.format(epochMilli)
  }

  toPlainDate(bag: { day: number }): PlainDate {
    return createPlainDate(
      PlainYearMonthFuncs.toPlainDate(
        getDateModCalendarRecord,
        getPlainYearMonthSlots(this),
        this as any, // !!!
        bag,
      )
    )
  }

  // not DRY
  getISOFields(): IsoDateSlots {
    const slots = getPlainYearMonthSlots(this)
    return { // alphabetical
      calendar: slots.calendar,
      ...pluckProps<IsoDateFields>(isoDateFieldNamesAlpha, slots),
    }
  }

  // not DRY
  getCalendar(): CalendarProtocol {
    const { calendar } = getPlainYearMonthSlots(this)
    return typeof calendar === 'string'
      ? createCalendar({ branding: CalendarBranding, id: calendar })
      : calendar
  }

  // not DRY
  get calendarId(): string {
    return getId(getPlainYearMonthSlots(this).calendar)
  }

  static from(arg: PlainYearMonthArg, options?: OverflowOptions): PlainYearMonth {
    return createPlainYearMonth(toPlainYearMonthSlots(arg, options))
  }

  static compare(arg0: PlainYearMonthArg, arg1: PlainYearMonthArg): NumSign {
    return PlainYearMonthFuncs.compare(
      toPlainYearMonthSlots(arg0),
      toPlainYearMonthSlots(arg1),
    )
  }
}

defineStringTag(PlainYearMonth.prototype, PlainYearMonthBranding)

defineProps(PlainYearMonth.prototype, {
  valueOf: neverValueOf,
})

defineGetters(PlainYearMonth.prototype, {
  ...createCalendarGetterMethods(PlainYearMonthBranding, yearMonthGetterNames),
})

// Utils
// -------------------------------------------------------------------------------------------------

export function createPlainYearMonth(slots: PlainYearMonthSlots<CalendarSlot>): PlainYearMonth {
  return createViaSlots(PlainYearMonth, slots)
}

export function getPlainYearMonthSlots(plainYearMonth: PlainYearMonth): PlainYearMonthSlots<CalendarSlot> {
  return getSpecificSlots(PlainYearMonthBranding, plainYearMonth) as PlainYearMonthSlots<CalendarSlot>
}

export function toPlainYearMonthSlots(arg: PlainYearMonthArg, options?: OverflowOptions) {
  options = prepareOptions(options)

  if (isObjectlike(arg)) {
    const slots = (getSlots(arg) || {}) as { branding?: string, calendar?: CalendarSlot }

    if (slots.branding === PlainYearMonthBranding) {
      refineOverflowOptions(options) // parse unused options
      return slots as PlainYearMonthSlots<CalendarSlot>
    }

    return PlainYearMonthFuncs.fromFields(
      createYearMonthNewCalendarRecord,
      slots.calendar || getCalendarSlotFromBag(arg as any), // !!!
      arg as any, // !!!
      options,
    )
  }

  const res = PlainYearMonthFuncs.fromString(arg)
  refineOverflowOptions(options) // parse unused options
  return res
}
