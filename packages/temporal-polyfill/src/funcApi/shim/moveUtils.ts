import type { Temporal } from 'temporal-spec'
import {
  computeCalendarDateFields,
  computeCalendarDayOfYear,
  computeCalendarDaysInMonth,
  computeCalendarDaysInYear,
} from '../../internal/calendarDerived'
import { type CalendarSlot, isoCalendar } from '../../internal/calendarSlot'
import { toIntegerWithTruncation, toStrictInteger } from '../../internal/cast'
import { epochMilliToIsoDateTime } from '../../internal/epochMath'
import * as errorMessages from '../../internal/errorMessages'
import {
  dayFieldName,
  dayOfMonthName,
  dayOfWeekFieldName,
  weekOfYearFieldName,
} from '../../internal/fieldNames'
import { CalendarDateFields } from '../../internal/fieldTypes'
import {
  computeIsoDayOfWeek,
  computeIsoWeekFields,
} from '../../internal/isoCalendarMath'
import {
  addDateMonths,
  moveByDays,
  moveToDayOfMonthUnsafe,
} from '../../internal/move'
import { refineOverflowOptions } from '../../internal/optionsFieldRefine'
import { clampEntity } from '../../internal/utils'

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
  isoDate: CalendarDateFields & { calendar: CalendarSlot },
  years: number,
  options?: Temporal.OverflowOptions,
): CalendarDateFields & { calendar: CalendarSlot } {
  const { calendar } = isoDate
  const overflow = refineOverflowOptions(options)
  if (!years) {
    return isoDate
  }
  return {
    ...epochMilliToIsoDateTime(
      addDateMonths(calendar, isoDate, toStrictInteger(years), 0, overflow),
    ),
    calendar,
  }
}

export function moveByMonths(
  isoDate: CalendarDateFields & { calendar: CalendarSlot },
  months: number,
  options?: Temporal.OverflowOptions,
): CalendarDateFields & { calendar: CalendarSlot } {
  const { calendar } = isoDate
  const overflow = refineOverflowOptions(options)
  if (!months) {
    return isoDate
  }
  return {
    ...epochMilliToIsoDateTime(
      addDateMonths(calendar, isoDate, 0, toStrictInteger(months), overflow),
    ),
    calendar,
  }
}

export function moveByIsoWeeks(
  isoDate: CalendarDateFields,
  weeks: number,
): CalendarDateFields {
  return moveByDays(isoDate, toStrictInteger(weeks) * 7)
}

export function moveByDaysStrict(
  isoDate: CalendarDateFields,
  days: number,
): CalendarDateFields {
  return moveByDays(isoDate, toStrictInteger(days))
}

// Day-of-Unit / Week
// -----------------------------------------------------------------------------

export function moveToDayOfYear(
  isoDate: CalendarDateFields & { calendar: CalendarSlot },
  dayOfYear: number,
  options?: Temporal.OverflowOptions,
): CalendarDateFields & { calendar: CalendarSlot } {
  const { calendar } = isoDate
  const overflow = refineOverflowOptions(options)
  const daysInYear = computeCalendarDaysInYear(calendar, isoDate)
  const normDayOfYear = clampEntity(
    dayOfMonthName,
    toIntegerWithTruncation(dayOfYear, dayOfMonthName),
    1,
    daysInYear,
    overflow,
  )

  const currentDayOfYear = computeCalendarDayOfYear(calendar, isoDate)
  return {
    ...moveByDays(isoDate, normDayOfYear - currentDayOfYear),
    calendar,
  }
}

export function moveToDayOfMonth(
  isoDate: CalendarDateFields & { calendar: CalendarSlot },
  day: number,
  options?: Temporal.OverflowOptions,
): CalendarDateFields & { calendar: CalendarSlot } {
  const { calendar } = isoDate
  const overflow = refineOverflowOptions(options)
  const daysInMonth = computeCalendarDaysInMonth(calendar, isoDate)
  const normDayOfMonth = clampEntity(
    dayFieldName,
    toIntegerWithTruncation(day, dayFieldName),
    1,
    daysInMonth,
    overflow,
  )

  return {
    ...moveToDayOfMonthUnsafe(
      (dateFields) => computeCalendarDateFields(calendar, dateFields).day,
      isoDate,
      normDayOfMonth,
    ),
    calendar,
  }
}

export function moveToDayOfWeek(
  isoDate: CalendarDateFields,
  dayOfWeek: number,
  options?: Temporal.OverflowOptions,
): CalendarDateFields {
  const overflow = refineOverflowOptions(options)
  const normDayOfWeek = clampEntity(
    dayOfWeekFieldName,
    toIntegerWithTruncation(dayOfWeek, dayOfWeekFieldName),
    1,
    7,
    overflow,
  )
  return moveByDays(isoDate, normDayOfWeek - computeIsoDayOfWeek(isoDate))
}

export function moveToWeekOfYear(
  isoDate: CalendarDateFields & { calendar: CalendarSlot },
  weekOfYear: number,
  options?: Temporal.OverflowOptions,
): CalendarDateFields & { calendar: CalendarSlot } {
  const overflow = refineOverflowOptions(options)
  const weekFields =
    isoDate.calendar === isoCalendar ? computeIsoWeekFields(isoDate) : {}
  const currentWeekOfYear = weekFields.weekOfYear
  const weeksInYear = weekFields.weeksInYear

  if (currentWeekOfYear === undefined) {
    throw new RangeError(errorMessages.unsupportedWeekNumbers)
  }

  const normWeekOfYear = clampEntity(
    weekOfYearFieldName,
    toIntegerWithTruncation(weekOfYear, weekOfYearFieldName),
    1,
    weeksInYear!,
    overflow,
  )

  return {
    ...moveByIsoWeeks(isoDate, normWeekOfYear - currentWeekOfYear),
    calendar: isoDate.calendar,
  }
}
