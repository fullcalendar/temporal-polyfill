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
import {
  type InternalCalendar,
  isoCalendar,
} from '../internal/externalCalendar'
import {
  CalendarDateFields,
  DateFields,
  MonthDayFields,
  YearMonthFields,
} from '../internal/fieldTypes'
import { isoCalendarId } from '../internal/intlCalendarConfig'
import { computeIsoWeekFields } from '../internal/isoCalendarMath'

// these utils used directly by func-api-based slots

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

export function computeDateFields(
  slots: CalendarDateFields & { calendar: InternalCalendar },
): DateFields {
  const { calendar } = slots
  const { year, month, day } = computeCalendarDateFields(calendar, slots)
  const { era, eraYear } = computeCalendarEraFields(calendar, slots)
  const [monthCodeNumber, isLeapMonth] = computeCalendarMonthCodeParts(
    calendar,
    year,
    month,
  )
  const monthCode = formatMonthCode(monthCodeNumber, isLeapMonth)
  return { era, eraYear, year, monthCode, month, day }
}

export function computeYearMonthFields(
  slots: CalendarDateFields & { calendar: InternalCalendar },
): YearMonthFields {
  const { calendar } = slots
  const { year, month } = computeCalendarDateFields(calendar, slots)
  const { era, eraYear } = computeCalendarEraFields(calendar, slots)
  const [monthCodeNumber, isLeapMonth] = computeCalendarMonthCodeParts(
    calendar,
    year,
    month,
  )
  const monthCode = formatMonthCode(monthCodeNumber, isLeapMonth)
  return { era, eraYear, year, monthCode, month }
}

export function computeMonthDayFields(
  slots: CalendarDateFields & { calendar: InternalCalendar },
): MonthDayFields {
  const { calendar } = slots
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

export function computeInLeapYear(
  slots: CalendarDateFields & { calendar: InternalCalendar },
): boolean {
  return computeCalendarInLeapYear(slots.calendar, slots)
}

export function computeMonthsInYear(
  slots: CalendarDateFields & { calendar: InternalCalendar },
): number {
  return computeCalendarMonthsInYear(slots.calendar, slots)
}

export function computeDaysInMonth(
  slots: CalendarDateFields & { calendar: InternalCalendar },
): number {
  return computeCalendarDaysInMonth(slots.calendar, slots)
}

export function computeDaysInYear(
  slots: CalendarDateFields & { calendar: InternalCalendar },
): number {
  return computeCalendarDaysInYear(slots.calendar, slots)
}

export function computeDayOfYear(
  slots: CalendarDateFields & { calendar: InternalCalendar },
): number {
  return computeCalendarDayOfYear(slots.calendar, slots)
}

export function computeWeekOfYear(
  slots: CalendarDateFields & { calendar: InternalCalendar },
): number | undefined {
  return slots.calendar === isoCalendar
    ? computeIsoWeekFields(slots).weekOfYear
    : undefined
}

export function computeYearOfWeek(
  slots: CalendarDateFields & { calendar: InternalCalendar },
): number | undefined {
  return slots.calendar === isoCalendar
    ? computeIsoWeekFields(slots).yearOfWeek
    : undefined
}
