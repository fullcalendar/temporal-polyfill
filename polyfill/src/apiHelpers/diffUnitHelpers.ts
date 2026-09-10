import type { RoundingMathOptions, RoundingMode } from 'temporal-utils'
import { divideBigNanoToExactNumber } from '../internal/bigNano'
import { type CalendarImpl } from '../internal/calendarImpl'
import {
  diffCalendarDates,
  diffDateTimesExact,
  prepareZonedEpochDiff,
} from '../internal/diff'
import {
  computeEpochNanoUnitDiff,
  computeIsoDateTimeUnitDiff,
  computeTimeUnitDiff,
} from '../internal/diffUnit'
import {
  DurationFields,
  clearDurationFields,
  durationFieldNamesAsc,
} from '../internal/durationFields'
import {
  computeDurationSign,
  nanoToDurationTimeFields,
} from '../internal/durationMath'
import {
  epochNanoToIsoDateTime,
  isoDateTimeToEpochNano,
  isoDateToEpochDays,
  isoDateToEpochNano,
} from '../internal/epochMath'
import { timeFieldDefaults } from '../internal/fieldNames'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  TimeFields,
} from '../internal/fieldTypes'
import { combineDateAndTime } from '../internal/fieldUtils'
import { moveDateByDays, moveToStartOfMonth } from '../internal/move'
import {
  RelativeOps,
  createDateRelativeOps,
  createDateTimeRelativeOps,
  createZonedRelativeOps,
  moveRelativeMarkerToEpochNano,
} from '../internal/relativeMath'
import {
  MoveRelativeUnitValue,
  clampRelativeUnitValue,
  interpolateRelativeUnitValue,
} from '../internal/relativeUnit'
import { roundNumberToInc } from '../internal/round'
import { getCommonCalendar, getCommonTimeZone } from '../internal/slotUtils'
import { EpochNanoFields, ZonedEpochNanoFields } from '../internal/slots'
import {
  checkIsoDateInBounds,
  checkIsoDateTimeInBounds,
} from '../internal/temporalLimits'
import { TimeZone } from '../internal/timeZone'
import { getSingleInstantFor } from '../internal/timeZoneMath'
import { DayWeekUnit, TimeUnit, Unit, nanoInUtcDay } from '../internal/units'
import { bindArgs, compareBigInts, divTrunc } from '../internal/utils'
import { RoundingModeEnum } from '../options/model'
import { refineUnitDiffOptions } from '../options/roundingRefine'

// Function API Entry Points
// -----------------------------------------------------------------------------

export const diffZonedYears = bindArgs(diffZonedCalendarUnit, Unit.Year)
export const diffZonedMonths = bindArgs(diffZonedCalendarUnit, Unit.Month)
export const diffZonedWeeks = bindArgs(diffZonedDayWeekUnit, Unit.Week)
export const diffZonedDays = bindArgs(diffZonedDayWeekUnit, Unit.Day)
export const diffInstantEpochNanoTimeUnit = diffInstantTimeUnit
export const diffDateYears = bindArgs(diffDateCalendarUnit, Unit.Year)
export const diffDateMonths = bindArgs(diffDateCalendarUnit, Unit.Month)
export const diffDateWeeks = bindArgs(diffDateDayWeekUnit, Unit.Week)
export const diffDateDays = bindArgs(diffDateDayWeekUnit, Unit.Day)
export const diffDateTimeYears = bindArgs(diffDateTimeCalendarUnit, Unit.Year)
export const diffDateTimeMonths = bindArgs(diffDateTimeCalendarUnit, Unit.Month)
export const diffDateTimeWeeks = bindArgs(diffDateTimeDayWeekUnit, Unit.Week)
export const diffDateTimeDays = bindArgs(diffDateTimeDayWeekUnit, Unit.Day)
export const diffYearMonthYears = bindArgs(diffYearMonthCalendarUnit, Unit.Year)
export const diffYearMonthMonths = bindArgs(
  diffYearMonthCalendarUnit,
  Unit.Month,
)

// Exact-time differences do not require a shared time zone or calendar math.
export function diffZonedEpochNanoTimeUnit(
  unit: TimeUnit,
  slots0: ZonedEpochNanoFields & { calendar: CalendarImpl },
  slots1: ZonedEpochNanoFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode,
): number {
  getCommonCalendar(slots0.calendar, slots1.calendar)
  return diffInstantTimeUnit(unit, slots0, slots1, options)
}

export function diffDateTimeEpochNanoTimeUnit(
  unit: TimeUnit,
  slots0: CalendarDateTimeFields & { calendar: CalendarImpl },
  slots1: CalendarDateTimeFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode,
): number {
  getCommonCalendar(slots0.calendar, slots1.calendar)
  const [smallestUnit, roundingInc, roundingMode] = refineUnitDiffOptions(
    unit,
    options,
    Unit.Nanosecond,
  )
  return computeIsoDateTimeUnitDiff(
    slots0,
    slots1,
    unit,
    smallestUnit as TimeUnit,
    roundingInc,
    roundingMode,
  )
}

export function diffTimeNanoOfDayTimeUnit(
  unit: TimeUnit,
  slots0: TimeFields,
  slots1: TimeFields,
  options?: RoundingMathOptions | RoundingMode,
): number {
  const [smallestUnit, roundingInc, roundingMode] = refineUnitDiffOptions(
    unit,
    options,
    Unit.Nanosecond,
  )
  return computeTimeUnitDiff(
    slots0,
    slots1,
    unit,
    smallestUnit as TimeUnit,
    roundingInc,
    roundingMode,
  )
}

export function adaptRecordTimeUnitDiff<Record, Slots>(
  diffSlots: (
    unit: TimeUnit,
    slots0: Slots,
    slots1: Slots,
    options?: RoundingMathOptions | RoundingMode,
  ) => number,
  getSlots: (record: Record) => Slots,
): (
  unit: TimeUnit,
  record0: Record,
  record1: Record,
  options?: RoundingMathOptions | RoundingMode,
) => number {
  return (unit, record0, record1, options) =>
    diffSlots(unit, getSlots(record0), getSlots(record1), options)
}

// Exact-Time Differences
// -----------------------------------------------------------------------------

function diffInstantTimeUnit(
  unit: TimeUnit,
  slots0: EpochNanoFields,
  slots1: EpochNanoFields,
  options?: RoundingMathOptions | RoundingMode,
): number {
  const [smallestUnit, roundingInc, roundingMode] = refineUnitDiffOptions(
    unit,
    options,
    Unit.Nanosecond,
  )
  return computeEpochNanoUnitDiff(
    slots0.epochNanoseconds,
    slots1.epochNanoseconds,
    unit,
    smallestUnit as TimeUnit,
    roundingInc,
    roundingMode,
  )
}

// Calendar-Unit Differences
// -----------------------------------------------------------------------------

function diffZonedCalendarUnit(
  unit: Unit,
  slots0: ZonedEpochNanoFields & { calendar: CalendarImpl },
  slots1: ZonedEpochNanoFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode,
): number {
  const calendar = getCommonCalendar(slots0.calendar, slots1.calendar)
  const [, roundingInc, roundingMode, shouldTotal] = refineUnitDiffOptions(
    unit,
    options,
    Unit.Nanosecond,
  )
  const startEpochNano = slots0.epochNanoseconds
  const rawEndEpochNano = slots1.epochNanoseconds
  const sign = compareBigInts(rawEndEpochNano, startEpochNano)

  // Equal instants return before the time-zone comparison in Temporal.
  if (!sign) {
    return 0
  }

  const timeZone = getCommonTimeZone(slots0.timeZone, slots1.timeZone)
  const endEpochNano =
    shouldTotal && roundingInc > 1
      ? truncateEpochNanoDiff(startEpochNano, rawEndEpochNano, roundingInc)
      : rawEndEpochNano
  const roundedSign = compareBigInts(endEpochNano, startEpochNano)

  if (!roundedSign) {
    return 0
  }

  const [startIsoDateTime, endIsoDate, remainderNano] = prepareZonedEpochDiff(
    timeZone,
    slots0,
    { ...slots1, epochNanoseconds: endEpochNano },
    roundedSign,
  )
  const durationFields = {
    ...diffCalendarDates(calendar, startIsoDateTime, endIsoDate, unit),
    ...nanoToDurationTimeFields(remainderNano),
  }
  const relativeOps = createZonedRelativeOps(calendar, timeZone, slots0)

  return computeRelativeDateUnit(
    unit,
    durationFields,
    endEpochNano,
    roundingInc,
    roundingMode,
    shouldTotal,
    relativeOps,
  )
}

function diffDateCalendarUnit(
  unit: Unit,
  slots0: CalendarDateFields & { calendar: CalendarImpl },
  slots1: CalendarDateFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode,
): number {
  const calendar = getCommonCalendar(slots0.calendar, slots1.calendar)
  return diffPlainCalendarUnit(
    unit,
    calendar,
    slots0,
    slots1,
    options,
    Unit.Day,
  )
}

function diffDateTimeCalendarUnit(
  unit: Unit,
  slots0: CalendarDateTimeFields & { calendar: CalendarImpl },
  slots1: CalendarDateTimeFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode,
): number {
  const calendar = getCommonCalendar(slots0.calendar, slots1.calendar)
  const [, roundingInc, roundingMode, shouldTotal] = refineUnitDiffOptions(
    unit,
    options,
    Unit.Nanosecond,
  )
  const startEpochNano = isoDateTimeToEpochNano(slots0)
  const rawEndEpochNano = isoDateTimeToEpochNano(slots1)
  const endEpochNano =
    shouldTotal && roundingInc > 1
      ? truncateEpochNanoDiff(startEpochNano, rawEndEpochNano, roundingInc)
      : rawEndEpochNano

  if (shouldTotal && roundingInc === 1 && endEpochNano !== startEpochNano) {
    checkPlainRelativeSpanInBounds(slots0, slots1)
  }

  if (endEpochNano === startEpochNano) {
    return 0
  }

  const roundedSlots1 =
    endEpochNano === rawEndEpochNano
      ? slots1
      : { ...epochNanoToIsoDateTime(endEpochNano), calendar: slots1.calendar }
  const durationFields = diffDateTimesExact(
    calendar,
    slots0,
    roundedSlots1,
    unit,
  )
  const relativeOps = createDateTimeRelativeOps(calendar, slots0)

  return computeRelativeDateUnit(
    unit,
    durationFields,
    endEpochNano,
    roundingInc,
    roundingMode,
    shouldTotal,
    relativeOps,
  )
}

function diffYearMonthCalendarUnit(
  unit: Unit.Year | Unit.Month,
  slots0: CalendarDateFields & { calendar: CalendarImpl },
  slots1: CalendarDateFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode,
): number {
  const calendar = getCommonCalendar(slots0.calendar, slots1.calendar)
  const start = moveToStartOfMonth(calendar, slots0)
  const end = moveToStartOfMonth(calendar, slots1)

  // PlainYearMonth ignores its reference ISO day and returns equal months
  // before validating the implicit first-of-month dates.
  if (start.year === end.year && start.month === end.month) {
    return 0
  }

  checkIsoDateInBounds(start)
  checkIsoDateInBounds(end)

  return diffPlainCalendarUnit(unit, calendar, start, end, options, Unit.Month)
}

function diffPlainCalendarUnit(
  unit: Unit,
  calendar: CalendarImpl,
  slots0: CalendarDateFields,
  slots1: CalendarDateFields,
  options: RoundingMathOptions | RoundingMode | undefined,
  defaultSmallestUnit: Unit.Day | Unit.Month,
): number {
  const [, roundingInc, roundingMode, shouldTotal] = refineUnitDiffOptions(
    unit,
    options,
    defaultSmallestUnit,
  )
  const startEpochNano = isoDateToEpochNano(slots0)
  let endEpochNano = isoDateToEpochNano(slots1)

  if (shouldTotal && (unit === Unit.Week || endEpochNano !== startEpochNano)) {
    checkPlainRelativeSpanInBounds(slots0, slots1)
  }

  if (endEpochNano === startEpochNano) {
    return 0
  }

  const durationFields = diffCalendarDates(calendar, slots0, slots1, unit)
  const relativeOps = createDateRelativeOps(calendar, slots0)

  // With no explicit mode, temporal-utils first rounds the underlying
  // Temporal difference at that type's default precision and then totals it.
  if (shouldTotal && roundingInc > 1) {
    const fieldName = durationFieldNamesAsc[defaultSmallestUnit]
    durationFields[fieldName] =
      divTrunc(durationFields[fieldName], roundingInc) * roundingInc
    endEpochNano = moveRelativeMarkerToEpochNano(relativeOps, durationFields)
  }

  return computeRelativeDateUnit(
    unit,
    durationFields,
    endEpochNano,
    roundingInc,
    roundingMode,
    shouldTotal,
    relativeOps,
  )
}

// Day/Week Differences
// -----------------------------------------------------------------------------

function diffZonedDayWeekUnit(
  unit: DayWeekUnit,
  slots0: ZonedEpochNanoFields & { calendar: CalendarImpl },
  slots1: ZonedEpochNanoFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode,
): number {
  getCommonCalendar(slots0.calendar, slots1.calendar)
  const [, increment, mode, shouldTotal] = refineUnitDiffOptions(
    unit,
    options,
    Unit.Nanosecond,
  )
  const startEpochNano = slots0.epochNanoseconds
  const rawEndEpochNano = slots1.epochNanoseconds
  const sign = compareBigInts(rawEndEpochNano, startEpochNano)

  if (!sign) {
    return 0
  }

  const timeZone = getCommonTimeZone(slots0.timeZone, slots1.timeZone)
  const endEpochNano =
    shouldTotal && increment > 1
      ? truncateEpochNanoDiff(startEpochNano, rawEndEpochNano, increment)
      : rawEndEpochNano
  const roundedSign = compareBigInts(endEpochNano, startEpochNano)

  if (!roundedSign) {
    return 0
  }

  const [startIsoDateTime, endIsoDate] = prepareZonedEpochDiff(
    timeZone,
    slots0,
    { ...slots1, epochNanoseconds: endEpochNano },
    roundedSign,
  )
  const daysInUnit = unit === Unit.Week ? 7 : 1
  const dayDiff =
    isoDateToEpochDays(endIsoDate) - isoDateToEpochDays(startIsoDateTime)
  const wholeUnits = Math.trunc(dayDiff / daysInUnit)

  return totalOrRoundZonedDayWeekUnit(
    daysInUnit,
    startIsoDateTime,
    startEpochNano,
    endEpochNano,
    timeZone,
    wholeUnits,
    shouldTotal,
    increment,
    mode,
  )
}

function diffDateDayWeekUnit(
  unit: DayWeekUnit,
  slots0: CalendarDateFields & { calendar: CalendarImpl },
  slots1: CalendarDateFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode,
): number {
  getCommonCalendar(slots0.calendar, slots1.calendar)
  const [, increment, mode, shouldTotal] = refineUnitDiffOptions(
    unit,
    options,
    Unit.Day,
  )
  const daysInUnit = unit === Unit.Week ? 7 : 1
  let dayDiff = isoDateToEpochDays(slots1) - isoDateToEpochDays(slots0)

  if (shouldTotal) {
    dayDiff = divTrunc(dayDiff, increment) * increment

    if (!dayDiff) {
      return 0
    }

    checkPlainRelativeSpanInBounds(slots0, slots1)
  }

  const wholeUnits = Math.trunc(dayDiff / daysInUnit)
  const result = wholeUnits + (dayDiff % daysInUnit) / daysInUnit
  checkPlainWeekWindow(unit, slots0, result, daysInUnit, shouldTotal, increment)
  return shouldTotal ? result : roundNumberToInc(result, increment, mode)
}

function diffDateTimeDayWeekUnit(
  unit: DayWeekUnit,
  slots0: CalendarDateTimeFields & { calendar: CalendarImpl },
  slots1: CalendarDateTimeFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode,
): number {
  getCommonCalendar(slots0.calendar, slots1.calendar)
  const [, increment, mode, shouldTotal] = refineUnitDiffOptions(
    unit,
    options,
    Unit.Nanosecond,
  )
  let nanoDiff = isoDateTimeToEpochNano(slots1) - isoDateTimeToEpochNano(slots0)

  if (shouldTotal) {
    nanoDiff = truncateBigInt(nanoDiff, increment)

    if (!nanoDiff) {
      return 0
    }

    checkPlainRelativeSpanInBounds(slots0, slots1)
  }

  const daysInUnit = unit === Unit.Week ? 7 : 1
  const nanoInUnit = nanoInUtcDay * daysInUnit
  const result = divideBigNanoToExactNumber(nanoDiff, nanoInUnit)

  checkPlainWeekWindow(unit, slots0, result, daysInUnit, shouldTotal, increment)

  return shouldTotal ? result : roundNumberToInc(result, increment, mode)
}

function totalOrRoundZonedDayWeekUnit(
  daysInUnit: number,
  origin: CalendarDateTimeFields,
  startEpochNano: bigint,
  endEpochNano: bigint,
  timeZone: TimeZone,
  wholeUnits: number,
  shouldTotal: boolean,
  increment: number,
  mode: RoundingModeEnum,
): number {
  const sign = compareBigInts(endEpochNano, startEpochNano) as -1 | 1
  const windowIncrement = shouldTotal ? 1 : increment
  const windowStartValue = shouldTotal
    ? wholeUnits
    : divTrunc(wholeUnits, increment) * increment

  return computeRelativeUnitResult(
    windowStartValue,
    windowIncrement * sign,
    endEpochNano,
    (value) =>
      moveZonedDayWeekValue(
        daysInUnit,
        origin,
        startEpochNano,
        timeZone,
        value,
      ),
    shouldTotal,
    increment,
    mode,
  )
}

function moveZonedDayWeekValue(
  daysInUnit: number,
  origin: CalendarDateTimeFields,
  startEpochNano: bigint,
  timeZone: TimeZone,
  value: number,
): bigint {
  if (!value) {
    return startEpochNano
  }

  return getSingleInstantFor(
    timeZone,
    combineDateAndTime(moveDateByDays(origin, value * daysInUnit), origin),
  )
}

function checkPlainWeekWindow(
  unit: DayWeekUnit,
  origin: CalendarDateFields,
  value: number,
  daysInValue: number,
  shouldTotal: boolean,
  increment: number,
): void {
  if (unit !== Unit.Week || !value) {
    return
  }

  const sign = Math.sign(value)
  const windowIncrement = shouldTotal ? 1 : increment
  const wholeValue = Math.trunc(value)
  const windowStart = shouldTotal
    ? wholeValue
    : divTrunc(wholeValue, increment) * increment
  checkIsoDateInBounds(moveDateByDays(origin, windowStart * daysInValue))
  checkIsoDateInBounds(
    moveDateByDays(
      origin,
      (windowStart + windowIncrement * sign) * daysInValue,
    ),
  )
}

// Relative-Unit Result Computation
// -----------------------------------------------------------------------------

function computeRelativeDateUnit(
  unit: Unit,
  durationFields: DurationFields,
  endEpochNano: bigint,
  increment: number,
  mode: RoundingModeEnum,
  shouldTotal: boolean,
  relativeOps: RelativeOps,
): number {
  const sign = computeDurationSign(durationFields) || 1
  const fieldName = durationFieldNamesAsc[unit]

  // Weeks are seven-day groups. Fold complete day groups into the unit value
  // before selecting the adjacent rounding window.
  if (unit === Unit.Week) {
    durationFields = {
      ...durationFields,
      weeks: durationFields.weeks + Math.trunc(durationFields.days / 7),
      days: durationFields.days % 7,
    }
  }

  const baseDurationFields = clearDurationFields(unit, durationFields)
  if (!shouldTotal) {
    baseDurationFields[fieldName] =
      divTrunc(durationFields[fieldName], increment) * increment
  }

  // An exact multiple is already rounded. Avoid probing a following unit at
  // the representable boundary, where that unnecessary probe could throw.
  let hasRemainder = false
  for (let i = 0; i < unit; i++) {
    if (durationFields[durationFieldNamesAsc[i]]) {
      hasRemainder = true
      break
    }
  }
  if (
    !shouldTotal &&
    !hasRemainder &&
    durationFields[fieldName] === baseDurationFields[fieldName]
  ) {
    return baseDurationFields[fieldName]
  }

  const windowIncrement = shouldTotal ? 1 : increment
  return computeRelativeUnitResult(
    baseDurationFields[fieldName],
    windowIncrement * sign,
    endEpochNano,
    (value) =>
      moveRelativeMarkerToEpochNano(relativeOps, {
        ...baseDurationFields,
        [fieldName]: value,
      }),
    shouldTotal,
    increment,
    mode,
  )
}

function computeRelativeUnitResult(
  startValue: number,
  valueDelta: number,
  endEpochNano: bigint,
  moveValueToEpochNano: MoveRelativeUnitValue,
  shouldTotal: boolean,
  increment: number,
  mode: RoundingModeEnum,
): number {
  const window = clampRelativeUnitValue(
    startValue,
    valueDelta,
    moveValueToEpochNano,
    endEpochNano,
  )
  const result = interpolateRelativeUnitValue(
    window.startValue,
    window.endValue,
    endEpochNano,
    window.epochNano0,
    window.epochNano1,
    shouldTotal,
  )

  return shouldTotal ? result : roundNumberToInc(result, increment, mode)
}

// Low-Level Helpers
// -----------------------------------------------------------------------------

function truncateEpochNanoDiff(
  startEpochNano: bigint,
  endEpochNano: bigint,
  increment: number,
): bigint {
  return (
    startEpochNano + truncateBigInt(endEpochNano - startEpochNano, increment)
  )
}

function truncateBigInt(value: bigint, increment: number): bigint {
  const bigIncrement = BigInt(increment)
  return (value / bigIncrement) * bigIncrement
}

function checkPlainRelativeSpanInBounds(
  marker0: CalendarDateFields,
  marker1: CalendarDateFields,
): void {
  checkIsoDateTimeInBounds(combineDateAndTime(marker0, timeFieldDefaults))
  checkIsoDateTimeInBounds(combineDateAndTime(marker1, timeFieldDefaults))
}
