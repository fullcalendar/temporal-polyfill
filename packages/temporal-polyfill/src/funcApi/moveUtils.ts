import {
  computeCalendarDateFields,
  computeCalendarDayOfYear,
  computeCalendarDaysInMonth,
  computeCalendarDaysInYear,
} from '../internal/calendarDerived'
import { toInteger, toStrictInteger } from '../internal/cast'
import * as errorMessages from '../internal/errorMessages'
import { isoCalendar } from '../internal/externalCalendar'
import {
  dayFieldName,
  dayOfMonthName,
  dayOfWeekFieldName,
  weekOfYearFieldName,
} from '../internal/fieldNames'
import { CalendarDateFields } from '../internal/fieldTypes'
import { computeIsoDayOfWeek, computeIsoWeekFields } from '../internal/isoMath'
import { slotsWithCalendar } from '../internal/modify'
import {
  addDateMonths,
  moveByDays,
  moveToDayOfMonthUnsafe,
} from '../internal/move'
import { refineOverflowOptions } from '../internal/optionsFieldRefine'
import { OverflowOptions } from '../internal/optionsModel'
import { AbstractDateSlots } from '../internal/slots'
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
// Month/year movement is calendar-aware. ISO day/week movement is not, so those
// helpers deliberately return plain ISO date fields and let callers reattach
// their calendar only when building record/slot outputs.

export function moveByYears(
  isoDate: AbstractDateSlots,
  years: number,
  options?: OverflowOptions,
): AbstractDateSlots {
  const { calendar } = isoDate
  const overflow = refineOverflowOptions(options)
  if (!years) {
    return isoDate
  }
  return slotsWithCalendar(
    epochMilliToIsoDateTime(
      addDateMonths(calendar, isoDate, toStrictInteger(years), 0, overflow),
    ),
    calendar,
  )
}

export function moveByMonths(
  isoDate: AbstractDateSlots,
  months: number,
  options?: OverflowOptions,
): AbstractDateSlots {
  const { calendar } = isoDate
  const overflow = refineOverflowOptions(options)
  if (!months) {
    return isoDate
  }
  return slotsWithCalendar(
    epochMilliToIsoDateTime(
      addDateMonths(calendar, isoDate, 0, toStrictInteger(months), overflow),
    ),
    calendar,
  )
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
  isoDate: AbstractDateSlots,
  dayOfYear: number,
  options?: OverflowOptions,
): AbstractDateSlots {
  const { calendar } = isoDate
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
  return slotsWithCalendar(
    moveByDays(isoDate, normDayOfYear - currentDayOfYear),
    calendar,
  )
}

export function moveToDayOfMonth(
  isoDate: AbstractDateSlots,
  day: number,
  options?: OverflowOptions,
): AbstractDateSlots {
  const { calendar } = isoDate
  const overflow = refineOverflowOptions(options)
  const daysInMonth = computeCalendarDaysInMonth(calendar, isoDate)
  const normDayOfMonth = clampEntity(
    dayFieldName,
    toInteger(day, dayFieldName),
    1,
    daysInMonth,
    overflow,
  )

  return slotsWithCalendar(
    moveToDayOfMonthUnsafe(
      (dateFields) => computeCalendarDateFields(calendar, dateFields).day,
      isoDate,
      normDayOfMonth,
    ),
    calendar,
  )
}

export function moveToDayOfWeek(
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

export function moveToWeekOfYear(
  isoDate: AbstractDateSlots,
  weekOfYear: number,
  options?: OverflowOptions,
): AbstractDateSlots {
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
    toInteger(weekOfYear, weekOfYearFieldName),
    1,
    weeksInYear!,
    overflow,
  )

  return slotsWithCalendar(
    moveByIsoWeeks(isoDate, normWeekOfYear - currentWeekOfYear),
    isoDate.calendar,
  )
}
