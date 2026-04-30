import { refineCalendarId } from '../internal/calendarId'
import { formatMonthCode } from '../internal/calendarMonthCode'
import {
  queryCalendarDateFields,
  queryCalendarDayOfYear,
  queryCalendarDaysInMonth,
  queryCalendarDaysInYear,
  queryCalendarEraFields,
  queryCalendarInLeapYear,
  queryCalendarMonthCodeParts,
  queryCalendarMonthsInYear,
  queryCalendarWeekOfYear,
  queryCalendarYearOfWeek,
} from '../internal/calendarQuery'
import {
  DateFields,
  MonthDayFields,
  YearMonthFields,
} from '../internal/fieldTypes'
import { isoCalendarId } from '../internal/intlCalendarConfig'
import { AbstractDateSlots } from '../internal/slots'

// Calendar ID
// -----------------------------------------------------------------------------

export function getCalendarId(slots: { calendar: string }): string {
  return slots.calendar
}

export function getCalendarIdFromBag(bag: { calendar?: string }): string {
  return extractCalendarIdFromBag(bag) || isoCalendarId
}

export function extractCalendarIdFromBag(bag: { calendar?: string }):
  | string
  | undefined {
  const { calendar } = bag
  if (calendar !== undefined) {
    return refineCalendarId(calendar)
  }
}

// Fields
// -----------------------------------------------------------------------------

export function computeDateFields(slots: AbstractDateSlots): DateFields {
  const { year, month, day } = queryCalendarDateFields(slots.calendar, slots)
  const { era, eraYear } = queryCalendarEraFields(slots.calendar, slots)
  const [monthCodeNumber, isLeapMonth] = queryCalendarMonthCodeParts(
    slots.calendar,
    year,
    month,
  )
  const monthCode = formatMonthCode(monthCodeNumber, isLeapMonth)
  return { era, eraYear, year, monthCode, month, day }
}

export function computeYearMonthFields(
  slots: AbstractDateSlots,
): YearMonthFields {
  const { year, month } = queryCalendarDateFields(slots.calendar, slots)
  const { era, eraYear } = queryCalendarEraFields(slots.calendar, slots)
  const [monthCodeNumber, isLeapMonth] = queryCalendarMonthCodeParts(
    slots.calendar,
    year,
    month,
  )
  const monthCode = formatMonthCode(monthCodeNumber, isLeapMonth)
  return { era, eraYear, year, monthCode, month }
}

export function computeMonthDayFields(
  slots: AbstractDateSlots,
): MonthDayFields {
  const { year, month, day } = queryCalendarDateFields(slots.calendar, slots)
  const [monthCodeNumber, isLeapMonth] = queryCalendarMonthCodeParts(
    slots.calendar,
    year,
    month,
  )
  const monthCode = formatMonthCode(monthCodeNumber, isLeapMonth)
  return { monthCode, month, day }
}

// Stats
// -----------------------------------------------------------------------------

export function computeInLeapYear(slots: AbstractDateSlots): boolean {
  return queryCalendarInLeapYear(slots.calendar, slots)
}

export function computeMonthsInYear(slots: AbstractDateSlots): number {
  return queryCalendarMonthsInYear(slots.calendar, slots)
}

export function computeDaysInMonth(slots: AbstractDateSlots): number {
  return queryCalendarDaysInMonth(slots.calendar, slots)
}

export function computeDaysInYear(slots: AbstractDateSlots): number {
  return queryCalendarDaysInYear(slots.calendar, slots)
}

export function computeDayOfYear(slots: AbstractDateSlots): number {
  return queryCalendarDayOfYear(slots.calendar, slots)
}

export function computeWeekOfYear(
  slots: AbstractDateSlots,
): number | undefined {
  return queryCalendarWeekOfYear(slots.calendar, slots)
}

export function computeYearOfWeek(
  slots: AbstractDateSlots,
): number | undefined {
  return queryCalendarYearOfWeek(slots.calendar, slots)
}
