import {
  computeCalendarDateFields,
  computeCalendarDayOfYear,
  computeCalendarDaysInMonth,
  computeCalendarDaysInYear,
  computeCalendarEraFields,
  computeCalendarInLeapYear,
  computeCalendarMonthCodeParts,
  computeCalendarMonthsInYear,
} from '../internal/calendarDerived'
import { refineCalendarId } from '../internal/calendarId'
import { formatMonthCode } from '../internal/calendarMonthCode'
import { getInternalCalendar } from '../internal/externalCalendar'
import {
  DateFields,
  MonthDayFields,
  YearMonthFields,
} from '../internal/fieldTypes'
import { isoCalendarId } from '../internal/intlCalendarConfig'
import { computeIsoWeekFields } from '../internal/isoMath'
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
  const calendar = getInternalCalendar(slots.calendarId)
  const { year, month, day } = computeCalendarDateFields(calendar, slots)
  const { era, eraYear } = computeCalendarEraFields(
    calendar,
    slots.calendarId,
    slots,
  )
  const [monthCodeNumber, isLeapMonth] = computeCalendarMonthCodeParts(
    calendar,
    year,
    month,
  )
  const monthCode = formatMonthCode(monthCodeNumber, isLeapMonth)
  return { era, eraYear, year, monthCode, month, day }
}

export function computeYearMonthFields(
  slots: AbstractDateSlots,
): YearMonthFields {
  const calendar = getInternalCalendar(slots.calendarId)
  const { year, month } = computeCalendarDateFields(calendar, slots)
  const { era, eraYear } = computeCalendarEraFields(
    calendar,
    slots.calendarId,
    slots,
  )
  const [monthCodeNumber, isLeapMonth] = computeCalendarMonthCodeParts(
    calendar,
    year,
    month,
  )
  const monthCode = formatMonthCode(monthCodeNumber, isLeapMonth)
  return { era, eraYear, year, monthCode, month }
}

export function computeMonthDayFields(
  slots: AbstractDateSlots,
): MonthDayFields {
  const calendar = getInternalCalendar(slots.calendarId)
  const { year, month, day } = computeCalendarDateFields(calendar, slots)
  const [monthCodeNumber, isLeapMonth] = computeCalendarMonthCodeParts(
    calendar,
    year,
    month,
  )
  const monthCode = formatMonthCode(monthCodeNumber, isLeapMonth)
  return { monthCode, month, day }
}

// Stats
// -----------------------------------------------------------------------------

export function computeInLeapYear(slots: AbstractDateSlots): boolean {
  return computeCalendarInLeapYear(getInternalCalendar(slots.calendarId), slots)
}

export function computeMonthsInYear(slots: AbstractDateSlots): number {
  return computeCalendarMonthsInYear(
    getInternalCalendar(slots.calendarId),
    slots,
  )
}

export function computeDaysInMonth(slots: AbstractDateSlots): number {
  return computeCalendarDaysInMonth(
    getInternalCalendar(slots.calendarId),
    slots,
  )
}

export function computeDaysInYear(slots: AbstractDateSlots): number {
  return computeCalendarDaysInYear(getInternalCalendar(slots.calendarId), slots)
}

export function computeDayOfYear(slots: AbstractDateSlots): number {
  return computeCalendarDayOfYear(getInternalCalendar(slots.calendarId), slots)
}

export function computeWeekOfYear(
  slots: AbstractDateSlots,
): number | undefined {
  return slots.calendarId === isoCalendarId
    ? computeIsoWeekFields(slots).weekOfYear
    : undefined
}

export function computeYearOfWeek(
  slots: AbstractDateSlots,
): number | undefined {
  return slots.calendarId === isoCalendarId
    ? computeIsoWeekFields(slots).yearOfWeek
    : undefined
}
