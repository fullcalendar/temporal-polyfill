import type { RoundingMathOptions, RoundingMode } from 'temporal-utils'
import { type CalendarImpl } from '../internal/calendarImpl'
import {
  diffCalendarDates,
  diffDateTimesExact,
  diffDatesByDayWeekUnit,
  diffEpochNanosByDayWeekUnit,
  diffZonedEpochsExact,
} from '../internal/diff'
import {
  countDateTimeUnit,
  countEpochNanoDays,
  countEpochNanoUnit,
  countRelativeUnit,
  countTimeUnit,
  countYearMonthUnit,
  countZonedDayWeekUnit,
} from '../internal/diffUnit'
import { DurationFields } from '../internal/durationFields'
import {
  isoDateTimeToEpochNano,
  isoDateToEpochNano,
} from '../internal/epochMath'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  TimeFields,
} from '../internal/fieldTypes'
import {
  RelativeOps,
  createDateDayWeekOps,
  createDateRelativeOps,
  createZonedRelativeOps,
} from '../internal/relativeMath'
import { getCommonCalendar, getCommonTimeZone } from '../internal/slotUtils'
import { EpochNanoFields, ZonedEpochNanoFields } from '../internal/slots'
import { timeFieldsToNano } from '../internal/timeFieldMath'
import { TimeZone } from '../internal/timeZone'
import { DayWeekUnit, TimeUnit, Unit, YearMonthUnit } from '../internal/units'
import { bindArgs } from '../internal/utils'
import { UnitDiffRoundingTuple } from '../options/model'
import { refineUnitDiffOptions } from '../options/roundingRefine'

// Unit-specific diffing for the func API (diffYears, diffHours, etc). Each
// entry point validates its inputs and options, then composes the pieces the
// core needs. The split by type AND unit kind is deliberate: a build that only
// uses PlainDate.diffDays never retains calendar-month arithmetic or time
// zones.

type UnitDiffOptions = RoundingMathOptions | RoundingMode | undefined

// Function API Entry Points
// -----------------------------------------------------------------------------
// Unit-bound entry points. Weeks, days, and time units differ in shape from
// the calendar units, so those entry points are exported functions in the
// per-type sections below.

export const diffZonedYears = bindArgs(diffZonedCalendarUnit, Unit.Year)
export const diffZonedMonths = bindArgs(diffZonedCalendarUnit, Unit.Month)
export const diffZonedWeeks = bindArgs(diffZonedDayWeekUnit, Unit.Week)
export const diffZonedDays = bindArgs(diffZonedDayWeekUnit, Unit.Day)
export const diffInstantEpochNanoTimeUnit = diffInstantTimeUnit
export const diffDateYears = bindArgs(diffDateCalendarUnit, Unit.Year)
export const diffDateMonths = bindArgs(diffDateCalendarUnit, Unit.Month)
export const diffDateTimeYears = bindArgs(diffDateTimeCalendarUnit, Unit.Year)
export const diffDateTimeMonths = bindArgs(diffDateTimeCalendarUnit, Unit.Month)
export const diffYearMonthYears = bindArgs(diffYearMonthUnit, Unit.Year)
export const diffYearMonthMonths = bindArgs(diffYearMonthUnit, Unit.Month)

// Time Units
// -----------------------------------------------------------------------------
// Exact-time differences: uniform nanosecond intervals that need neither a
// shared time zone nor calendar math, only a shared calendar check.

export function diffZonedEpochNanoTimeUnit(
  unit: TimeUnit,
  slots0: ZonedEpochNanoFields & { calendar: CalendarImpl },
  slots1: ZonedEpochNanoFields & { calendar: CalendarImpl },
  options?: UnitDiffOptions,
): number {
  getCommonCalendar(slots0.calendar, slots1.calendar)
  return diffInstantTimeUnit(unit, slots0, slots1, options)
}

export function diffDateTimeEpochNanoTimeUnit(
  unit: TimeUnit,
  slots0: CalendarDateTimeFields & { calendar: CalendarImpl },
  slots1: CalendarDateTimeFields & { calendar: CalendarImpl },
  options?: UnitDiffOptions,
): number {
  getCommonCalendar(slots0.calendar, slots1.calendar)
  return countDateTimeUnit(
    slots0,
    slots1,
    unit,
    refineUnitDiffOptions(unit, options),
  )
}

export function diffTimeNanoOfDayTimeUnit(
  unit: TimeUnit,
  slots0: TimeFields,
  slots1: TimeFields,
  options?: UnitDiffOptions,
): number {
  return countTimeUnit(
    slots0,
    slots1,
    unit,
    refineUnitDiffOptions(unit, options),
  )
}

export function adaptRecordTimeUnitDiff<Record, Slots>(
  diffSlots: (
    unit: TimeUnit,
    slots0: Slots,
    slots1: Slots,
    options?: UnitDiffOptions,
  ) => number,
  getSlots: (record: Record) => Slots,
): (
  unit: TimeUnit,
  record0: Record,
  record1: Record,
  options?: UnitDiffOptions,
) => number {
  return (unit, record0, record1, options) =>
    diffSlots(unit, getSlots(record0), getSlots(record1), options)
}

function diffInstantTimeUnit(
  unit: TimeUnit,
  slots0: EpochNanoFields,
  slots1: EpochNanoFields,
  options?: UnitDiffOptions,
): number {
  return countEpochNanoUnit(
    slots0.epochNanoseconds,
    slots1.epochNanoseconds,
    unit,
    refineUnitDiffOptions(unit, options),
  )
}

// ZonedDateTime
// -----------------------------------------------------------------------------

function diffZonedCalendarUnit(
  unit: YearMonthUnit,
  slots0: ZonedEpochNanoFields & { calendar: CalendarImpl },
  slots1: ZonedEpochNanoFields & { calendar: CalendarImpl },
  options?: UnitDiffOptions,
): number {
  const calendar = getCommonCalendar(slots0.calendar, slots1.calendar)
  return diffZonedUnit(unit, slots0, slots1, options, (timeZone, rounding) =>
    countRelativeUnit(
      unit,
      {
        diffExact: () =>
          diffZonedEpochsExact(timeZone, calendar, slots0, slots1, unit),
        relativeOps: createZonedRelativeOps(calendar, timeZone, slots0),
        endEpochNano: slots1.epochNanoseconds,
      },
      rounding,
      true,
    ),
  )
}

// A scalar path: keeps calendar-month movement and DurationFields out of
// these builds.
function diffZonedDayWeekUnit(
  unit: DayWeekUnit,
  slots0: ZonedEpochNanoFields & { calendar: CalendarImpl },
  slots1: ZonedEpochNanoFields & { calendar: CalendarImpl },
  options?: UnitDiffOptions,
): number {
  getCommonCalendar(slots0.calendar, slots1.calendar)
  return diffZonedUnit(unit, slots0, slots1, options, (timeZone, rounding) =>
    countZonedDayWeekUnit(unit, timeZone, slots0, slots1, rounding),
  )
}

function diffZonedUnit(
  unit: Unit,
  slots0: ZonedEpochNanoFields,
  slots1: ZonedEpochNanoFields,
  options: UnitDiffOptions,
  compute: (timeZone: TimeZone, rounding: UnitDiffRoundingTuple) => number,
): number {
  const rounding = refineUnitDiffOptions(unit, options)

  // Equal instants are zero before the time zones are compared
  if (slots0.epochNanoseconds === slots1.epochNanoseconds) {
    return 0
  }

  return compute(getCommonTimeZone(slots0.timeZone, slots1.timeZone), rounding)
}

// PlainDateTime
// -----------------------------------------------------------------------------
// Probing ignores the time of day, so these share PlainDate's date-only
// movement, with the endpoint expressed relative to the origin's midnight.

function diffDateTimeCalendarUnit(
  unit: YearMonthUnit,
  slots0: CalendarDateTimeFields & { calendar: CalendarImpl },
  slots1: CalendarDateTimeFields & { calendar: CalendarImpl },
  options?: UnitDiffOptions,
): number {
  const calendar = getCommonCalendar(slots0.calendar, slots1.calendar)
  return diffPlainRelativeUnit(
    unit,
    options,
    () => diffDateTimesExact(calendar, slots0, slots1, unit),
    createDateRelativeOps(calendar, slots0),
    computeEndEpochNanoFromMidnight(slots0, slots1),
  )
}

export function diffDateTimeWeeks(
  slots0: CalendarDateTimeFields & { calendar: CalendarImpl },
  slots1: CalendarDateTimeFields & { calendar: CalendarImpl },
  options?: UnitDiffOptions,
): number {
  getCommonCalendar(slots0.calendar, slots1.calendar)
  return diffPlainRelativeUnit(
    Unit.Week,
    options,
    // plain days are uniform, so the exact diff is nanosecond arithmetic
    () =>
      diffEpochNanosByDayWeekUnit(
        Unit.Week,
        isoDateTimeToEpochNano(slots0),
        isoDateTimeToEpochNano(slots1),
      ),
    createDateDayWeekOps(slots0),
    computeEndEpochNanoFromMidnight(slots0, slots1),
  )
}

export function diffDateTimeDays(
  slots0: CalendarDateTimeFields & { calendar: CalendarImpl },
  slots1: CalendarDateTimeFields & { calendar: CalendarImpl },
  options?: UnitDiffOptions,
): number {
  getCommonCalendar(slots0.calendar, slots1.calendar)
  return countEpochNanoDays(
    isoDateTimeToEpochNano(slots0),
    isoDateTimeToEpochNano(slots1),
    timeFieldsToNano(slots0),
    refineUnitDiffOptions(Unit.Day, options),
  )
}

// The endpoint in the frame of the origin's midnight, for date-only probing
function computeEndEpochNanoFromMidnight(
  isoDateTime0: CalendarDateTimeFields,
  isoDateTime1: CalendarDateTimeFields,
): bigint {
  return (
    isoDateTimeToEpochNano(isoDateTime1) -
    BigInt(timeFieldsToNano(isoDateTime0))
  )
}

// PlainDate
// -----------------------------------------------------------------------------

function diffDateCalendarUnit(
  unit: YearMonthUnit,
  slots0: CalendarDateFields & { calendar: CalendarImpl },
  slots1: CalendarDateFields & { calendar: CalendarImpl },
  options?: UnitDiffOptions,
): number {
  const calendar = getCommonCalendar(slots0.calendar, slots1.calendar)
  return diffPlainRelativeUnit(
    unit,
    options,
    () => diffCalendarDates(calendar, slots0, slots1, unit),
    createDateRelativeOps(calendar, slots0),
    isoDateToEpochNano(slots1),
  )
}

export function diffDateWeeks(
  slots0: CalendarDateFields & { calendar: CalendarImpl },
  slots1: CalendarDateFields & { calendar: CalendarImpl },
  options?: UnitDiffOptions,
): number {
  getCommonCalendar(slots0.calendar, slots1.calendar)
  return diffPlainRelativeUnit(
    Unit.Week,
    options,
    () => diffDatesByDayWeekUnit(true, slots0, slots1),
    createDateDayWeekOps(slots0),
    isoDateToEpochNano(slots1),
  )
}

export function diffDateDays(
  slots0: CalendarDateFields & { calendar: CalendarImpl },
  slots1: CalendarDateFields & { calendar: CalendarImpl },
  options?: UnitDiffOptions,
): number {
  getCommonCalendar(slots0.calendar, slots1.calendar)
  return countEpochNanoDays(
    isoDateToEpochNano(slots0),
    isoDateToEpochNano(slots1),
    0,
    refineUnitDiffOptions(Unit.Day, options),
  )
}

// PlainYearMonth
// -----------------------------------------------------------------------------

function diffYearMonthUnit(
  unit: YearMonthUnit,
  slots0: CalendarDateFields & { calendar: CalendarImpl },
  slots1: CalendarDateFields & { calendar: CalendarImpl },
  options?: UnitDiffOptions,
): number {
  const calendar = getCommonCalendar(slots0.calendar, slots1.calendar)
  return countYearMonthUnit(
    calendar,
    slots0,
    slots1,
    unit,
    refineUnitDiffOptions(unit, options),
  )
}

// Plain Composition
// -----------------------------------------------------------------------------

function diffPlainRelativeUnit(
  unit: Unit,
  options: UnitDiffOptions,
  diffExact: () => DurationFields,
  relativeOps: RelativeOps,
  endEpochNano: bigint,
): number {
  return countRelativeUnit(
    unit,
    { diffExact, relativeOps, endEpochNano },
    refineUnitDiffOptions(unit, options),
  )
}
