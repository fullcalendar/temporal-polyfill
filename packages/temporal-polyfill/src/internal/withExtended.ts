/*
WIP. Ultimately for funcApi
*/
import {
  createNativeDayOfYearOps,
  createNativeDaysInMonthOps,
  createNativeDaysInYearOps,
  createNativeWeekOps,
  createNativeYearMonthParseOps,
} from './calendarNativeQuery'
import * as errorMessages from './errorMessages'
import { IsoDateFields } from './isoFields'
import { computeIsoDayOfWeek } from './isoMath'
import { moveByDays, moveToDayOfMonthUnsafe } from './move'
import { moveByIsoWeeks } from './moveExtended'
import { OverflowOptions, refineOverflowOptions } from './optionsRefine'
import { DateSlots } from './slots'
import { clampEntity } from './utils'

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
