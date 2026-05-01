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
import { IsoDateCarrier } from '../internal/isoFields'
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

export function moveByYears<S extends AbstractDateSlots>(
  slots: S,
  years: number,
  options?: OverflowOptions,
): S {
  const overflow = refineOverflowOptions(options)
  if (!years) {
    return slots
  }
  const { isoDate } = epochMilliToIso(
    addCalendarDateMonths(
      slots.calendar,
      slots.isoDate,
      toStrictInteger(years),
      0,
      overflow,
    ),
  )
  return { ...slots, isoDate }
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
  const { isoDate } = epochMilliToIso(
    addCalendarDateMonths(
      slots.calendar,
      slots.isoDate,
      0,
      toStrictInteger(months),
      overflow,
    ),
  )
  return { ...slots, isoDate }
}

export function moveByIsoWeeks<F extends IsoDateCarrier>(
  slots: F,
  weeks: number,
): F {
  return {
    ...slots,
    isoDate: moveByDays(slots.isoDate, toStrictInteger(weeks) * 7),
  }
}

export function moveByDaysStrict<F extends IsoDateCarrier>(
  slots: F,
  weeks: number,
): F {
  return {
    ...slots,
    isoDate: moveByDays(slots.isoDate, toStrictInteger(weeks)),
  }
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
  const { isoDate } = slots
  const daysInYear = queryCalendarDaysInYear(calendar, isoDate)
  const normDayOfYear = clampEntity(
    dayOfMonthName,
    toInteger(dayOfYear, dayOfMonthName),
    1,
    daysInYear,
    overflow,
  )

  const currentDayOfYear = queryCalendarDayOfYear(calendar, isoDate)
  return {
    ...slots,
    isoDate: moveByDays(isoDate, normDayOfYear - currentDayOfYear),
  }
}

export function moveToDayOfMonth<S extends AbstractDateSlots>(
  slots: S,
  day: number,
  options?: OverflowOptions,
): S {
  const overflow = refineOverflowOptions(options)
  const { calendar } = slots
  const { isoDate } = slots
  const daysInMonth = queryCalendarDaysInMonth(calendar, isoDate)
  const normDayOfMonth = clampEntity(
    dayFieldName,
    toInteger(day, dayFieldName),
    1,
    daysInMonth,
    overflow,
  )

  return {
    ...slots,
    isoDate: moveToDayOfMonthUnsafe(
      (isoDate) => queryCalendarDay(calendar, isoDate),
      isoDate,
      normDayOfMonth,
    ),
  }
}

export function moveToDayOfWeek<S extends IsoDateCarrier>(
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
  const { isoDate } = slots
  return {
    ...slots,
    isoDate: moveByDays(isoDate, normDayOfWeek - computeIsoDayOfWeek(isoDate)),
  }
}

export function slotsWithWeekOfYear<S extends AbstractDateSlots>(
  slots: S,
  weekOfYear: number,
  options?: OverflowOptions,
): S {
  const overflow = refineOverflowOptions(options)
  const { isoDate } = slots
  const { weekOfYear: currentWeekOfYear, weeksInYear } =
    queryCalendarWeekFields(slots.calendar, isoDate)

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
