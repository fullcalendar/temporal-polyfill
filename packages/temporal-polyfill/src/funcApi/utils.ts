import { DateFields, EraYearFields } from '../internal/calendarFields'
import { createNativeDayOfYearOps, createNativeDaysInMonthOps, createNativeDaysInYearOps, createNativeInLeapYearOps, createNativeMonthsInYearOps, createNativePartOps } from '../internal/calendarNativeQuery'
import { computeDateFields } from '../internal/calendarNative'
import { DateSlots } from '../internal/slots'

export function getDateFields(slots: DateSlots<string>): DateFields & Partial<EraYearFields> {
  const calendarOp = createNativePartOps(slots.calendar)
  return computeDateFields(calendarOp, slots)
}

export function getInLeapYear(slots: DateSlots<string>): boolean {
  const calendarOps = createNativeInLeapYearOps(slots.calendar)
  return calendarOps.inLeapYear(slots)
}

export function getMonthsInYear(slots: DateSlots<string>): number {
  const calendarOps = createNativeMonthsInYearOps(slots.calendar)
  return calendarOps.monthsInYear(slots)
}

export function getDaysInMonth(slots: DateSlots<string>): number {
  const calendarOps = createNativeDaysInMonthOps(slots.calendar)
  return calendarOps.daysInMonth(slots)
}

export function getDaysInYear(slots: DateSlots<string>): number {
  const calendarOps = createNativeDaysInYearOps(slots.calendar)
  return calendarOps.daysInYear(slots)
}

export function getDayOfYear(slots: DateSlots<string>): number {
  const calendarOps = createNativeDayOfYearOps(slots.calendar)
  return calendarOps.dayOfYear(slots)
}
