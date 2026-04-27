import { isoCalendarId } from '../internal/calendarConfig'
import { refineCalendarId } from '../internal/calendarId'
import { formatMonthCode } from '../internal/calendarNative'
import {
  queryNativeDateParts,
  queryNativeDayOfYear,
  queryNativeDaysInMonth,
  queryNativeDaysInYear,
  queryNativeEraParts,
  queryNativeInLeapYear,
  queryNativeMonthCodeParts,
  queryNativeMonthsInYear,
  queryNativeWeekOfYear,
  queryNativeYearOfWeek,
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

export function computeDateFields(slots: DateSlots): DateFields {
  const [year, month, day] = queryNativeDateParts(slots.calendar, slots)
  const [era, eraYear] = queryNativeEraParts(slots.calendar, slots)
  const [monthCodeNumber, isLeapMonth] = queryNativeMonthCodeParts(
    slots.calendar,
    year,
    month,
  )
  const monthCode = formatMonthCode(monthCodeNumber, isLeapMonth)
  return { era, eraYear, year, monthCode, month, day }
}

export function computeYearMonthFields(slots: DateSlots): YearMonthFields {
  const [year, month] = queryNativeDateParts(slots.calendar, slots)
  const [era, eraYear] = queryNativeEraParts(slots.calendar, slots)
  const [monthCodeNumber, isLeapMonth] = queryNativeMonthCodeParts(
    slots.calendar,
    year,
    month,
  )
  const monthCode = formatMonthCode(monthCodeNumber, isLeapMonth)
  return { era, eraYear, year, monthCode, month }
}

export function computeMonthDayFields(slots: DateSlots): MonthDayFields {
  const [year, month, day] = queryNativeDateParts(slots.calendar, slots)
  const [monthCodeNumber, isLeapMonth] = queryNativeMonthCodeParts(
    slots.calendar,
    year,
    month,
  )
  const monthCode = formatMonthCode(monthCodeNumber, isLeapMonth)
  return { monthCode, month, day }
}

// Stats
// -----------------------------------------------------------------------------

export function computeInLeapYear(slots: DateSlots): boolean {
  return queryNativeInLeapYear(slots.calendar, slots)
}

export function computeMonthsInYear(slots: DateSlots): number {
  return queryNativeMonthsInYear(slots.calendar, slots)
}

export function computeDaysInMonth(slots: DateSlots): number {
  return queryNativeDaysInMonth(slots.calendar, slots)
}

export function computeDaysInYear(slots: DateSlots): number {
  return queryNativeDaysInYear(slots.calendar, slots)
}

export function computeDayOfYear(slots: DateSlots): number {
  return queryNativeDayOfYear(slots.calendar, slots)
}

export function computeWeekOfYear(slots: DateSlots): number | undefined {
  return queryNativeWeekOfYear(slots.calendar, slots)
}

export function computeYearOfWeek(slots: DateSlots): number | undefined {
  return queryNativeYearOfWeek(slots.calendar, slots)
}
