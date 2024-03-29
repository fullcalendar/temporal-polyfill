import { createNativeConvertOps } from '../internal/calendarNativeQuery'
import {
  createNativeDayOfYearOps,
  createNativeDaysInMonthOps,
  createNativeDaysInYearOps,
  createNativeWeekOps,
  createNativeYearMonthParseOps,
} from '../internal/calendarNativeQuery'
import * as errorMessages from '../internal/errorMessages'
import { IsoDateFields } from '../internal/isoFields'
import { computeIsoDayOfWeek } from '../internal/isoMath'
import { moveByDays, moveToDayOfMonthUnsafe } from '../internal/move'
import {
  OverflowOptions,
  refineOverflowOptions,
} from '../internal/optionsRefine'
import { DateSlots } from '../internal/slots'
import { epochMilliToIso } from '../internal/timeMath'
import { clampEntity } from '../internal/utils'

export function reversedMove<S>(
  f: (slots: S, units: number) => S,
): (slots: S, units: number) => S {
  return (slots, units) => {
    return f(slots, -units)
  }
}

// Move-by-Unit
// -----------------------------------------------------------------------------

export function moveByYears<S extends DateSlots<string>>(
  slots: S,
  years: number,
): S {
  const calendarOps = createNativeConvertOps(slots.calendar)
  const [year0] = calendarOps.dateParts(slots)
  const year1 = year0 + years
  return {
    ...slots,
    ...epochMilliToIso(calendarOps.epochMilli(year1)),
  }
}

export function moveByMonths<S extends DateSlots<string>>(
  slots: S,
  months: number,
): S {
  const calendarOps = createNativeConvertOps(slots.calendar)
  const [year0, month0] = calendarOps.dateParts(slots)
  const [year1, month1] = calendarOps.monthAdd(year0, month0, months)
  return {
    ...slots,
    ...epochMilliToIso(calendarOps.epochMilli(year1, month1)),
  }
}

export function moveByIsoWeeks<F extends IsoDateFields>(
  slots: F,
  weeks: number,
): F {
  return moveByDays(slots, weeks * 7)
}

// Day-of-Unit / Week
// -----------------------------------------------------------------------------

export function moveToDayOfYear<S extends DateSlots<string>>(
  slots: S,
  dayOfYear: number,
  options: OverflowOptions | undefined,
): S {
  const overflow = refineOverflowOptions(options)
  const { calendar } = slots
  const daysInYear = createNativeDaysInYearOps(calendar).daysInYear(slots)
  const normDayOfYear = clampEntity(
    'dayOfMonth',
    dayOfYear,
    1,
    daysInYear,
    overflow,
  )

  const currentDayOfYear = createNativeDayOfYearOps(calendar).dayOfYear(slots)
  return moveByDays(slots, normDayOfYear - currentDayOfYear)
}

export function moveToDayOfMonth<S extends DateSlots<string>>(
  slots: S,
  day: number,
  options: OverflowOptions | undefined,
): S {
  const overflow = refineOverflowOptions(options)
  const { calendar } = slots
  const daysInMonth = createNativeDaysInMonthOps(calendar).daysInMonth(slots)
  const normDayOfMonth = clampEntity('day', day, 1, daysInMonth, overflow)

  return moveToDayOfMonthUnsafe(
    createNativeYearMonthParseOps(calendar),
    slots,
    normDayOfMonth,
  )
}

export function moveToDayOfWeek<S extends IsoDateFields>(
  slots: S,
  dayOfWeek: number,
  options: OverflowOptions | undefined,
): S {
  const overflow = refineOverflowOptions(options)
  const normDayOfWeek = clampEntity('dayOfWeek', dayOfWeek, 1, 7, overflow)
  return moveByDays(slots, normDayOfWeek - computeIsoDayOfWeek(slots))
}

export function slotsWithWeekOfYear<S extends DateSlots<string>>(
  slots: S,
  weekOfYear: number,
  options: OverflowOptions | undefined,
): S {
  const overflow = refineOverflowOptions(options)
  const calendarOps = createNativeWeekOps(slots.calendar)
  const [currentWeekOfYear, , weeksInYear] = calendarOps.weekParts(slots)

  if (currentWeekOfYear === undefined) {
    throw new RangeError(errorMessages.unsupportedWeekNumbers)
  }

  const normWeekOfYear = clampEntity(
    'weekOfYear',
    weekOfYear,
    1,
    weeksInYear!,
    overflow,
  )

  return moveByIsoWeeks(slots, normWeekOfYear - currentWeekOfYear)
}
