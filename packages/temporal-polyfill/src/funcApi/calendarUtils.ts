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

// these utils used directly by func-api-based slots

// Calendar ID
// -----------------------------------------------------------------------------

export function getCalendarId(slots: { calendarId: string }): string {
  return slots.calendarId
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
  const { year, month, day } = queryCalendarDateFields(slots.calendarId, slots)
  const { era, eraYear } = queryCalendarEraFields(slots.calendarId, slots)
  const [monthCodeNumber, isLeapMonth] = queryCalendarMonthCodeParts(
    slots.calendarId,
    year,
    month,
  )
  const monthCode = formatMonthCode(monthCodeNumber, isLeapMonth)
  return { era, eraYear, year, monthCode, month, day }
}

export function computeYearMonthFields(
  slots: AbstractDateSlots,
): YearMonthFields {
  const { year, month } = queryCalendarDateFields(slots.calendarId, slots)
  const { era, eraYear } = queryCalendarEraFields(slots.calendarId, slots)
  const [monthCodeNumber, isLeapMonth] = queryCalendarMonthCodeParts(
    slots.calendarId,
    year,
    month,
  )
  const monthCode = formatMonthCode(monthCodeNumber, isLeapMonth)
  return { era, eraYear, year, monthCode, month }
}

export function computeMonthDayFields(
  slots: AbstractDateSlots,
): MonthDayFields {
  const { year, month, day } = queryCalendarDateFields(slots.calendarId, slots)
  const [monthCodeNumber, isLeapMonth] = queryCalendarMonthCodeParts(
    slots.calendarId,
    year,
    month,
  )
  const monthCode = formatMonthCode(monthCodeNumber, isLeapMonth)
  return { monthCode, month, day }
}

// Stats
// -----------------------------------------------------------------------------

export function computeInLeapYear(slots: AbstractDateSlots): boolean {
  return queryCalendarInLeapYear(slots.calendarId, slots)
}

export function computeMonthsInYear(slots: AbstractDateSlots): number {
  return queryCalendarMonthsInYear(slots.calendarId, slots)
}

export function computeDaysInMonth(slots: AbstractDateSlots): number {
  return queryCalendarDaysInMonth(slots.calendarId, slots)
}

export function computeDaysInYear(slots: AbstractDateSlots): number {
  return queryCalendarDaysInYear(slots.calendarId, slots)
}

export function computeDayOfYear(slots: AbstractDateSlots): number {
  return queryCalendarDayOfYear(slots.calendarId, slots)
}

export function computeWeekOfYear(
  slots: AbstractDateSlots,
): number | undefined {
  return queryCalendarWeekOfYear(slots.calendarId, slots)
}

export function computeYearOfWeek(
  slots: AbstractDateSlots,
): number | undefined {
  return queryCalendarYearOfWeek(slots.calendarId, slots)
}
