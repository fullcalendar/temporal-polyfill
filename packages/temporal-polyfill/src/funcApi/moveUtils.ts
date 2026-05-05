import {
  computeCalendarDateFields,
  computeCalendarDayOfYear,
  computeCalendarDaysInMonth,
  computeCalendarDaysInYear,
} from '../internal/calendarDerived'
import { toInteger, toStrictInteger } from '../internal/cast'
import * as errorMessages from '../internal/errorMessages'
import type { InternalCalendar } from '../internal/externalCalendar'
import {
  dayFieldName,
  dayOfMonthName,
  dayOfWeekFieldName,
  weekOfYearFieldName,
} from '../internal/fieldNames'
import { CalendarDateFields } from '../internal/fieldTypes'
import { computeIsoDayOfWeek, computeIsoWeekFields } from '../internal/isoMath'
import {
  addDateMonths,
  moveByDays,
  moveToDayOfMonthUnsafe,
} from '../internal/move'
import { refineOverflowOptions } from '../internal/optionsFieldRefine'
import { OverflowOptions } from '../internal/optionsModel'
import { epochMilliToIsoDateTime } from '../internal/timeMath'
import { clampEntity } from '../internal/utils'

export function reversedMove<S>(
  f: (slots: S, units: number, options?: OverflowOptions) => S,
): (slots: S, units: number, options?: OverflowOptions) => S {
  return (slots, units, options?: OverflowOptions) => {
    return f(slots, -units, options)
  }
}

// Move-by-Unit
// -----------------------------------------------------------------------------
// These functions validate input

export function moveByYears(
  calendar: InternalCalendar,
  isoDate: CalendarDateFields,
  years: number,
  options?: OverflowOptions,
): CalendarDateFields {
  const overflow = refineOverflowOptions(options)
  if (!years) {
    return isoDate
  }
  return epochMilliToIsoDateTime(
    addDateMonths(calendar, isoDate, toStrictInteger(years), 0, overflow),
  )
}

export function moveByMonths(
  calendar: InternalCalendar,
  isoDate: CalendarDateFields,
  months: number,
  options?: OverflowOptions,
): CalendarDateFields {
  const overflow = refineOverflowOptions(options)
  if (!months) {
    return isoDate
  }
  return epochMilliToIsoDateTime(
    addDateMonths(calendar, isoDate, 0, toStrictInteger(months), overflow),
  )
}

export function moveByIsoWeeks(
  _calendar: InternalCalendar,
  isoDate: CalendarDateFields,
  weeks: number,
): CalendarDateFields {
  return moveByDays(isoDate, toStrictInteger(weeks) * 7)
}

export function moveByDaysStrict(
  _calendar: InternalCalendar,
  isoDate: CalendarDateFields,
  weeks: number,
): CalendarDateFields {
  return moveByDays(isoDate, toStrictInteger(weeks))
}

// Day-of-Unit / Week
// -----------------------------------------------------------------------------

export function moveToDayOfYear(
  calendar: InternalCalendar,
  isoDate: CalendarDateFields,
  dayOfYear: number,
  options?: OverflowOptions,
): CalendarDateFields {
  const overflow = refineOverflowOptions(options)
  const daysInYear = computeCalendarDaysInYear(calendar, isoDate)
  const normDayOfYear = clampEntity(
    dayOfMonthName,
    toInteger(dayOfYear, dayOfMonthName),
    1,
    daysInYear,
    overflow,
  )

  const currentDayOfYear = computeCalendarDayOfYear(calendar, isoDate)
  return moveByDays(isoDate, normDayOfYear - currentDayOfYear)
}

export function moveToDayOfMonth(
  calendar: InternalCalendar,
  isoDate: CalendarDateFields,
  day: number,
  options?: OverflowOptions,
): CalendarDateFields {
  const overflow = refineOverflowOptions(options)
  const daysInMonth = computeCalendarDaysInMonth(calendar, isoDate)
  const normDayOfMonth = clampEntity(
    dayFieldName,
    toInteger(day, dayFieldName),
    1,
    daysInMonth,
    overflow,
  )

  return moveToDayOfMonthUnsafe(
    (isoDate) => computeCalendarDateFields(calendar, isoDate).day,
    isoDate,
    normDayOfMonth,
  )
}

export function moveToDayOfWeek(
  _calendar: InternalCalendar,
  isoDate: CalendarDateFields,
  dayOfWeek: number,
  options?: OverflowOptions,
): CalendarDateFields {
  const overflow = refineOverflowOptions(options)
  const normDayOfWeek = clampEntity(
    dayOfWeekFieldName,
    toInteger(dayOfWeek, dayOfWeekFieldName),
    1,
    7,
    overflow,
  )
  return moveByDays(isoDate, normDayOfWeek - computeIsoDayOfWeek(isoDate))
}

// TODO: fix weird "slots" name
export function slotsWithWeekOfYear(
  calendar: InternalCalendar,
  isoDate: CalendarDateFields,
  weekOfYear: number,
  options?: OverflowOptions,
): CalendarDateFields {
  const overflow = refineOverflowOptions(options)
  // Week-numbered years are only supported for ISO. The internal calendar
  // discriminant uses undefined for ISO, so no string calendar ID is needed.
  const weekFields = calendar === undefined ? computeIsoWeekFields(isoDate) : {}
  const currentWeekOfYear = weekFields.weekOfYear
  const weeksInYear = weekFields.weeksInYear

  if (currentWeekOfYear === undefined) {
    throw new RangeError(errorMessages.unsupportedWeekNumbers)
  }

  const normWeekOfYear = clampEntity(
    weekOfYearFieldName,
    toInteger(weekOfYear, weekOfYearFieldName),
    1,
    weeksInYear!,
    overflow,
  )

  return moveByIsoWeeks(calendar, isoDate, normWeekOfYear - currentWeekOfYear)
}
