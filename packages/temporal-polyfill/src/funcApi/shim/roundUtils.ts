import type { RoundingMathOptions, RoundingMode } from 'temporal-utils'
import { divideBigNanoToExactNumber } from '../../internal/bigNano'
import {
  computeCalendarDateFields,
  computeCalendarIsoFieldsFromParts,
} from '../../internal/calendarDerived'
import { type CalendarImpl } from '../../internal/calendarImpl'
import {
  isoDateTimeToEpochNano,
  isoDateToEpochNano,
} from '../../internal/epochMath'
import { timeFieldDefaults, timeFieldNamesAsc } from '../../internal/fieldNames'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  TimeFields,
} from '../../internal/fieldTypes'
import { combineDateAndTime } from '../../internal/fieldUtils'
import { computeIsoDayOfWeek } from '../../internal/isoCalendarMath'
import { addCalendarMonths, moveByDays } from '../../internal/move'
import {
  coerceRoundingIncInteger,
  coerceRoundingMode,
} from '../../internal/optionsCoerce'
import {
  RoundingMathTuple,
  RoundingModeEnum,
} from '../../internal/optionsModel'
import { refineUnitDiffOptions } from '../../internal/optionsRoundingRefine'
import { validateRoundingInc } from '../../internal/optionsValidate'
import {
  IsoDateTimeInterval,
  roundBigNanoToInc,
  roundNumberToInc,
  roundWithMode,
} from '../../internal/round'
import { computeEpochNanoFrac } from '../../internal/total'
import { TimeUnit, Unit } from '../../internal/units'
import { bindArgs, zeroOutProps } from '../../internal/utils'
import { normalizeRoundToOptions } from '../roundToUtils'

const clearTimeFields = bindArgs(
  zeroOutProps,
  timeFieldNamesAsc,
) as unknown as (unit: TimeUnit, timeFields: TimeFields) => TimeFields

// Floor
// -----------------------------------------------------------------------------

export function computeYearFloor(
  calendar: CalendarImpl,
  slots: CalendarDateFields,
): CalendarDateTimeFields & { year: number } {
  const { year: year0 } = computeCalendarDateFields(calendar, slots)
  return {
    ...computeCalendarDateTimeFromParts(calendar, year0),
    year: year0,
  }
}

export function computeMonthFloor(
  calendar: CalendarImpl,
  slots: CalendarDateFields,
): CalendarDateTimeFields & { year: number; month: number } {
  const { year: year0, month: month0 } = computeCalendarDateFields(
    calendar,
    slots,
  )
  return {
    ...computeCalendarDateTimeFromParts(calendar, year0, month0),
    year: year0,
    month: month0,
  }
}

export function computeIsoWeekFloor(
  _calendar: CalendarImpl,
  slots: CalendarDateFields,
): CalendarDateTimeFields {
  const dayOfWeek = computeIsoDayOfWeek(slots)
  return combineDateAndTime(moveByDays(slots, 1 - dayOfWeek), timeFieldDefaults)
}

export const computeHourFloor = bindArgs(clearTimeFields, Unit.Hour)
export const computeMinuteFloor = bindArgs(clearTimeFields, Unit.Minute)
export const computeSecFloor = bindArgs(clearTimeFields, Unit.Second)
export const computeMilliFloor = bindArgs(clearTimeFields, Unit.Millisecond)
export const computeMicroFloor = bindArgs(clearTimeFields, Unit.Microsecond)

// Ceil
// -----------------------------------------------------------------------------

export function computeYearCeil(
  calendar: CalendarImpl,
  slots: CalendarDateFields,
): CalendarDateTimeFields {
  return computeYearInterval(calendar, slots)[1]
}

export function computeMonthCeil(
  calendar: CalendarImpl,
  slots: CalendarDateFields,
): CalendarDateTimeFields {
  return computeMonthInterval(calendar, slots)[1]
}

export function computeIsoWeekCeil(
  calendar: CalendarImpl,
  slots: CalendarDateFields,
): CalendarDateTimeFields {
  return combineDateAndTime(
    moveByDays(computeIsoWeekFloor(calendar, slots), 7),
    timeFieldDefaults,
  )
}

export function computeDayCeil(
  _calendar: CalendarImpl,
  slots: CalendarDateFields,
): CalendarDateTimeFields {
  return combineDateAndTime(moveByDays(slots, 1), timeFieldDefaults)
}

// Interval
// -----------------------------------------------------------------------------

export function computeYearInterval(
  calendar: CalendarImpl,
  slots: CalendarDateFields,
): IsoDateTimeInterval {
  const isoFields0 = computeYearFloor(calendar, slots)
  const year1 = isoFields0.year + 1
  return [isoFields0, computeCalendarDateTimeFromParts(calendar, year1)]
}

export function computeMonthInterval(
  calendar: CalendarImpl,
  slots: CalendarDateFields,
): IsoDateTimeInterval {
  const isoFields0 = computeMonthFloor(calendar, slots)
  const { year: year1, month: month1 } = addCalendarMonths(
    calendar,
    isoFields0.year,
    isoFields0.month,
    1,
  )
  return [isoFields0, computeCalendarDateTimeFromParts(calendar, year1, month1)]
}

export function computeIsoWeekInterval(
  calendar: CalendarImpl,
  slots: CalendarDateFields,
): IsoDateTimeInterval {
  const isoFields0 = computeIsoWeekFloor(calendar, slots)
  const isoFields1 = combineDateAndTime(
    moveByDays(isoFields0, 7),
    timeFieldDefaults,
  )
  return [isoFields0, isoFields1]
}

export function roundDateToInterval<S extends CalendarDateFields>(
  computeInterval: (calendar: CalendarImpl, slots: S) => IsoDateTimeInterval,
  calendar: CalendarImpl,
  slots: S,
  roundingMode: RoundingModeEnum,
): CalendarDateTimeFields {
  return roundEpochNanoToInterval(
    computeInterval,
    calendar,
    slots,
    isoDateToEpochNano(slots),
    roundingMode,
  )
}

function computeCalendarDateTimeFromParts(
  calendar: CalendarImpl,
  year: number,
  month = 1,
): CalendarDateTimeFields {
  return combineDateAndTime(
    computeCalendarIsoFieldsFromParts(calendar, year, month, 1),
    timeFieldDefaults,
  )
}

export function roundDateTimeToInterval<S extends CalendarDateTimeFields>(
  computeInterval: (calendar: CalendarImpl, slots: S) => IsoDateTimeInterval,
  calendar: CalendarImpl,
  slots: S,
  roundingMode: RoundingModeEnum,
): CalendarDateTimeFields {
  return roundEpochNanoToInterval(
    computeInterval,
    calendar,
    slots,
    isoDateTimeToEpochNano(slots),
    roundingMode,
  )
}

function roundEpochNanoToInterval<S extends CalendarDateFields>(
  computeInterval: (calendar: CalendarImpl, slots: S) => IsoDateTimeInterval,
  calendar: CalendarImpl,
  slots: S,
  epochNano: bigint,
  roundingMode: RoundingModeEnum,
): CalendarDateTimeFields {
  const [isoFields0, isoFields1] = computeInterval(calendar, slots)
  const epochNano0 = isoDateTimeToEpochNano(isoFields0)
  const epochNano1 = isoDateTimeToEpochNano(isoFields1)
  const frac = computeEpochNanoFrac(epochNano, epochNano0, epochNano1)
  const grow = roundWithMode(frac, roundingMode)
  return grow ? isoFields1 : isoFields0
}

// Options
// -----------------------------------------------------------------------------

/*
Refines roundTo*-style args where smallestUnit is already known separately
(as a positional arg) and the options bag only carries roundingIncrement/
roundingMode. Avoids synthesizing a raw options object for re-parsing.
*/
export function refineRoundToOptions(
  smallestUnit: Unit,
  options?: RoundingMathOptions | RoundingMode,
  solarMode?: boolean, // Instant: increments validated against a full day
): RoundingMathTuple {
  options = normalizeRoundToOptions(options)

  // alphabetical
  let roundingInc = coerceRoundingIncInteger(options)
  const roundingMode = coerceRoundingMode(options, RoundingModeEnum.HalfExpand)

  roundingInc = validateRoundingInc(
    roundingInc,
    smallestUnit,
    undefined,
    solarMode,
  )
  return [roundingInc, roundingMode]
}

// Time Unit
// -----------------------------------------------------------------------------
// Called only by diffUtils.ts
// Unlike class API, this func API is able to return floating-point unit-numbers
// for the diff functions, thus the more involved math like divideBigNanoToExactNumber

// Callers compute the signed nanosecond amount. This number path handles the
// bounded time-of-day case where the amount fits safely in Number.
export function nanoToRoundedTimeUnit(
  unit: TimeUnit,
  nanoInUnit: number, // overengineered for caller to supply? SEE ABOVE COMMENT
  nanoAmount: number,
  options?: RoundingMathOptions | RoundingMode,
): number {
  const [roundingInc, roundingMode] = refineUnitDiffOptions(unit, options)

  if (roundingInc) {
    nanoAmount = roundNumberToInc(
      nanoAmount,
      nanoInUnit * roundingInc,
      roundingMode!,
    )
  }

  return nanoAmount / nanoInUnit
}

// Epoch-based amounts can be larger than Number's safe integer range, so they
// stay in bigint until rounding or exact fractional division needs a Number.
export function bigNanoToRoundedTimeUnit(
  unit: TimeUnit,
  nanoInUnit: number, // overengineered for caller to supply? SEE ABOVE COMMENT
  nanoAmount: bigint,
  options?: RoundingMathOptions | RoundingMode,
): number {
  const [roundingInc, roundingMode] = refineUnitDiffOptions(unit, options)

  if (roundingInc) {
    nanoAmount = roundBigNanoToInc(
      nanoAmount,
      // Like computeBigNanoInc, multiply after converting to bigint
      BigInt(nanoInUnit) * BigInt(roundingInc),
      roundingMode!,
    )
  }

  return roundingInc
    ? Number(nanoAmount / BigInt(nanoInUnit))
    : divideBigNanoToExactNumber(nanoAmount, nanoInUnit)
}
