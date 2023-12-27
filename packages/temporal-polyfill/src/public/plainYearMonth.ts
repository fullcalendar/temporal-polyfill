import { isoCalendarId } from '../internal/calendarConfig'
import { YearMonthBag } from '../internal/calendarFields'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { IsoDateFields, isoDateFieldNamesAlpha } from '../internal/calendarIsoFields'
import { LocalesArg, prepPlainYearMonthFormat } from '../internal/formatIntl'
import { DateTimeDisplayOptions, DiffOptions, OverflowOptions, prepareOptions, refineOverflowOptions } from '../internal/optionsRefine'
import { NumSign, defineGetters, defineProps, defineStringTag, isObjectlike, pluckProps } from '../internal/utils'
import * as PlainYearMonthFuncs from '../genericApi/plainYearMonth'
import { PlainYearMonthBranding, PlainYearMonthSlots, getId } from '../internal/slots'
import { PublicDateSlots, createViaSlots, getSlots, getSpecificSlots, setSlots, rejectInvalidBag } from './slotsForClasses'
import { CalendarSlot, getCalendarSlotFromBag, refineCalendarSlot } from './calendarSlot'
import { Calendar, CalendarArg } from './calendar'
import { CalendarProtocol } from './calendarProtocol'
import { PlainDate, createPlainDate } from './plainDate'
import { neverValueOf } from './mixins'
import { createDateModOps, createYearMonthDiffOps, createYearMonthModOps, createYearMonthMoveOps, createYearMonthRefineOps } from './calendarOpsQuery'
import { yearMonthGetters } from './mixins'
import { createNativeStandardOps } from '../internal/calendarNativeQuery'
import { PlainYearMonthBag } from '../internal/bag'

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
        createYearMonthModOps,
        getPlainYearMonthSlots(this),
        this as any, // !!!
        rejectInvalidBag(mod),
        options,
      )
    )
  }

  add(durationArg: DurationArg, options?: OverflowOptions): PlainYearMonth {
    return createPlainYearMonth(
      PlainYearMonthFuncs.add(
        createYearMonthMoveOps,
        getPlainYearMonthSlots(this),
        toDurationSlots(durationArg),
        options,
      )
    )
  }

  subtract(
    durationArg: DurationArg,
    options?: OverflowOptions
  ): PlainYearMonth {
    return createPlainYearMonth(
      PlainYearMonthFuncs.subtract(
        createYearMonthMoveOps,
        getPlainYearMonthSlots(this),
        toDurationSlots(durationArg),
        options,
      )
    )
  }

  until(otherArg: PlainYearMonthArg, options?: DiffOptions): Duration {
    return createDuration(
      PlainYearMonthFuncs.until(
        createYearMonthDiffOps,
        getPlainYearMonthSlots(this),
        toPlainYearMonthSlots(otherArg),
        options
      )
    )
  }

  since(otherArg: PlainYearMonthArg, options?: DiffOptions): Duration {
    return createDuration(
      PlainYearMonthFuncs.since(
        createYearMonthDiffOps,
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
        createDateModOps,
        getPlainYearMonthSlots(this),
        this as any, // !!!
        bag,
      )
    )
  }

  // not DRY
  getISOFields(): PublicDateSlots {
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
      ? new Calendar(calendar)
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
  ...yearMonthGetters,
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
      createYearMonthRefineOps(slots.calendar || getCalendarSlotFromBag(arg as any)), // !!!
      arg as any, // !!!
      options,
    )
  }

  const res = PlainYearMonthFuncs.fromString(createNativeStandardOps, arg)
  refineOverflowOptions(options) // parse unused options
  return res
}
