import { Overflow } from '../options/model'
import {
  computeCalendarDateFields,
  computeCalendarDayOfYear,
  computeCalendarDaysInMonth,
  computeCalendarDaysInYear,
} from './calendarDerived'
import { type CalendarImpl, isoCalendarImpl } from './calendarImpl'
import * as errorMessages from './errorMessages'
import { CalendarDateFields } from './fieldTypes'
import { computeIsoDayOfWeek, computeIsoWeekFields } from './isoCalendarMath'
import { moveDateByDays } from './move'
import { clampEntity, throwRangeError } from './utils'

// An ordinal is a 1-based coordinate within a containing period: day of the
// year, day of the month, day of the week, or week of the year. These functions
// move a date so one ordinal equals a requested value, honoring overflow;
// move.ts instead adds offsets. Day-of-week and week-of-year are ISO notions
// (week-of-year throws for non-ISO calendars), while day-of-year and
// day-of-month consult the calendar.

// "Refined" marks the boundary with apiHelpers: the ordinal is already an
// integer and overflow is already parsed. Dates remain ISO fields, while
// calendar queries determine the legal ordinals and movement distances.
export function moveToRefinedDayOfYear(
  calendar: CalendarImpl,
  isoDate: CalendarDateFields,
  dayOfYear: number,
  overflow: Overflow,
): CalendarDateFields {
  const daysInYear = computeCalendarDaysInYear(calendar, isoDate)
  const normDayOfYear = clampEntity(
    'dayOfMonth',
    dayOfYear,
    1,
    daysInYear,
    overflow,
  )
  const currentDayOfYear = computeCalendarDayOfYear(calendar, isoDate)
  return moveDateByDays(isoDate, normDayOfYear - currentDayOfYear)
}

export function moveToRefinedDayOfMonth(
  calendar: CalendarImpl,
  isoDate: CalendarDateFields,
  day: number,
  overflow: Overflow,
): CalendarDateFields {
  const daysInMonth = computeCalendarDaysInMonth(calendar, isoDate)
  const normDayOfMonth = clampEntity('day', day, 1, daysInMonth, overflow)
  const currentDayOfMonth = computeCalendarDateFields(calendar, isoDate).day
  return moveDateByDays(isoDate, normDayOfMonth - currentDayOfMonth)
}

// Day-of-week is an ISO notion, so no calendar is consulted.
export function moveToRefinedDayOfWeek(
  isoDate: CalendarDateFields,
  dayOfWeek: number,
  overflow: Overflow,
): CalendarDateFields {
  const normDayOfWeek = clampEntity('dayOfWeek', dayOfWeek, 1, 7, overflow)
  return moveDateByDays(isoDate, normDayOfWeek - computeIsoDayOfWeek(isoDate))
}

export function moveToRefinedWeekOfYear(
  calendar: CalendarImpl,
  isoDate: CalendarDateFields,
  weekOfYear: number,
  overflow: Overflow,
): CalendarDateFields {
  if (calendar !== isoCalendarImpl) {
    throwRangeError(errorMessages.unsupportedWeekNumbers)
  }

  const { weekOfYear: currentWeekOfYear, weeksInYear } =
    computeIsoWeekFields(isoDate)
  const normWeekOfYear = clampEntity(
    'weekOfYear',
    weekOfYear,
    1,
    weeksInYear,
    overflow,
  )

  return moveDateByDays(isoDate, (normWeekOfYear - currentWeekOfYear) * 7)
}
