import type { Temporal } from 'temporal-spec'
import {
  computeCalendarDateFields,
  computeCalendarDayOfYear,
  computeCalendarDaysInMonth,
  computeCalendarDaysInYear,
} from '../../internal/calendarDerived'
import { type CalendarImpl, isoCalendarImpl } from '../../internal/calendarImpl'
import { toIntegerWithTruncation, toStrictInteger } from '../../internal/cast'
import * as errorMessages from '../../internal/errorMessages'
import { CalendarDateFields } from '../../internal/fieldTypes'
import {
  computeIsoDayOfWeek,
  computeIsoWeekFields,
} from '../../internal/isoCalendarMath'
import { addDateMonths, moveByDays } from '../../internal/move'
import { refineOverflowOptions } from '../../internal/optionsFieldRefine'
import { clampEntity, throwRangeError } from '../../internal/utils'

export function reversedMove<S>(
  f: (slots: S, units: number, options?: Temporal.OverflowOptions) => S,
): (slots: S, units: number, options?: Temporal.OverflowOptions) => S {
  return (slots, units, options?: Temporal.OverflowOptions) => {
    return f(slots, -units, options)
  }
}

// Move-by-Unit
// -----------------------------------------------------------------------------
// These functions validate input
// Month/year movement is calendar-aware. ISO day/week movement is not, so those
// helpers deliberately return plain ISO date fields and let callers reattach
// their calendar only when building record/slot outputs.

export function moveByYears(
  calendar: CalendarImpl,
  isoDate: CalendarDateFields,
  years: number,
  options?: Temporal.OverflowOptions,
): CalendarDateFields {
  const overflow = refineOverflowOptions(options)
  if (!years) {
    return isoDate
  }
  return addDateMonths(calendar, isoDate, toStrictInteger(years), 0, overflow)
}

export function moveByMonths(
  calendar: CalendarImpl,
  isoDate: CalendarDateFields,
  months: number,
  options?: Temporal.OverflowOptions,
): CalendarDateFields {
  const overflow = refineOverflowOptions(options)
  if (!months) {
    return isoDate
  }
  return addDateMonths(calendar, isoDate, 0, toStrictInteger(months), overflow)
}

export function moveByIsoWeeks(
  _calendar: CalendarImpl,
  isoDate: CalendarDateFields,
  weeks: number,
): CalendarDateFields {
  return moveByDays(isoDate, toStrictInteger(weeks) * 7)
}

export function moveByDaysStrict(
  _calendar: CalendarImpl,
  isoDate: CalendarDateFields,
  days: number,
): CalendarDateFields {
  return moveByDays(isoDate, toStrictInteger(days))
}

// Day-of-Unit / Week
// -----------------------------------------------------------------------------

export function moveToDayOfYear(
  calendar: CalendarImpl,
  isoDate: CalendarDateFields,
  dayOfYear: number,
  options?: Temporal.OverflowOptions,
): CalendarDateFields {
  const overflow = refineOverflowOptions(options)
  const daysInYear = computeCalendarDaysInYear(calendar, isoDate)
  const normDayOfYear = clampEntity(
    'dayOfMonth',
    toIntegerWithTruncation(dayOfYear, 'dayOfMonth'),
    1,
    daysInYear,
    overflow,
  )

  const currentDayOfYear = computeCalendarDayOfYear(calendar, isoDate)
  return moveByDays(isoDate, normDayOfYear - currentDayOfYear)
}

export function moveToDayOfMonth(
  calendar: CalendarImpl,
  isoDate: CalendarDateFields,
  day: number,
  options?: Temporal.OverflowOptions,
): CalendarDateFields {
  const overflow = refineOverflowOptions(options)
  const daysInMonth = computeCalendarDaysInMonth(calendar, isoDate)
  const normDayOfMonth = clampEntity(
    'day',
    toIntegerWithTruncation(day, 'day'),
    1,
    daysInMonth,
    overflow,
  )

  const currentDayOfMonth = computeCalendarDateFields(calendar, isoDate).day
  return moveByDays(isoDate, normDayOfMonth - currentDayOfMonth)
}

export function moveToDayOfWeek(
  _calendar: CalendarImpl,
  isoDate: CalendarDateFields,
  dayOfWeek: number,
  options?: Temporal.OverflowOptions,
): CalendarDateFields {
  const overflow = refineOverflowOptions(options)
  const normDayOfWeek = clampEntity(
    'dayOfWeek',
    toIntegerWithTruncation(dayOfWeek, 'dayOfWeek'),
    1,
    7,
    overflow,
  )
  return moveByDays(isoDate, normDayOfWeek - computeIsoDayOfWeek(isoDate))
}

export function moveToWeekOfYear(
  calendar: CalendarImpl,
  isoDate: CalendarDateFields,
  weekOfYear: number,
  options?: Temporal.OverflowOptions,
): CalendarDateFields {
  const overflow = refineOverflowOptions(options)
  const weekFields =
    calendar === isoCalendarImpl ? computeIsoWeekFields(isoDate) : {}
  const currentWeekOfYear = weekFields.weekOfYear
  const weeksInYear = weekFields.weeksInYear

  if (currentWeekOfYear === undefined) {
    throwRangeError(errorMessages.unsupportedWeekNumbers)
  }

  const normWeekOfYear = clampEntity(
    'weekOfYear',
    toIntegerWithTruncation(weekOfYear, 'weekOfYear'),
    1,
    weeksInYear!,
    overflow,
  )

  return moveByIsoWeeks(calendar, isoDate, normWeekOfYear - currentWeekOfYear)
}
