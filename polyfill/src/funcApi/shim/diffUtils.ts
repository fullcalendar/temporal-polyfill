import type { RoundingMathOptions, RoundingMode } from 'temporal-utils'
import { divideBigNanoToExactNumber } from '../../internal/bigNano'
import { type CalendarImpl } from '../../internal/calendarImpl'
import { diffCalendarDates, prepareZonedEpochDiff } from '../../internal/diff'
import {
  isoDateTimeToEpochNano,
  isoDateToEpochNano,
} from '../../internal/epochMath'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  TimeFields,
} from '../../internal/fieldTypes'
import { combineDateAndTime } from '../../internal/fieldUtils'
import { refineUnitDiffOptions } from '../../internal/optionsRoundingRefine'
import {
  RelativeOps,
  ZonedEpochMarker,
  createDateRelativeOps,
  createDateTimeRelativeOps,
  createZonedRelativeOps,
} from '../../internal/relativeMath'
import { roundNumberToInc } from '../../internal/round'
import { getCommonCalendar, getCommonTimeZone } from '../../internal/slotUtils'
import { ZonedEpochNanoFields, getEpochNano } from '../../internal/slots'
import { timeFieldsToNano } from '../../internal/timeFieldMath'
import { totalRelativeDuration } from '../../internal/total'
import { TimeUnit, Unit, nanoInUtcDay } from '../../internal/units'
import { NumberSign, bindArgs, compareBigInts } from '../../internal/utils'
import { bigNanoToRoundedTimeUnit, nanoToRoundedTimeUnit } from './roundUtils'

export const diffZonedYears = bindArgs(diffZonedLargeUnits, Unit.Year)
export const diffZonedMonths = bindArgs(diffZonedLargeUnits, Unit.Month)
export const diffZonedWeeks = bindArgs(diffZonedDayLikeUnits, Unit.Week, 7)
export const diffZonedDays = bindArgs(diffZonedDayLikeUnits, Unit.Day, 1)
export const diffZonedEpochNanoTimeUnit = bindArgs(
  diffEpochNanoTimeUnit,
  getEpochNano as MarkerToEpochNano,
)
export const diffInstantEpochNanoTimeUnit = bindArgs(
  diffEpochNanoTimeUnit,
  getEpochNano as MarkerToEpochNano,
)

export const diffPlainYears = bindArgs(diffPlainDateLargeUnits, Unit.Year)
export const diffPlainMonths = bindArgs(diffPlainDateLargeUnits, Unit.Month)
export const diffPlainDateTimeYears = bindArgs(
  diffPlainDateTimeLargeUnits,
  Unit.Year,
)
export const diffPlainDateTimeMonths = bindArgs(
  diffPlainDateTimeLargeUnits,
  Unit.Month,
)
export const diffPlainWeeks = bindArgs(
  diffPlainDayLikeUnit,
  isoDateTimeToEpochNano as MarkerToEpochNano,
  Unit.Week,
  7,
)
export const diffPlainDays = bindArgs(
  diffPlainDayLikeUnit,
  isoDateTimeToEpochNano as MarkerToEpochNano,
  Unit.Day,
  1,
)
export const diffPlainDateTimeEpochNanoTimeUnit = bindArgs(
  diffEpochNanoTimeUnit,
  isoDateTimeToEpochNano as MarkerToEpochNano,
)

export function adaptRecordTimeUnitDiff<Record, Slots>(
  diffSlots: (
    unit: TimeUnit,
    nanoInUnit: number,
    slots0: Slots,
    slots1: Slots,
    options?: RoundingMathOptions | RoundingMode,
  ) => number,
  getSlots: (record: Record) => Slots,
): (
  unit: TimeUnit,
  nanoInUnit: number,
  record0: Record,
  record1: Record,
  options?: RoundingMathOptions | RoundingMode,
) => number {
  return (unit, nanoInUnit, record0, record1, options) =>
    diffSlots(unit, nanoInUnit, getSlots(record0), getSlots(record1), options)
}

// Large Units (years, months)
// -----------------------------------------------------------------------------

function diffZonedLargeUnits(
  unit: Unit,
  record0: ZonedEpochNanoFields & { calendar: CalendarImpl },
  record1: ZonedEpochNanoFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode,
): number {
  const timeZone = getCommonTimeZone(record0.timeZone, record1.timeZone)
  const calendar = getCommonCalendar(record0.calendar, record1.calendar)

  return diffDateUnits(
    getEpochNano as MarkerToEpochNano,
    bindArgs(prepareZonedEpochDiff, timeZone) as unknown as MarkersToIsoFields,
    createZonedRelativeOps(calendar, timeZone, record0),
    unit,
    record0,
    record1,
    options,
  )
}

function diffPlainDateLargeUnits(
  unit: Unit,
  record0: CalendarDateFields & { calendar: CalendarImpl },
  record1: CalendarDateFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode,
): number {
  const calendar = getCommonCalendar(record0.calendar, record1.calendar)

  return diffDateUnits(
    isoDateToEpochNano as MarkerToEpochNano,
    identityMarkersToIsoFields as MarkersToIsoFields,
    createDateRelativeOps(calendar, record0),
    unit,
    record0,
    record1,
    options,
  )
}

function diffPlainDateTimeLargeUnits(
  unit: Unit,
  record0: CalendarDateTimeFields & { calendar: CalendarImpl },
  record1: CalendarDateTimeFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode,
): number {
  const calendar = getCommonCalendar(record0.calendar, record1.calendar)

  return diffDateUnits(
    isoDateTimeToEpochNano as MarkerToEpochNano,
    identityMarkersToIsoFields as MarkersToIsoFields,
    createDateTimeRelativeOps(calendar, record0),
    unit,
    record0,
    record1,
    options,
  )
}

// Date Units (years, months, weeks, days)
// -----------------------------------------------------------------------------

/*
The pair of records being diffed. Unlike the rounding core's origin, which is
always an ISO date-time, these keep their original shape so each unit-diff
function can convert them the cheapest way.
*/
type DiffMarker = CalendarDateFields | CalendarDateTimeFields | ZonedEpochMarker

type MarkerToEpochNano<M = DiffMarker> = (marker: M) => bigint

type MarkersToIsoFields = (
  m0: DiffMarker,
  m1: DiffMarker,
  sign: NumberSign,
) => [CalendarDateFields, CalendarDateFields, ...any[]]

function identityMarkersToIsoFields(
  m0: CalendarDateFields,
  m1: CalendarDateFields,
): [CalendarDateFields, CalendarDateFields] {
  return [m0, m1]
}

function diffDateUnits(
  markerToEpochNano: MarkerToEpochNano,
  markersToIsoFields: MarkersToIsoFields,
  relativeOps: RelativeOps,
  unit: Unit, // guaranteed Y/M/W
  marker0: DiffMarker,
  marker1: DiffMarker,
  options: RoundingMathOptions | RoundingMode | undefined,
): number {
  const [roundingInc, roundingMode] = refineUnitDiffOptions(unit, options)
  const startEpochNano = markerToEpochNano(marker0)
  const endEpochNano = markerToEpochNano(marker1)

  const sign = compareBigInts(endEpochNano, startEpochNano)
  if (!sign) {
    return 0
  }

  const [isoFields0, isoFields1] = markersToIsoFields(marker0, marker1, sign)

  // Always the same calendar the ops were built with, so read it from there
  // rather than having each caller pass a closure that repeats it.
  const durationFields = diffCalendarDates(
    relativeOps.calendar,
    isoFields0,
    isoFields1,
    unit,
  )

  let res = totalRelativeDuration(
    durationFields,
    endEpochNano,
    unit,
    relativeOps,
  )

  if (roundingInc) {
    res = roundNumberToInc(res, roundingInc, roundingMode!)
  }

  return res
}

// Day-Like Units (weeks, days)
// -----------------------------------------------------------------------------

function diffZonedDayLikeUnits(
  unit: Unit.Week | Unit.Day,
  daysInUnit: number,
  record0: ZonedEpochNanoFields & { calendar: CalendarImpl },
  record1: ZonedEpochNanoFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode | undefined,
): number {
  const [roundingInc, roundingMode] = refineUnitDiffOptions(unit, options)

  const timeZone = getCommonTimeZone(record0.timeZone, record1.timeZone)

  const sign = compareBigInts(
    record1.epochNanoseconds,
    record0.epochNanoseconds,
  )
  const [isoFields0, isoFields1, remainderNano] = prepareZonedEpochDiff(
    timeZone,
    record0,
    record1,
    sign,
  )!
  // `isoFields0` is the start date-time, so it supplies the original wall-clock
  // time for the adjusted end date. The start side already has that time.
  const nanoDiff =
    isoDateTimeToEpochNano(combineDateAndTime(isoFields1, isoFields0)) -
    isoDateTimeToEpochNano(isoFields0) +
    BigInt(remainderNano)

  let res = divideBigNanoToExactNumber(nanoDiff, nanoInUtcDay) / daysInUnit

  if (roundingInc) {
    res = roundNumberToInc(res, roundingInc, roundingMode!)
  }

  return res
}

function diffPlainDayLikeUnit(
  markerToEpochNano: MarkerToEpochNano,
  unit: Unit.Week | Unit.Day,
  daysInUnit: number,
  record0: DiffMarker,
  record1: DiffMarker,
  options?: RoundingMathOptions | RoundingMode,
): number {
  const [roundingInc, roundingMode] = refineUnitDiffOptions(unit, options)
  const nanoDiff = markerToEpochNano(record1) - markerToEpochNano(record0)

  let res = divideBigNanoToExactNumber(nanoDiff, nanoInUtcDay) / daysInUnit

  if (roundingInc) {
    res = roundNumberToInc(res, roundingInc, roundingMode!)
  }

  return res
}

// Time Units
// -----------------------------------------------------------------------------

function diffEpochNanoTimeUnit<M>(
  markerToEpochNano: MarkerToEpochNano<M>,
  unit: TimeUnit,
  nanoInUnit: number,
  record0: M,
  record1: M,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return bigNanoToRoundedTimeUnit(
    unit,
    nanoInUnit,
    markerToEpochNano(record1) - markerToEpochNano(record0),
    options,
  )
}

// PlainTime diffing is intentionally a within-day nano-of-day calculation,
// rather than an epoch-nanosecond calculation through an implicit date.
export function diffPlainTimeNanoOfDayTimeUnit(
  unit: TimeUnit,
  nanoInUnit: number,
  slots0: TimeFields,
  slots1: TimeFields,
  options?: RoundingMathOptions | RoundingMode,
): number {
  return nanoToRoundedTimeUnit(
    unit,
    nanoInUnit,
    timeFieldsToNano(slots1) - timeFieldsToNano(slots0),
    options,
  )
}
