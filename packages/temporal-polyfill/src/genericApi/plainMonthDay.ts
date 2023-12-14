import { isoCalendarId } from '../internal/calendarConfig'
import { MonthDayBag, MonthDayFields, YearFields } from '../internal/calendarFields'
import { ensureString, toInteger } from '../internal/cast'
import { IdLike, isIdLikeEqual } from '../internal/idLike'
import { constrainIsoDateLike } from '../internal/isoFields'
import { formatIsoMonthDayFields, formatPossibleDate } from '../internal/isoFormat'
import { checkIsoDateInBounds, compareIsoDateFields, isoEpochFirstLeapYear } from '../internal/isoMath'
import { parsePlainMonthDay } from '../internal/isoParse'
import { DateTimeDisplayOptions, OverflowOptions, refineDateDisplayOptions } from './options'
import { convertPlainMonthDayToDate, mergePlainMonthDayBag, refinePlainMonthDayBag } from './convert'
import { PlainDateBranding, PlainMonthDayBranding } from './branding'
import { PlainDateSlots, PlainMonthDaySlots } from './genericTypes'
import { DateModOps, MonthDayModOps, MonthDayRefineOps } from '../internal/calendarOps'

export function create<CA, C>(
  refineCalendarArg: (calendarArg: CA) => C,
  isoMonth: number,
  isoDay: number,
  calendar: CA = isoCalendarId as any,
  referenceIsoYear: number = isoEpochFirstLeapYear
): PlainMonthDaySlots<C> {
  const isoMonthInt = toInteger(isoMonth)
  const isoDayInt = toInteger(isoDay)
  const calendarSlot = refineCalendarArg(calendar)
  const isoYearInt = toInteger(referenceIsoYear)

  return {
    ...checkIsoDateInBounds(
      constrainIsoDateLike({
        isoYear: isoYearInt,
        isoMonth: isoMonthInt,
        isoDay: isoDayInt
      })
    ),
    calendar: calendarSlot,
    branding: PlainMonthDayBranding,
  }
}

export function fromString(s: string): PlainMonthDaySlots<string> {
  return {
    ...parsePlainMonthDay(ensureString(s)),
    branding: PlainMonthDayBranding,
  }
}

export function fromFields<C>(
  getCalendarOps: (calendar: C) => MonthDayRefineOps,
  calendarSlot: C,
  calendarAbsent: boolean,
  fields: MonthDayBag,
  options?: OverflowOptions
): PlainMonthDaySlots<C> {
  const calendarOps = getCalendarOps(calendarSlot)

  return {
    ...refinePlainMonthDayBag(calendarOps, calendarAbsent, fields, options),
    calendar: calendarSlot,
    branding: PlainMonthDayBranding,
  }
}

export function withFields<C>(
  getCalendarOps: (calendarSlot: C) => MonthDayModOps,
  plainMonthDaySlots: PlainMonthDaySlots<C>,
  initialFields: MonthDayFields,
  modFields: MonthDayBag,
  options?: OverflowOptions,
): PlainMonthDaySlots<C> {
  const calendarSlot = plainMonthDaySlots.calendar
  const calendarOps = getCalendarOps(calendarSlot)

  return {
    ...mergePlainMonthDayBag(calendarOps, initialFields, modFields, options),
    calendar: calendarSlot,
    branding: PlainMonthDayBranding,
  }
}

export function equals<C extends IdLike>(
  plainMonthDaySlots0: PlainMonthDaySlots<C>,
  plainMonthDaySlots1: PlainMonthDaySlots<C>,
): boolean {
  return !compareIsoDateFields(plainMonthDaySlots0, plainMonthDaySlots1) &&
    isIdLikeEqual(plainMonthDaySlots0.calendar, plainMonthDaySlots1.calendar)
}

export function toString(
  plainMonthDaySlots: PlainMonthDaySlots<IdLike>,
  options?: DateTimeDisplayOptions,
): string {
  return formatPossibleDate(
    plainMonthDaySlots.calendar,
    formatIsoMonthDayFields,
    plainMonthDaySlots,
    refineDateDisplayOptions(options),
  )
}

export function toJSON(
  plainMonthDaySlots: PlainMonthDaySlots<IdLike>,
): string {
  return toString(plainMonthDaySlots)
}

export function toPlainDate<C>(
  getCalendarOps: (calendar: C) => DateModOps,
  plainMonthDaySlots: PlainMonthDaySlots<C>,
  plainMonthDayFields: MonthDayFields,
  bag: YearFields,
): PlainDateSlots<C> {
  const calendarSlot = plainMonthDaySlots.calendar
  const calendarOps = getCalendarOps(calendarSlot)

  return {
    ...convertPlainMonthDayToDate(calendarOps, plainMonthDayFields, bag),
    calendar: calendarSlot,
    branding: PlainDateBranding,
  }
}
