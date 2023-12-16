import { computeIsoDayOfWeek, computeIsoDaysInWeek, computeIsoWeekOfYear, computeIsoYearOfWeek } from '../internal/isoMath'
import { IsoDateFields } from '../internal/calendarIsoFields'
import { DateFields, EraYearFields } from '../internal/calendarFields'
import { createNativeDayOfYearOps, createNativeDaysInMonthOps, createNativeDaysInYearOps, createNativeInLeapYearOps, createNativeMonthsInYearOps, createNativePartOps } from '../internal/calendarNativeQuery'
import { computeDateFields } from '../internal/calendarNative'

// this file is stupid

type Thing = IsoDateFields & { calendar: string }

// -------------------------------------------------------------------------------------------------
// these functions that merely forward can be used directly by callers. no need for these utilities

export function dayOfWeek(slots: Thing): number {
  return computeIsoDayOfWeek(slots)
}

export function daysInWeek(slots: Thing): number {
  return computeIsoDaysInWeek(slots)
}

export function weekOfYear(slots: Thing): number {
  return computeIsoWeekOfYear(slots)
}

export function yearOfWeek(slots: Thing): number {
  return computeIsoYearOfWeek(slots)
}

// -------------------------------------------------------------------------------------------------

export function getDateFields(slots: Thing): DateFields & Partial<EraYearFields> {
  const calendarOp = createNativePartOps(slots.calendar)
  return computeDateFields(calendarOp, slots)
}

// -------------------------------------------------------------------------------------------------

export function inLeapYear(slots: Thing): boolean {
  const calendarOps = createNativeInLeapYearOps(slots.calendar)
  return calendarOps.inLeapYear(slots)
}

export function monthsInYear(slots: Thing): number {
  const calendarOps = createNativeMonthsInYearOps(slots.calendar)
  return calendarOps.monthsInYear(slots)
}

export function daysInMonth(slots: Thing): number {
  const calendarOps = createNativeDaysInMonthOps(slots.calendar)
  return calendarOps.daysInMonth(slots)
}

export function daysInYear(slots: Thing): number {
  const calendarOps = createNativeDaysInYearOps(slots.calendar)
  return calendarOps.daysInYear(slots)
}

export function dayOfYear(slots: Thing): number {
  const calendarOps = createNativeDayOfYearOps(slots.calendar)
  return calendarOps.dayOfYear(slots)
}
