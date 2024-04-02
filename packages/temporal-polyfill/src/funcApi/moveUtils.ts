import {
  createNativeDayOfYearOps,
  createNativeDayOps,
  createNativeDaysInMonthOps,
  createNativeDaysInYearOps,
  createNativeMoveOps,
  createNativeWeekOps,
} from '../internal/calendarNativeQuery'
import { toInteger, toStrictInteger } from '../internal/cast'
import * as errorMessages from '../internal/errorMessages'
import { IsoDateFields, isoDateFieldNamesAlpha } from '../internal/isoFields'
import { computeIsoDayOfWeek } from '../internal/isoMath'
import {
  moveByDays,
  moveToDayOfMonthUnsafe,
  nativeYearMonthAdd,
} from '../internal/move'
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

export function moveByYears<S extends DateSlots<string>>(
  slots: S,
  years: number,
  options?: OverflowOptions,
): S {
  const overflow = refineOverflowOptions(options)
  if (!years) {
    return slots
  }
  const calendarOps = createNativeMoveOps(slots.calendar)
  const isoFields = epochMilliToIso(
    nativeYearMonthAdd(calendarOps, slots, toStrictInteger(years), 0, overflow),
  )
  const isoDateFields = pluckProps(isoDateFieldNamesAlpha, isoFields)
  return { ...slots, ...isoDateFields }
}

export function moveByMonths<S extends DateSlots<string>>(
  slots: S,
  months: number,
  options?: OverflowOptions,
): S {
  const overflow = refineOverflowOptions(options)
  if (!months) {
    return slots
  }
  const calendarOps = createNativeMoveOps(slots.calendar)
  const isoFields = epochMilliToIso(
    nativeYearMonthAdd(
      calendarOps,
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

export function moveToDayOfYear<S extends DateSlots<string>>(
  slots: S,
  dayOfYear: number,
  options?: OverflowOptions,
): S {
  const overflow = refineOverflowOptions(options)
  const { calendar } = slots
  const daysInYear = createNativeDaysInYearOps(calendar).daysInYear(slots)
  const normDayOfYear = clampEntity(
    dayOfMonthLabel,
    toInteger(dayOfYear, dayOfMonthLabel),
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
  options?: OverflowOptions,
): S {
  const overflow = refineOverflowOptions(options)
  const { calendar } = slots
  const daysInMonth = createNativeDaysInMonthOps(calendar).daysInMonth(slots)
  const normDayOfMonth = clampEntity(
    dayLabel,
    toInteger(day, dayLabel),
    1,
    daysInMonth,
    overflow,
  )

  return moveToDayOfMonthUnsafe(
    createNativeDayOps(calendar),
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

export function slotsWithWeekOfYear<S extends DateSlots<string>>(
  slots: S,
  weekOfYear: number,
  options?: OverflowOptions,
): S {
  const overflow = refineOverflowOptions(options)
  const calendarOps = createNativeWeekOps(slots.calendar)
  const [currentWeekOfYear, , weeksInYear] = calendarOps.weekParts(slots)

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
