import {
  queryNativeDay,
  queryNativeDayOfYear,
  queryNativeDaysInMonth,
  queryNativeDaysInYear,
  queryNativeWeekParts,
  queryNativeYearMonthAdd,
} from '../internal/calendarNativeQuery'
import { toInteger, toStrictInteger } from '../internal/cast'
import * as errorMessages from '../internal/errorMessages'
import { IsoDateFields, isoDateFieldNamesAlpha } from '../internal/isoFields'
import { computeIsoDayOfWeek } from '../internal/isoMath'
import { moveByDays, moveToDayOfMonthUnsafe } from '../internal/move'
import {
  OverflowOptions,
  refineOverflowOptions,
} from '../internal/optionsRefine'
import { DateSlots } from '../internal/slots'
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

export function moveByYears<S extends DateSlots>(
  slots: S,
  years: number,
  options?: OverflowOptions,
): S {
  const overflow = refineOverflowOptions(options)
  if (!years) {
    return slots
  }
  const isoFields = epochMilliToIso(
    queryNativeYearMonthAdd(
      slots.calendar,
      slots,
      toStrictInteger(years),
      0,
      overflow,
    ),
  )
  const isoDateFields = pluckProps(isoDateFieldNamesAlpha, isoFields)
  return { ...slots, ...isoDateFields }
}

export function moveByMonths<S extends DateSlots>(
  slots: S,
  months: number,
  options?: OverflowOptions,
): S {
  const overflow = refineOverflowOptions(options)
  if (!months) {
    return slots
  }
  const isoFields = epochMilliToIso(
    queryNativeYearMonthAdd(
      slots.calendar,
      slots,
      0,
      toStrictInteger(months),
      overflow,
    ),
  )
  const isoDateFields = pluckProps(isoDateFieldNamesAlpha, isoFields)
  return { ...slots, ...isoDateFields }
}

export function moveByIsoWeeks<F extends IsoDateFields>(
  slots: F,
  weeks: number,
): F {
  return moveByDays(slots, toStrictInteger(weeks) * 7)
}

export function moveByDaysStrict<F extends IsoDateFields>(
  slots: F,
  weeks: number,
): F {
  return moveByDays(slots, toStrictInteger(weeks))
}

// Day-of-Unit / Week
// -----------------------------------------------------------------------------

const dayOfMonthLabel = 'dayOfMonth'
const dayLabel = 'day'
const dayOfWeekLabel = 'dayOfWeek'
const weekOfYearLabel = 'weekOfYear'

export function moveToDayOfYear<S extends DateSlots>(
  slots: S,
  dayOfYear: number,
  options?: OverflowOptions,
): S {
  const overflow = refineOverflowOptions(options)
  const { calendar } = slots
  const daysInYear = queryNativeDaysInYear(calendar, slots)
  const normDayOfYear = clampEntity(
    dayOfMonthLabel,
    toInteger(dayOfYear, dayOfMonthLabel),
    1,
    daysInYear,
    overflow,
  )

  const currentDayOfYear = queryNativeDayOfYear(calendar, slots)
  return moveByDays(slots, normDayOfYear - currentDayOfYear)
}

export function moveToDayOfMonth<S extends DateSlots>(
  slots: S,
  day: number,
  options?: OverflowOptions,
): S {
  const overflow = refineOverflowOptions(options)
  const { calendar } = slots
  const daysInMonth = queryNativeDaysInMonth(calendar, slots)
  const normDayOfMonth = clampEntity(
    dayLabel,
    toInteger(day, dayLabel),
    1,
    daysInMonth,
    overflow,
  )

  return moveToDayOfMonthUnsafe(
    (isoFields) => queryNativeDay(calendar, isoFields),
    slots,
    normDayOfMonth,
  )
}

export function moveToDayOfWeek<S extends IsoDateFields>(
  slots: S,
  dayOfWeek: number,
  options?: OverflowOptions,
): S {
  const overflow = refineOverflowOptions(options)
  const normDayOfWeek = clampEntity(
    dayOfWeekLabel,
    toInteger(dayOfWeek, dayOfWeekLabel),
    1,
    7,
    overflow,
  )
  return moveByDays(slots, normDayOfWeek - computeIsoDayOfWeek(slots))
}

export function slotsWithWeekOfYear<S extends DateSlots>(
  slots: S,
  weekOfYear: number,
  options?: OverflowOptions,
): S {
  const overflow = refineOverflowOptions(options)
  const [currentWeekOfYear, , weeksInYear] = queryNativeWeekParts(
    slots.calendar,
    slots,
  )

  if (currentWeekOfYear === undefined) {
    throw new RangeError(errorMessages.unsupportedWeekNumbers)
  }

  const normWeekOfYear = clampEntity(
    weekOfYearLabel,
    toInteger(weekOfYear, weekOfYearLabel),
    1,
    weeksInYear!,
    overflow,
  )

  return moveByIsoWeeks(slots, normWeekOfYear - currentWeekOfYear)
}
