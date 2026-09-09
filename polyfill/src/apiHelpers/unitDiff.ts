import type { RoundingMathOptions, RoundingMode } from 'temporal-utils'
import { type CalendarImpl } from '../internal/calendarImpl'
import {
  diffDateCalendarUnitsRounded,
  diffDateDayWeekUnitsRounded,
  diffDateTimeCalendarUnitsRounded,
  diffDateTimeDayWeekUnitsRounded,
  diffYearMonthsRounded,
  diffZonedCalendarUnitsRounded,
  diffZonedDayWeekUnitsRounded,
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
  totalPlainDayWeekDuration,
  totalYearMonthDuration,
  totalZonedCalendarDuration,
  totalZonedDayWeekDuration,
} from '../internal/total'
import {
  computeEpochNanoUnitDiff,
  computeIsoDateTimeUnitDiff,
  computeTimeUnitDiff,
} from '../internal/unitDiff'
import { DayWeekUnit, TimeUnit, Unit } from '../internal/units'
import { bindArgs } from '../internal/utils'

export const diffZonedYears = bindArgs(diffZonedCalendarUnit, Unit.Year)
export const diffZonedMonths = bindArgs(diffZonedCalendarUnit, Unit.Month)
export const diffZonedWeeks = bindArgs(diffZonedDayWeekUnit, Unit.Week)
export const diffZonedDays = bindArgs(diffZonedDayWeekUnit, Unit.Day)

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
export const diffDateYears = bindArgs(diffDateCalendarUnit, Unit.Year)
export const diffDateMonths = bindArgs(diffDateCalendarUnit, Unit.Month)
export const diffDateWeeks = bindArgs(diffDateDayWeekUnit, Unit.Week)
export const diffDateDays = bindArgs(diffDateDayWeekUnit, Unit.Day)
export const diffDateTimeYears = bindArgs(diffDateTimeCalendarUnit, Unit.Year)
export const diffDateTimeMonths = bindArgs(diffDateTimeCalendarUnit, Unit.Month)
export const diffDateTimeWeeks = bindArgs(diffDateTimeDayWeekUnit, Unit.Week)
export const diffDateTimeDays = bindArgs(diffDateTimeDayWeekUnit, Unit.Day)

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

function diffZonedCalendarUnit(
  unit: Unit,
  slots0: ZonedEpochNanoFields & { calendar: CalendarImpl },
  slots1: ZonedEpochNanoFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode,
): number {
  const calendar = getCommonCalendar(slots0.calendar, slots1.calendar)
  const [smallestUnit, roundingInc, roundingMode, shouldTotal] =
    refineUnitDiffOptions(unit, options, Unit.Nanosecond)
  const durationFields = diffZonedCalendarUnitsRounded(
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

function diffDateCalendarUnit(
  unit: Unit,
  slots0: CalendarDateFields & { calendar: CalendarImpl },
  slots1: CalendarDateFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode,
): number {
  const calendar = getCommonCalendar(slots0.calendar, slots1.calendar)
  const [smallestUnit, roundingInc, roundingMode, shouldTotal] =
    refineUnitDiffOptions(unit, options, Unit.Day)
  const durationFields = diffDateCalendarUnitsRounded(
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

function diffDateTimeCalendarUnit(
  unit: Unit,
  slots0: CalendarDateTimeFields & { calendar: CalendarImpl },
  slots1: CalendarDateTimeFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode,
): number {
  const calendar = getCommonCalendar(slots0.calendar, slots1.calendar)
  const [smallestUnit, roundingInc, roundingMode, shouldTotal] =
    refineUnitDiffOptions(unit, options, Unit.Nanosecond)
  const durationFields = diffDateTimeCalendarUnitsRounded(
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

export const diffYearMonthYears = bindArgs(diffYearMonthCalendarUnit, Unit.Year)
export const diffYearMonthMonths = bindArgs(
  diffYearMonthCalendarUnit,
  Unit.Month,
)

function diffYearMonthCalendarUnit(
  unit: Unit.Year | Unit.Month,
  slots0: CalendarDateFields & { calendar: CalendarImpl },
  slots1: CalendarDateFields & { calendar: CalendarImpl },
  options?: RoundingMathOptions | RoundingMode,
): number {
  const calendar = getCommonCalendar(slots0.calendar, slots1.calendar)
  const [smallestUnit, roundingInc, roundingMode, shouldTotal] =
    refineUnitDiffOptions(unit, options, Unit.Month)
  const durationFields = diffYearMonthsRounded(
    calendar,
    slots0,
    slots1,
    unit,
    smallestUnit,
    roundingInc,
    roundingMode,
  )
  return shouldTotal
    ? totalYearMonthDuration(durationFields, slots0, unit)
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

function diffZonedDayWeekUnit(
  unit: DayWeekUnit,
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
  const durationFields = diffZonedDayWeekUnitsRounded(
    unit,
    slots0,
    slots1,
    smallestUnit,
    increment,
    mode,
  )
  return shouldTotal
    ? totalZonedDayWeekDuration(durationFields, slots0, unit)
    : durationFields[durationFieldNamesAsc[unit]]
}

function diffDateDayWeekUnit(
  unit: DayWeekUnit,
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
  const durationFields = diffDateDayWeekUnitsRounded(
    unit,
    slots0,
    slots1,
    smallestUnit,
    increment,
    mode,
  )
  return shouldTotal
    ? totalPlainDayWeekDuration(durationFields, slots0, unit)
    : durationFields[durationFieldNamesAsc[unit]]
}

function diffDateTimeDayWeekUnit(
  unit: DayWeekUnit,
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
  const durationFields = diffDateTimeDayWeekUnitsRounded(
    unit,
    slots0,
    slots1,
    smallestUnit,
    increment,
    mode,
  )
  return shouldTotal
    ? totalPlainDayWeekDuration(durationFields, slots0, unit)
    : durationFields[durationFieldNamesAsc[unit]]
}
