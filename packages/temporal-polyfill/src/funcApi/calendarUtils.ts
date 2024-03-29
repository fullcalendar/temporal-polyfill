import { isoCalendarId } from '../internal/calendarConfig'
import { refineCalendarId } from '../internal/calendarId'
import { formatMonthCode } from '../internal/calendarNative'
import {
  createNativeDayOfYearOps,
  createNativeDaysInMonthOps,
  createNativeDaysInYearOps,
  createNativeInLeapYearOps,
  createNativeMonthsInYearOps,
  createNativePartOps,
  createNativeWeekOps,
} from '../internal/calendarNativeQuery'
import { DateFields, MonthDayFields, YearMonthFields } from '../internal/fields'
import { DateSlots } from '../internal/slots'

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

export function computeDateFields(slots: DateSlots<string>): DateFields {
  const calendarOps = createNativePartOps(slots.calendar)
  const [year, month, day] = calendarOps.dateParts(slots)
  const [era, eraYear] = calendarOps.eraParts(slots)
  const [monthCodeNumber, isLeapMonth] = calendarOps.monthCodeParts(year, month)
  const monthCode = formatMonthCode(monthCodeNumber, isLeapMonth)
  return { era, eraYear, year, monthCode, month, day }
}

export function computeYearMonthFields(
  slots: DateSlots<string>,
): YearMonthFields {
  const calendarOps = createNativePartOps(slots.calendar)
  const [year, month] = calendarOps.dateParts(slots)
  const [era, eraYear] = calendarOps.eraParts(slots)
  const [monthCodeNumber, isLeapMonth] = calendarOps.monthCodeParts(year, month)
  const monthCode = formatMonthCode(monthCodeNumber, isLeapMonth)
  return { era, eraYear, year, monthCode, month }
}

export function computeMonthDayFields(
  slots: DateSlots<string>,
): MonthDayFields {
  const calendarOps = createNativePartOps(slots.calendar)
  const [year, month, day] = calendarOps.dateParts(slots)
  const [monthCodeNumber, isLeapMonth] = calendarOps.monthCodeParts(year, month)
  const monthCode = formatMonthCode(monthCodeNumber, isLeapMonth)
  return { monthCode, month, day }
}

// Stats
// -----------------------------------------------------------------------------

export function computeInLeapYear(slots: DateSlots<string>): boolean {
  const calendarOps = createNativeInLeapYearOps(slots.calendar)
  return calendarOps.inLeapYear(slots)
}

export function computeMonthsInYear(slots: DateSlots<string>): number {
  const calendarOps = createNativeMonthsInYearOps(slots.calendar)
  return calendarOps.monthsInYear(slots)
}

export function computeDaysInMonth(slots: DateSlots<string>): number {
  const calendarOps = createNativeDaysInMonthOps(slots.calendar)
  return calendarOps.daysInMonth(slots)
}

export function computeDaysInYear(slots: DateSlots<string>): number {
  const calendarOps = createNativeDaysInYearOps(slots.calendar)
  return calendarOps.daysInYear(slots)
}

export function computeDayOfYear(slots: DateSlots<string>): number {
  const calendarOps = createNativeDayOfYearOps(slots.calendar)
  return calendarOps.dayOfYear(slots)
}

export function computeWeekOfYear(
  slots: DateSlots<string>,
): number | undefined {
  const calendarOps = createNativeWeekOps(slots.calendar)
  return calendarOps.weekOfYear(slots)
}

export function computeYearOfWeek(
  slots: DateSlots<string>,
): number | undefined {
  const calendarOps = createNativeWeekOps(slots.calendar)
  return calendarOps.yearOfWeek(slots)
}
