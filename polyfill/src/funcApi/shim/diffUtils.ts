import type { RoundingMathOptions, RoundingMode } from 'temporal-utils'
import { divideBigNanoToExactNumber } from '../../internal/bigNano'
import { type CalendarImpl } from '../../internal/calendarImpl'
import {
  diffCalendarDates,
  diffDateTimesExact,
  prepareZonedEpochDiff,
} from '../../internal/diff'
import {
  DurationFields,
  clearDurationFields,
  durationFieldNamesAsc,
} from '../../internal/durationFields'
import {
  computeDurationSign,
  nanoToDurationTimeFields,
} from '../../internal/durationMath'
import {
  epochNanoToIsoDateTime,
  isoDateTimeToEpochNano,
  isoDateToEpochNano,
} from '../../internal/epochMath'
import { timeFieldDefaults } from '../../internal/fieldNames'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  TimeFields,
} from '../../internal/fieldTypes'
import { combineDateAndTime } from '../../internal/fieldUtils'
import { moveByDays } from '../../internal/move'
import { type RoundingModeEnum } from '../../internal/optionsModel'
import { refineUnitDiffOptions } from '../../internal/optionsRoundingRefine'
import {
  RelativeOps,
  createDateRelativeOps,
  createDateTimeRelativeOps,
  createZonedRelativeOps,
  moveRelativeToEpochNano,
} from '../../internal/relativeMath'
import { roundNumberToInc } from '../../internal/round'
import { getCommonCalendar, getCommonTimeZone } from '../../internal/slotUtils'
import { ZonedEpochNanoFields, getEpochNano } from '../../internal/slots'
import {
  checkIsoDateInBounds,
  checkIsoDateTimeInBounds,
} from '../../internal/temporalLimits'
import { timeFieldsToNano } from '../../internal/timeFieldMath'
import { type TimeZone } from '../../internal/timeZone'
import { getSingleInstantFor } from '../../internal/timeZoneMath'
import {
  clampRelativeDuration,
  computeEpochNanoFrac,
  totalRelativeDuration,
} from '../../internal/total'
import { TimeUnit, Unit, nanoInUtcDay } from '../../internal/units'
import { bindArgs, compareBigInts, divTrunc } from '../../internal/utils'
import { bigNanoToRoundedTimeUnit, nanoToRoundedTimeUnit } from './roundUtils'

export const diffZonedYears = bindArgs(diffZonedLargeUnit, Unit.Year)
export const diffZonedMonths = bindArgs(diffZonedLargeUnit, Unit.Month)
export const diffZonedWeeks = bindArgs(diffZonedDayLikeUnit, Unit.Week, 7)
export const diffZonedDays = bindArgs(diffZonedDayLikeUnit, Unit.Day, 1)
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

// Zoned Large Units (years, months)
// -----------------------------------------------------------------------------

function diffZonedLargeUnit(
  unit: Unit,
  record0: ZonedEpochNanoFields & { calendar: CalendarImpl },
  record1: ZonedEpochNanoFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode,
): number {
  const [roundingInc, roundingMode, defaultRoundingInc] = refineUnitDiffOptions(
    unit,
    options,
    Unit.Nanosecond,
  )
  const calendar = getCommonCalendar(record0.calendar, record1.calendar)
  const rawEndEpochNano = record1.epochNanoseconds
  const sign = compareBigInts(rawEndEpochNano, record0.epochNanoseconds)

  // DifferenceTemporalZonedDateTime returns before comparing time zones when
  // the instants are equal. Preserve that observable validation order here.
  if (!sign) {
    return 0
  }

  const timeZone = getCommonTimeZone(record0.timeZone, record1.timeZone)
  const endEpochNano = defaultRoundingInc
    ? truncateEpochNanoDiff(
        record0.epochNanoseconds,
        rawEndEpochNano,
        defaultRoundingInc,
      )
    : rawEndEpochNano
  const roundedSign = compareBigInts(endEpochNano, record0.epochNanoseconds)

  if (!roundedSign) {
    return 0
  }

  const [isoFields0, isoFields1, remainderNano] = prepareZonedEpochDiff(
    timeZone,
    record0,
    { ...record1, epochNanoseconds: endEpochNano },
    roundedSign,
  )!
  const durationFields = {
    ...diffCalendarDates(calendar, isoFields0, isoFields1, unit),
    ...nanoToDurationTimeFields(remainderNano),
  }

  return totalAndRoundZonedDateUnit(
    unit,
    record0,
    endEpochNano,
    calendar,
    timeZone,
    durationFields,
    roundingInc,
    roundingMode,
  )
}

// Plain Large Units (years, months)
// -----------------------------------------------------------------------------

function diffPlainDateLargeUnits(
  unit: Unit,
  record0: CalendarDateFields & { calendar: CalendarImpl },
  record1: CalendarDateFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode,
  skipSingleUnitRound = false,
  defaultSmallestUnit: Unit.Day | Unit.Month = Unit.Day,
): number {
  const calendar = getCommonCalendar(record0.calendar, record1.calendar)

  return diffDateUnits(
    isoDateToEpochNano as MarkerToEpochNano,
    createDateRelativeOps(calendar, record0),
    unit,
    record0,
    record1,
    options,
    skipSingleUnitRound,
    defaultSmallestUnit,
  )
}

export function diffPlainYearMonthMonths(
  record0: CalendarDateFields & { calendar: CalendarImpl },
  record1: CalendarDateFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode,
): number {
  return diffPlainDateLargeUnits(
    Unit.Month,
    record0,
    record1,
    options,
    true,
    Unit.Month,
  )
}

export function diffPlainYearMonthYears(
  record0: CalendarDateFields & { calendar: CalendarImpl },
  record1: CalendarDateFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode,
): number {
  return diffPlainDateLargeUnits(
    Unit.Year,
    record0,
    record1,
    options,
    false,
    Unit.Month,
  )
}

function diffPlainDateTimeLargeUnits(
  unit: Unit,
  record0: CalendarDateTimeFields & { calendar: CalendarImpl },
  record1: CalendarDateTimeFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode,
): number {
  const [roundingInc, roundingMode, defaultRoundingInc] = refineUnitDiffOptions(
    unit,
    options,
    Unit.Nanosecond,
  )
  const calendar = getCommonCalendar(record0.calendar, record1.calendar)
  const startEpochNano = isoDateTimeToEpochNano(record0)
  const rawEndEpochNano = isoDateTimeToEpochNano(record1)
  const endEpochNano = defaultRoundingInc
    ? truncateEpochNanoDiff(startEpochNano, rawEndEpochNano, defaultRoundingInc)
    : rawEndEpochNano
  const roundedRecord1 = defaultRoundingInc
    ? { ...epochNanoToIsoDateTime(endEpochNano), calendar: record1.calendar }
    : record1

  if (!roundingInc) {
    checkPlainRelativeToBounds(record0, record1)
  }

  if (endEpochNano === startEpochNano) {
    return 0
  }

  return totalAndRoundRelativeDateUnit(
    unit,
    diffDateTimesExact(calendar, record0, roundedRecord1, unit),
    endEpochNano,
    roundingInc,
    roundingMode,
    createDateTimeRelativeOps(calendar, record0),
  )
}

// Date Units (years, months, weeks, days)
// -----------------------------------------------------------------------------

/*
The pair of records being diffed. Unlike the rounding core's origin, which is
always an ISO date-time, these keep their original shape so each unit-diff
function can convert them the cheapest way.
*/
type DiffMarker = CalendarDateFields | CalendarDateTimeFields

type MarkerToEpochNano<M = DiffMarker | ZonedEpochNanoFields> = (
  marker: M,
) => bigint

function diffDateUnits(
  markerToEpochNano: MarkerToEpochNano,
  relativeOps: RelativeOps,
  unit: Unit, // guaranteed Y/M/W
  marker0: DiffMarker,
  marker1: DiffMarker,
  options: RoundingMathOptions | RoundingMode | undefined,
  skipSingleUnitRound = false,
  defaultSmallestUnit: Unit.Day | Unit.Month = Unit.Day,
): number {
  const [roundingInc, roundingMode, defaultRoundingInc] = refineUnitDiffOptions(
    unit,
    options,
    defaultSmallestUnit,
  )
  const startEpochNano = markerToEpochNano(marker0)
  let endEpochNano = markerToEpochNano(marker1)

  if (!roundingInc) {
    checkPlainRelativeToBounds(marker0, marker1)
  }

  const sign = compareBigInts(endEpochNano, startEpochNano)
  if (!sign) {
    return 0
  }

  // Always the same calendar the ops were built with, so read it from there
  // rather than having each caller pass a closure that repeats it.
  const durationFields = diffCalendarDates(
    relativeOps.calendar,
    marker0,
    marker1,
    unit,
  )

  if (defaultRoundingInc) {
    const defaultFieldName = durationFieldNamesAsc[defaultSmallestUnit]
    durationFields[defaultFieldName] =
      divTrunc(durationFields[defaultFieldName], defaultRoundingInc) *
      defaultRoundingInc
    endEpochNano = moveRelativeToEpochNano(relativeOps, durationFields)
  }

  if (roundingInc === 1 && skipSingleUnitRound) {
    return durationFields[durationFieldNamesAsc[unit]]
  }

  return totalAndRoundRelativeDateUnit(
    unit,
    durationFields,
    endEpochNano,
    roundingInc,
    roundingMode,
    relativeOps,
  )
}

// Zoned Day-Like Units (weeks, days)
// -----------------------------------------------------------------------------

function diffZonedDayLikeUnit(
  unit: Unit.Week | Unit.Day,
  daysInUnit: number,
  record0: ZonedEpochNanoFields & { calendar: CalendarImpl },
  record1: ZonedEpochNanoFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode,
): number {
  const [roundingInc, roundingMode, defaultRoundingInc] = refineUnitDiffOptions(
    unit,
    options,
    Unit.Nanosecond,
  )
  getCommonCalendar(record0.calendar, record1.calendar)
  const rawEndEpochNano = record1.epochNanoseconds
  const sign = compareBigInts(rawEndEpochNano, record0.epochNanoseconds)

  if (!sign) {
    return 0
  }

  const timeZone = getCommonTimeZone(record0.timeZone, record1.timeZone)
  const endEpochNano = defaultRoundingInc
    ? truncateEpochNanoDiff(
        record0.epochNanoseconds,
        rawEndEpochNano,
        defaultRoundingInc,
      )
    : rawEndEpochNano
  const roundedSign = compareBigInts(endEpochNano, record0.epochNanoseconds)

  if (!roundedSign) {
    return 0
  }

  const [isoFields0, isoFields1] = prepareZonedEpochDiff(
    timeZone,
    record0,
    { ...record1, epochNanoseconds: endEpochNano },
    roundedSign,
  )!
  const dayDiff = divideBigNanoToExactNumber(
    isoDateToEpochNano(isoFields1) - isoDateToEpochNano(isoFields0),
    nanoInUtcDay,
  )
  const unitDiff = Math.trunc(dayDiff / daysInUnit)
  return totalAndRoundZonedDayLikeUnit(
    daysInUnit,
    isoFields0,
    record0.epochNanoseconds,
    endEpochNano,
    timeZone,
    unitDiff,
    roundingInc,
    roundingMode,
  )
}

function totalAndRoundZonedDayLikeUnit(
  daysInUnit: number,
  originIsoFields: CalendarDateTimeFields,
  originEpochNano: bigint,
  endEpochNano: bigint,
  timeZone: TimeZone,
  unitDiff: number,
  roundingInc: number | undefined,
  roundingMode: RoundingModeEnum | undefined,
): number {
  const sign = compareBigInts(endEpochNano, originEpochNano) as -1 | 1
  const windowInc = roundingInc || 1
  let windowStartValue = roundingInc
    ? divTrunc(unitDiff, roundingInc) * roundingInc
    : unitDiff
  let [windowEpochNano0, windowEpochNano1] = computeZonedDayLikeWindow(
    daysInUnit,
    originIsoFields,
    originEpochNano,
    timeZone,
    windowStartValue,
    windowInc * sign,
  )

  // Usually the prepared whole-unit count already brackets the endpoint. If
  // a time-zone transition collapses that window, advance once just like the
  // general relative-duration clamp operation.
  if (
    !epochNanoIsWithinWindow(
      endEpochNano,
      windowEpochNano0,
      windowEpochNano1,
      sign,
    )
  ) {
    windowStartValue += windowInc * sign
    const shiftedWindow = computeZonedDayLikeWindow(
      daysInUnit,
      originIsoFields,
      originEpochNano,
      timeZone,
      windowStartValue,
      windowInc * sign,
    )
    windowEpochNano0 = shiftedWindow[0]
    windowEpochNano1 = shiftedWindow[1]
  }

  const fraction = roundingInc
    ? computeEpochNanoFrac(endEpochNano, windowEpochNano0, windowEpochNano1)
    : Number(endEpochNano - windowEpochNano0) /
      Number(windowEpochNano1 - windowEpochNano0)
  const exactValue = windowStartValue + fraction * sign * windowInc

  return roundingInc
    ? roundNumberToInc(exactValue, roundingInc, roundingMode!)
    : exactValue
}

function computeZonedDayLikeWindow(
  daysInUnit: number,
  originIsoFields: CalendarDateTimeFields,
  originEpochNano: bigint,
  timeZone: TimeZone,
  startValue: number,
  unitDelta: number,
): [bigint, bigint] {
  return [
    moveZonedDayLikeValue(
      daysInUnit,
      originIsoFields,
      originEpochNano,
      timeZone,
      startValue,
    ),
    moveZonedDayLikeValue(
      daysInUnit,
      originIsoFields,
      originEpochNano,
      timeZone,
      startValue + unitDelta,
    ),
  ]
}

function moveZonedDayLikeValue(
  daysInUnit: number,
  originIsoFields: CalendarDateTimeFields,
  originEpochNano: bigint,
  timeZone: TimeZone,
  value: number,
): bigint {
  if (!value) {
    return originEpochNano
  }

  return getSingleInstantFor(
    timeZone,
    combineDateAndTime(
      moveByDays(originIsoFields, value * daysInUnit),
      originIsoFields,
    ),
  )
}

function epochNanoIsWithinWindow(
  epochNano: bigint,
  epochNano0: bigint,
  epochNano1: bigint,
  sign: -1 | 1,
): boolean {
  return sign > 0
    ? epochNano0 <= epochNano && epochNano <= epochNano1
    : epochNano1 <= epochNano && epochNano <= epochNano0
}

function totalAndRoundZonedDateUnit(
  unit: Unit,
  record0: ZonedEpochNanoFields & { calendar: CalendarImpl },
  endEpochNano: bigint,
  calendar: CalendarImpl,
  timeZone: ZonedEpochNanoFields['timeZone'],
  durationFields: DurationFields,
  roundingInc: number | undefined,
  roundingMode: RoundingModeEnum | undefined,
): number {
  return totalAndRoundRelativeDateUnit(
    unit,
    durationFields,
    endEpochNano,
    roundingInc,
    roundingMode,
    createZonedRelativeOps(calendar, timeZone, record0),
  )
}

function totalAndRoundRelativeDateUnit(
  unit: Unit,
  durationFields: DurationFields,
  endEpochNano: bigint,
  roundingInc: number | undefined,
  roundingMode: RoundingModeEnum | undefined,
  relativeOps: RelativeOps,
): number {
  return roundingInc
    ? roundRelativeDateUnit(
        unit,
        durationFields,
        endEpochNano,
        roundingInc,
        roundingMode!,
        relativeOps,
      )
    : totalRelativeDuration(durationFields, endEpochNano, unit, relativeOps)
}

/*
The public diff helpers always round with the same largest and smallest unit,
so they only need the nudge step from the general relative-duration rounder.
Keeping that focused operation here avoids pulling the rebalancing machinery
into every tree-shaken date-unit diff.
*/
function roundRelativeDateUnit(
  unit: Unit,
  durationFields: DurationFields,
  endEpochNano: bigint,
  roundingInc: number,
  roundingMode: RoundingModeEnum,
  relativeOps: RelativeOps,
): number {
  const sign = computeDurationSign(durationFields) || 1
  const unitFieldName = durationFieldNamesAsc[unit]

  // Weeks are seven-day groups in all currently supported calendars. Fold any
  // balanced day remainder into the week value before choosing its window.
  if (unit === Unit.Week) {
    durationFields = {
      ...durationFields,
      weeks: durationFields.weeks + Math.trunc(durationFields.days / 7),
    }
  }

  const baseDurationFields = clearDurationFields(unit, durationFields)
  baseDurationFields[unitFieldName] =
    divTrunc(durationFields[unitFieldName], roundingInc) * roundingInc

  const nudgeWindow = clampRelativeDuration(
    baseDurationFields,
    unit,
    roundingInc * sign,
    relativeOps,
    endEpochNano,
  )
  const fraction = computeEpochNanoFrac(
    endEpochNano,
    nudgeWindow.epochNano0,
    nudgeWindow.epochNano1,
  )
  const exactValue =
    nudgeWindow.startDurationFields[unitFieldName] +
    fraction * sign * roundingInc

  return roundNumberToInc(exactValue, roundingInc, roundingMode)
}

function diffPlainDayLikeUnit(
  markerToEpochNano: MarkerToEpochNano,
  unit: Unit.Week | Unit.Day,
  daysInUnit: number,
  record0: DiffMarker,
  record1: DiffMarker,
  options?: RoundingMathOptions | RoundingMode,
): number {
  const [roundingInc, roundingMode, defaultRoundingInc] = refineUnitDiffOptions(
    unit,
    options,
    Unit.Nanosecond,
  )
  let nanoDiff = markerToEpochNano(record1) - markerToEpochNano(record0)

  if (defaultRoundingInc) {
    const bigDefaultRoundingInc = BigInt(defaultRoundingInc)
    nanoDiff = (nanoDiff / bigDefaultRoundingInc) * bigDefaultRoundingInc
  }

  if (!roundingInc && (unit === Unit.Week || nanoDiff)) {
    checkPlainRelativeToBounds(record0, record1)
  }

  const nanoInUnit = nanoInUtcDay * daysInUnit
  const bigNanoInUnit = BigInt(nanoInUnit)
  const wholeUnits = Number(nanoDiff / bigNanoInUnit)

  if (unit === Unit.Week && nanoDiff) {
    const sign = compareBigInts(nanoDiff, 0n)
    const windowInc = roundingInc || 1
    const windowStart = roundingInc
      ? divTrunc(wholeUnits, roundingInc) * roundingInc
      : wholeUnits
    checkIsoDateInBounds(moveByDays(record0, windowStart * daysInUnit))
    checkIsoDateInBounds(
      moveByDays(record0, (windowStart + windowInc * sign) * daysInUnit),
    )
  }

  let res = wholeUnits + Number(nanoDiff % bigNanoInUnit) / nanoInUnit

  if (roundingInc) {
    res = roundNumberToInc(res, roundingInc, roundingMode!)
  }

  return res
}

function truncateEpochNanoDiff(
  startEpochNano: bigint,
  endEpochNano: bigint,
  roundingInc: number,
): bigint {
  const bigRoundingInc = BigInt(roundingInc)
  return (
    startEpochNano +
    ((endEpochNano - startEpochNano) / bigRoundingInc) * bigRoundingInc
  )
}

function checkPlainRelativeToBounds(
  marker0: DiffMarker,
  marker1: DiffMarker,
): void {
  checkIsoDateTimeInBounds(combineDateAndTime(marker0, timeFieldDefaults))
  checkIsoDateTimeInBounds(combineDateAndTime(marker1, timeFieldDefaults))
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
