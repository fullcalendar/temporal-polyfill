import type { RoundingMathOptions, RoundingMode } from 'temporal-utils'
import { type CalendarImpl } from '../internal/calendarImpl'
import {
  computeCalendarDateDiff,
  computeCalendarDateTimeDiff,
  computeIsoDateDiff,
  computeIsoDateTimeDiff,
  computePlainYearMonthDiff,
  computeZonedCalendarDiff,
  computeZonedIsoDiff,
} from '../internal/diff'
import { durationFieldNamesAsc } from '../internal/durationFields'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  TimeFields,
} from '../internal/fieldTypes'
import { refineUnitDiffOptions } from '../internal/optionsRoundingRefine'
import { getCommonCalendar } from '../internal/slotUtils'
import { EpochNanoFields, ZonedEpochNanoFields } from '../internal/slots'
import {
  totalPlainCalendarDuration,
  totalPlainIsoDuration,
  totalPlainYearMonthDuration,
  totalZonedCalendarDuration,
  totalZonedIsoDuration,
} from '../internal/total'
import {
  computeEpochNanoUnitDiff,
  computeIsoDateTimeUnitDiff,
  computePlainTimeUnitDiff,
} from '../internal/unitDiff'
import { TimeUnit, Unit } from '../internal/units'
import { bindArgs } from '../internal/utils'

export const diffZonedYears = bindArgs(diffZonedUnit, Unit.Year)
export const diffZonedMonths = bindArgs(diffZonedUnit, Unit.Month)
export const diffZonedWeeks = bindArgs(diffZonedIsoUnit, Unit.Week)
export const diffZonedDays = bindArgs(diffZonedIsoUnit, Unit.Day)

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

export const diffInstantEpochNanoTimeUnit = diffInstantTimeUnit
export const diffPlainYears = bindArgs(diffPlainDateUnit, Unit.Year)
export const diffPlainMonths = bindArgs(diffPlainDateUnit, Unit.Month)
export const diffPlainDateWeeks = bindArgs(diffPlainDateIsoUnit, Unit.Week)
export const diffPlainDateDays = bindArgs(diffPlainDateIsoUnit, Unit.Day)
export const diffPlainDateTimeYears = bindArgs(diffPlainDateTimeUnit, Unit.Year)
export const diffPlainDateTimeMonths = bindArgs(
  diffPlainDateTimeUnit,
  Unit.Month,
)
export const diffPlainWeeks = bindArgs(diffPlainIsoUnit, Unit.Week)
export const diffPlainDays = bindArgs(diffPlainIsoUnit, Unit.Day)

export function diffPlainDateTimeEpochNanoTimeUnit(
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

function diffZonedUnit(
  unit: Unit,
  slots0: ZonedEpochNanoFields & { calendar: CalendarImpl },
  slots1: ZonedEpochNanoFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode,
): number {
  const calendar = getCommonCalendar(slots0.calendar, slots1.calendar)
  const [smallestUnit, roundingInc, roundingMode, shouldTotal] =
    refineUnitDiffOptions(unit, options, Unit.Nanosecond)
  const durationFields = computeZonedCalendarDiff(
    calendar,
    slots0,
    slots1,
    unit,
    smallestUnit,
    roundingInc,
    roundingMode,
  )
  return shouldTotal
    ? totalZonedCalendarDuration(durationFields, slots0, unit)
    : durationFields[durationFieldNamesAsc[unit]]
}

function diffPlainDateUnit(
  unit: Unit,
  slots0: CalendarDateFields & { calendar: CalendarImpl },
  slots1: CalendarDateFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode,
): number {
  const calendar = getCommonCalendar(slots0.calendar, slots1.calendar)
  const [smallestUnit, roundingInc, roundingMode, shouldTotal] =
    refineUnitDiffOptions(unit, options, Unit.Day)
  const durationFields = computeCalendarDateDiff(
    calendar,
    slots0,
    slots1,
    unit,
    smallestUnit,
    roundingInc,
    roundingMode,
  )
  return shouldTotal
    ? totalPlainCalendarDuration(durationFields, slots0, unit)
    : durationFields[durationFieldNamesAsc[unit]]
}

function diffPlainDateTimeUnit(
  unit: Unit,
  slots0: CalendarDateTimeFields & { calendar: CalendarImpl },
  slots1: CalendarDateTimeFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode,
): number {
  const calendar = getCommonCalendar(slots0.calendar, slots1.calendar)
  const [smallestUnit, roundingInc, roundingMode, shouldTotal] =
    refineUnitDiffOptions(unit, options, Unit.Nanosecond)
  const durationFields = computeCalendarDateTimeDiff(
    calendar,
    slots0,
    slots1,
    unit,
    smallestUnit,
    roundingInc,
    roundingMode,
  )
  return shouldTotal
    ? totalPlainCalendarDuration(durationFields, slots0, unit)
    : durationFields[durationFieldNamesAsc[unit]]
}

export const diffPlainYearMonthYears = bindArgs(
  diffPlainYearMonthUnit,
  Unit.Year,
)
export const diffPlainYearMonthMonths = bindArgs(
  diffPlainYearMonthUnit,
  Unit.Month,
)

function diffPlainYearMonthUnit(
  unit: Unit.Year | Unit.Month,
  slots0: CalendarDateFields & { calendar: CalendarImpl },
  slots1: CalendarDateFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode,
): number {
  const calendar = getCommonCalendar(slots0.calendar, slots1.calendar)
  const [smallestUnit, roundingInc, roundingMode, shouldTotal] =
    refineUnitDiffOptions(unit, options, Unit.Month)
  const durationFields = computePlainYearMonthDiff(
    calendar,
    slots0,
    slots1,
    unit,
    smallestUnit,
    roundingInc,
    roundingMode,
  )
  return shouldTotal
    ? totalPlainYearMonthDuration(durationFields, slots0, unit)
    : durationFields[durationFieldNamesAsc[unit]]
}

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

export function diffPlainTimeNanoOfDayTimeUnit(
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
  return computePlainTimeUnitDiff(
    slots0,
    slots1,
    unit,
    smallestUnit as TimeUnit,
    roundingInc,
    roundingMode,
  )
}

function diffZonedIsoUnit(
  unit: Unit.Day | Unit.Week,
  slots0: ZonedEpochNanoFields & { calendar: CalendarImpl },
  slots1: ZonedEpochNanoFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode,
): number {
  getCommonCalendar(slots0.calendar, slots1.calendar)
  const [smallestUnit, increment, mode, shouldTotal] = refineUnitDiffOptions(
    unit,
    options,
    Unit.Nanosecond,
  )
  const durationFields = computeZonedIsoDiff(
    unit,
    slots0,
    slots1,
    smallestUnit,
    increment,
    mode,
  )
  return shouldTotal
    ? totalZonedIsoDuration(durationFields, slots0, unit)
    : durationFields[durationFieldNamesAsc[unit]]
}

function diffPlainDateIsoUnit(
  unit: Unit.Day | Unit.Week,
  slots0: CalendarDateFields & { calendar: CalendarImpl },
  slots1: CalendarDateFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode,
): number {
  getCommonCalendar(slots0.calendar, slots1.calendar)
  const [smallestUnit, increment, mode, shouldTotal] = refineUnitDiffOptions(
    unit,
    options,
    Unit.Day,
  )
  const durationFields = computeIsoDateDiff(
    unit,
    slots0,
    slots1,
    smallestUnit,
    increment,
    mode,
  )
  return shouldTotal
    ? totalPlainIsoDuration(durationFields, slots0, unit)
    : durationFields[durationFieldNamesAsc[unit]]
}

function diffPlainIsoUnit(
  unit: Unit.Day | Unit.Week,
  slots0: CalendarDateTimeFields & { calendar: CalendarImpl },
  slots1: CalendarDateTimeFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode,
): number {
  getCommonCalendar(slots0.calendar, slots1.calendar)
  const [smallestUnit, increment, mode, shouldTotal] = refineUnitDiffOptions(
    unit,
    options,
    Unit.Nanosecond,
  )
  const durationFields = computeIsoDateTimeDiff(
    unit,
    slots0,
    slots1,
    smallestUnit,
    increment,
    mode,
  )
  return shouldTotal
    ? totalPlainIsoDuration(durationFields, slots0, unit)
    : durationFields[durationFieldNamesAsc[unit]]
}
