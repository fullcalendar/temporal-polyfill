import { DateBasics, DateFields, EraYearFields, MonthDayFields, YearMonthFields } from '../internal/calendarFields'
import { createNativeDayOfYearOps, createNativeDaysInMonthOps, createNativeDaysInYearOps, createNativeInLeapYearOps, createNativeMonthsInYearOps, createNativePartOps } from '../internal/calendarNativeQuery'
import { formatMonthCode } from '../internal/calendarNative'
import { DateSlots } from '../internal/slots'

export function computeDateBasics(
  slots: DateSlots<string>,
): DateBasics {
  const calendarOps = createNativePartOps(slots.calendar)
  const [year, month, day] = calendarOps.dateParts(slots)
  return { year, month, day }
}

export function computeDateFields(
  slots: DateSlots<string>,
): DateFields & Partial<EraYearFields> {
  const calendarOps = createNativePartOps(slots.calendar)
  const [year, month, day] = calendarOps.dateParts(slots)
  const [era, eraYear] = calendarOps.eraParts(slots)
  const [monthCodeNumber, isLeapMonth] = calendarOps.monthCodeParts(year, month)
  const monthCode = formatMonthCode(monthCodeNumber, isLeapMonth)
  return { era, eraYear, year, monthCode, month, day }
}

export function computeYearMonthFields(
  slots: DateSlots<string>,
): YearMonthFields & Partial<EraYearFields> {
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
