import type { RoundingMathOptions, RoundingMode } from 'temporal-utils'
import { type CalendarImpl } from '../../internal/calendarImpl'
import {
  diffInstantsWithRounding,
  diffPlainDateTimesWithRounding,
  diffPlainDatesWithRounding,
  diffPlainTimesWithRounding,
  diffPlainYearMonthsWithRounding,
  diffZonedDateTimesWithRounding,
} from '../../internal/diff'
import {
  DurationFields,
  durationFieldNamesAsc,
} from '../../internal/durationFields'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  TimeFields,
} from '../../internal/fieldTypes'
import { moveToStartOfMonth } from '../../internal/move'
import { refineUnitDiffOptions } from '../../internal/optionsRoundingRefine'
import {
  type ZonedEpochMarker,
  spanPlainRelativeDuration,
  spanZonedRelativeDuration,
} from '../../internal/relativeMath'
import { getCommonCalendar } from '../../internal/slotUtils'
import {
  EpochNanoFields,
  ZonedEpochNanoFields,
  createDurationSlots,
} from '../../internal/slots'
import {
  totalDayTimeDuration,
  totalRelativeDuration,
} from '../../internal/total'
import { TimeUnit, Unit } from '../../internal/units'
import { bindArgs } from '../../internal/utils'

export const diffZonedYears = bindArgs(diffZonedUnit, Unit.Year)
export const diffZonedMonths = bindArgs(diffZonedUnit, Unit.Month)
export const diffZonedWeeks = bindArgs(diffZonedUnit, Unit.Week)
export const diffZonedDays = bindArgs(diffZonedUnit, Unit.Day)
export const diffZonedEpochNanoTimeUnit = diffZonedUnit
export const diffInstantEpochNanoTimeUnit = diffInstantTimeUnit

export const diffPlainYears = bindArgs(diffPlainDateUnit, Unit.Year)
export const diffPlainMonths = bindArgs(diffPlainDateUnit, Unit.Month)
export const diffPlainDateWeeks = bindArgs(diffPlainDateUnit, Unit.Week)
export const diffPlainDateDays = bindArgs(diffPlainDateUnit, Unit.Day)
export const diffPlainDateTimeYears = bindArgs(diffPlainDateTimeUnit, Unit.Year)
export const diffPlainDateTimeMonths = bindArgs(
  diffPlainDateTimeUnit,
  Unit.Month,
)
export const diffPlainWeeks = bindArgs(diffPlainDateTimeUnit, Unit.Week)
export const diffPlainDays = bindArgs(diffPlainDateTimeUnit, Unit.Day)
export const diffPlainDateTimeEpochNanoTimeUnit = diffPlainDateTimeUnit

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

function totalPlainUnitDiff(
  unit: Unit,
  durationFields: DurationFields,
  relativeToSlots: CalendarDateFields & { calendar: CalendarImpl },
): number {
  const durationSlots = createDurationSlots(durationFields)
  const [balancedDuration, endEpochNano, relativeOps] =
    spanPlainRelativeDuration(relativeToSlots, durationSlots, unit)

  return totalRelativeDuration(
    balancedDuration,
    endEpochNano,
    unit,
    relativeOps,
  )
}

function totalZonedUnitDiff(
  unit: Unit,
  durationFields: DurationFields,
  relativeToSlots: ZonedEpochMarker,
): number {
  const durationSlots = createDurationSlots(durationFields)
  const [balancedDuration, endEpochNano, relativeOps] =
    spanZonedRelativeDuration(relativeToSlots, durationSlots, unit)

  return totalRelativeDuration(
    balancedDuration,
    endEpochNano,
    unit,
    relativeOps,
  )
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
  const durationFields = diffZonedDateTimesWithRounding(
    calendar,
    slots0,
    slots1,
    unit,
    smallestUnit,
    roundingInc,
    roundingMode,
  )

  if (!shouldTotal) {
    return durationFields[durationFieldNamesAsc[unit]]
  }

  return unit < Unit.Day
    ? totalDayTimeDuration(durationFields, unit as TimeUnit)
    : totalZonedUnitDiff(unit, durationFields, slots0)
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
  const durationFields = diffPlainDatesWithRounding(
    calendar,
    slots0,
    slots1,
    unit,
    smallestUnit,
    roundingInc,
    roundingMode,
  )

  return shouldTotal
    ? totalPlainUnitDiff(unit, durationFields, slots0)
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
  const durationFields = diffPlainDateTimesWithRounding(
    calendar,
    slots0,
    slots1,
    unit,
    smallestUnit,
    roundingInc,
    roundingMode,
  )

  if (!shouldTotal) {
    return durationFields[durationFieldNamesAsc[unit]]
  }

  return unit < Unit.Day
    ? totalDayTimeDuration(durationFields, unit as TimeUnit)
    : totalPlainUnitDiff(unit, durationFields, slots0)
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
  const durationFields = diffPlainYearMonthsWithRounding(
    calendar,
    slots0,
    slots1,
    unit,
    smallestUnit,
    roundingInc,
    roundingMode,
  )
  if (!shouldTotal) {
    return durationFields[durationFieldNamesAsc[unit]]
  }

  return totalPlainUnitDiff(unit, durationFields, {
    ...moveToStartOfMonth(calendar, slots0),
    calendar,
  })
}

function diffInstantTimeUnit(
  unit: TimeUnit,
  slots0: EpochNanoFields,
  slots1: EpochNanoFields,
  options?: RoundingMathOptions | RoundingMode,
): number {
  const [smallestUnit, roundingInc, roundingMode, shouldTotal] =
    refineUnitDiffOptions(unit, options, Unit.Nanosecond)
  const durationFields = diffInstantsWithRounding(
    slots0,
    slots1,
    unit,
    smallestUnit as TimeUnit,
    roundingInc,
    roundingMode,
  )

  return shouldTotal
    ? totalDayTimeDuration(durationFields, unit)
    : durationFields[durationFieldNamesAsc[unit]]
}

export function diffPlainTimeNanoOfDayTimeUnit(
  unit: TimeUnit,
  slots0: TimeFields,
  slots1: TimeFields,
  options?: RoundingMathOptions | RoundingMode,
): number {
  const [smallestUnit, roundingInc, roundingMode, shouldTotal] =
    refineUnitDiffOptions(unit, options, Unit.Nanosecond)
  const durationFields = diffPlainTimesWithRounding(
    slots0,
    slots1,
    unit,
    smallestUnit as TimeUnit,
    roundingInc,
    roundingMode,
  )

  return shouldTotal
    ? totalDayTimeDuration(durationFields, unit)
    : durationFields[durationFieldNamesAsc[unit]]
}
