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
import { moveByDays } from './move'
import { Overflow } from './optionsModel'
import { clampEntity, throwRangeError } from './utils'

// A position is a requested coordinate within a calendar period, such as a day
// of the month or week of the year. These set coordinates; move.ts adds offsets.

// Inputs are coerced positions and parsed overflow. Dates remain ISO fields,
// while calendar queries determine the legal positions and movement distances.
export function computeDayOfYearMove(
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
  return moveByDays(isoDate, normDayOfYear - currentDayOfYear)
}

export function computeDayOfMonthMove(
  calendar: CalendarImpl,
  isoDate: CalendarDateFields,
  day: number,
  overflow: Overflow,
): CalendarDateFields {
  const daysInMonth = computeCalendarDaysInMonth(calendar, isoDate)
  const normDayOfMonth = clampEntity('day', day, 1, daysInMonth, overflow)
  const currentDayOfMonth = computeCalendarDateFields(calendar, isoDate).day
  return moveByDays(isoDate, normDayOfMonth - currentDayOfMonth)
}

export function computeDayOfWeekMove(
  _calendar: CalendarImpl,
  isoDate: CalendarDateFields,
  dayOfWeek: number,
  overflow: Overflow,
): CalendarDateFields {
  const normDayOfWeek = clampEntity('dayOfWeek', dayOfWeek, 1, 7, overflow)
  return moveByDays(isoDate, normDayOfWeek - computeIsoDayOfWeek(isoDate))
}

export function computeWeekOfYearMove(
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

  return moveByDays(isoDate, (normWeekOfYear - currentWeekOfYear) * 7)
}
