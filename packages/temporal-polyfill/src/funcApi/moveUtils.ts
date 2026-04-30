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
  calendarDateFieldNamesAlpha,
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
import { AbstractDateSlots } from '../internal/slots'
import { epochMilliToIso } from '../internal/timeMath'
import { clampEntity, pluckProps } from '../internal/utils'

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

export function moveByYears<S extends AbstractDateSlots>(
  slots: S,
  years: number,
  options?: OverflowOptions,
): S {
  const overflow = refineOverflowOptions(options)
  if (!years) {
    return slots
  }
  const isoFields = epochMilliToIso(
    addCalendarDateMonths(
      slots.calendar,
      slots,
      toStrictInteger(years),
      0,
      overflow,
    ),
  )
  const isoDateFields = pluckProps(calendarDateFieldNamesAlpha, isoFields)
  return { ...slots, ...isoDateFields }
}

export function moveByMonths<S extends AbstractDateSlots>(
  slots: S,
  months: number,
  options?: OverflowOptions,
): S {
  const overflow = refineOverflowOptions(options)
  if (!months) {
    return slots
  }
  const isoFields = epochMilliToIso(
    addCalendarDateMonths(
      slots.calendar,
      slots,
      0,
      toStrictInteger(months),
      overflow,
    ),
  )
  const isoDateFields = pluckProps(calendarDateFieldNamesAlpha, isoFields)
  return { ...slots, ...isoDateFields }
}

export function moveByIsoWeeks<F extends CalendarDateFields>(
  slots: F,
  weeks: number,
): F {
  return moveByDays(slots, toStrictInteger(weeks) * 7)
}

export function moveByDaysStrict<F extends CalendarDateFields>(
  slots: F,
  weeks: number,
): F {
  return moveByDays(slots, toStrictInteger(weeks))
}

// Day-of-Unit / Week
// -----------------------------------------------------------------------------

export function moveToDayOfYear<S extends AbstractDateSlots>(
  slots: S,
  dayOfYear: number,
  options?: OverflowOptions,
): S {
  const overflow = refineOverflowOptions(options)
  const { calendar } = slots
  const daysInYear = queryCalendarDaysInYear(calendar, slots)
  const normDayOfYear = clampEntity(
    dayOfMonthName,
    toInteger(dayOfYear, dayOfMonthName),
    1,
    daysInYear,
    overflow,
  )

  const currentDayOfYear = queryCalendarDayOfYear(calendar, slots)
  return moveByDays(slots, normDayOfYear - currentDayOfYear)
}

export function moveToDayOfMonth<S extends AbstractDateSlots>(
  slots: S,
  day: number,
  options?: OverflowOptions,
): S {
  const overflow = refineOverflowOptions(options)
  const { calendar } = slots
  const daysInMonth = queryCalendarDaysInMonth(calendar, slots)
  const normDayOfMonth = clampEntity(
    dayFieldName,
    toInteger(day, dayFieldName),
    1,
    daysInMonth,
    overflow,
  )

  return moveToDayOfMonthUnsafe(
    (isoFields) => queryCalendarDay(calendar, isoFields),
    slots,
    normDayOfMonth,
  )
}

export function moveToDayOfWeek<S extends CalendarDateFields>(
  slots: S,
  dayOfWeek: number,
  options?: OverflowOptions,
): S {
  const overflow = refineOverflowOptions(options)
  const normDayOfWeek = clampEntity(
    dayOfWeekFieldName,
    toInteger(dayOfWeek, dayOfWeekFieldName),
    1,
    7,
    overflow,
  )
  return moveByDays(slots, normDayOfWeek - computeIsoDayOfWeek(slots))
}

export function slotsWithWeekOfYear<S extends AbstractDateSlots>(
  slots: S,
  weekOfYear: number,
  options?: OverflowOptions,
): S {
  const overflow = refineOverflowOptions(options)
  const { weekOfYear: currentWeekOfYear, weeksInYear } =
    queryCalendarWeekFields(slots.calendar, slots)

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

  return moveByIsoWeeks(slots, normWeekOfYear - currentWeekOfYear)
}
