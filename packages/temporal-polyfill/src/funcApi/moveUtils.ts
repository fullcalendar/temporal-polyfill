import {
  queryCalendarDay,
  queryCalendarDayOfYear,
  queryCalendarDaysInMonth,
  queryCalendarDaysInYear,
  queryCalendarWeekFields,
} from '../internal/calendarQuery'
import { toInteger, toStrictInteger } from '../internal/cast'
import * as errorMessages from '../internal/errorMessages'
import {
  dayFieldName,
  dayOfMonthName,
  dayOfWeekFieldName,
  weekOfYearFieldName,
} from '../internal/fieldNames'
import { CalendarDateFields } from '../internal/fieldTypes'
import { computeIsoDayOfWeek } from '../internal/isoMath'
import {
  addCalendarDateMonths,
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
  calendarId: string,
  isoDate: CalendarDateFields,
  years: number,
  options?: OverflowOptions,
): CalendarDateFields {
  const overflow = refineOverflowOptions(options)
  if (!years) {
    return isoDate
  }
  return epochMilliToIsoDateTime(
    addCalendarDateMonths(
      calendarId,
      isoDate,
      toStrictInteger(years),
      0,
      overflow,
    ),
  )
}

export function moveByMonths(
  calendarId: string,
  isoDate: CalendarDateFields,
  months: number,
  options?: OverflowOptions,
): CalendarDateFields {
  const overflow = refineOverflowOptions(options)
  if (!months) {
    return isoDate
  }
  return epochMilliToIsoDateTime(
    addCalendarDateMonths(
      calendarId,
      isoDate,
      0,
      toStrictInteger(months),
      overflow,
    ),
  )
}

export function moveByIsoWeeks(
  _calendar: string,
  isoDate: CalendarDateFields,
  weeks: number,
): CalendarDateFields {
  return moveByDays(isoDate, toStrictInteger(weeks) * 7)
}

export function moveByDaysStrict(
  _calendar: string,
  isoDate: CalendarDateFields,
  weeks: number,
): CalendarDateFields {
  return moveByDays(isoDate, toStrictInteger(weeks))
}

// Day-of-Unit / Week
// -----------------------------------------------------------------------------

export function moveToDayOfYear(
  calendarId: string,
  isoDate: CalendarDateFields,
  dayOfYear: number,
  options?: OverflowOptions,
): CalendarDateFields {
  const overflow = refineOverflowOptions(options)
  const daysInYear = queryCalendarDaysInYear(calendarId, isoDate)
  const normDayOfYear = clampEntity(
    dayOfMonthName,
    toInteger(dayOfYear, dayOfMonthName),
    1,
    daysInYear,
    overflow,
  )

  const currentDayOfYear = queryCalendarDayOfYear(calendarId, isoDate)
  return moveByDays(isoDate, normDayOfYear - currentDayOfYear)
}

export function moveToDayOfMonth(
  calendarId: string,
  isoDate: CalendarDateFields,
  day: number,
  options?: OverflowOptions,
): CalendarDateFields {
  const overflow = refineOverflowOptions(options)
  const daysInMonth = queryCalendarDaysInMonth(calendarId, isoDate)
  const normDayOfMonth = clampEntity(
    dayFieldName,
    toInteger(day, dayFieldName),
    1,
    daysInMonth,
    overflow,
  )

  return moveToDayOfMonthUnsafe(
    (isoDate) => queryCalendarDay(calendarId, isoDate),
    isoDate,
    normDayOfMonth,
  )
}

export function moveToDayOfWeek(
  _calendar: string,
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
  calendarId: string,
  isoDate: CalendarDateFields,
  weekOfYear: number,
  options?: OverflowOptions,
): CalendarDateFields {
  const overflow = refineOverflowOptions(options)
  const { weekOfYear: currentWeekOfYear, weeksInYear } =
    queryCalendarWeekFields(calendarId, isoDate)

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

  return moveByIsoWeeks(calendarId, isoDate, normWeekOfYear - currentWeekOfYear)
}
