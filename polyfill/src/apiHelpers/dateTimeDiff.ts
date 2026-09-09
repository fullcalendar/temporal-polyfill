import type { Temporal } from 'temporal-spec'
import { type CalendarImpl } from '../internal/calendarImpl'
import {
  diffDateRounded,
  diffDateTimeRounded,
  diffEpochNanosRounded,
  diffTimeRounded,
  diffYearMonthRounded,
  diffZonedDateTimeRounded,
} from '../internal/diff'
import { DurationFields } from '../internal/durationFields'
import { negateDurationFields } from '../internal/durationMath'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  TimeFields,
} from '../internal/fieldTypes'
import { RoundingModeEnum } from '../internal/optionsModel'
import { refineDiffOptions } from '../internal/optionsRoundingRefine'
import { getCommonCalendar } from '../internal/slotUtils'
import {
  EpochNanoFields,
  ZonedEpochNanoFields,
  createDurationSlots,
} from '../internal/slots'
import { TimeUnit, Unit } from '../internal/units'
import { NumberSign } from '../internal/utils'

// Shared API preparation keeps option reads and since's rounding inversion /
// result negation together. Arithmetic below this layer sees only parsed units.
export function diffInstants(
  invert: boolean,
  instantSlots0: EpochNanoFields,
  instantSlots1: EpochNanoFields,
  options?: Temporal.RoundingOptionsWithLargestUnit<Temporal.TimeUnit>,
): DurationFields & { sign: NumberSign } {
  const [largestUnit, smallestUnit, roundingInc, roundingMode] =
    refineDiffOptions(invert, options, Unit.Second, Unit.Hour) as [
      TimeUnit,
      TimeUnit,
      number,
      RoundingModeEnum,
    ]

  const durationFields = diffEpochNanosRounded(
    instantSlots0.epochNanoseconds,
    instantSlots1.epochNanoseconds,
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
  )

  return createDiffDurationSlots(invert, durationFields)
}

export function diffZonedDateTimes(
  invert: boolean,
  slots0: ZonedEpochNanoFields & { calendar: CalendarImpl },
  slots1: ZonedEpochNanoFields & { calendar: CalendarImpl },
  options?: Temporal.RoundingOptionsWithLargestUnit<
    Temporal.DateUnit | Temporal.TimeUnit
  >,
): DurationFields & { sign: NumberSign } {
  const calendar = getCommonCalendar(slots0.calendar, slots1.calendar)
  const [largestUnit, smallestUnit, roundingInc, roundingMode] =
    refineDiffOptions(invert, options, Unit.Hour)

  const durationFields = diffZonedDateTimeRounded(
    calendar,
    slots0,
    slots1,
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
  )

  return createDiffDurationSlots(invert, durationFields)
}

export function diffDateTimes(
  invert: boolean,
  plainDateTimeSlots0: CalendarDateTimeFields & { calendar: CalendarImpl },
  plainDateTimeSlots1: CalendarDateTimeFields & { calendar: CalendarImpl },
  options?: Temporal.RoundingOptionsWithLargestUnit<
    Temporal.DateUnit | Temporal.TimeUnit
  >,
): DurationFields & { sign: NumberSign } {
  const calendar = getCommonCalendar(
    plainDateTimeSlots0.calendar,
    plainDateTimeSlots1.calendar,
  )
  const [largestUnit, smallestUnit, roundingInc, roundingMode] =
    refineDiffOptions(invert, options, Unit.Day)

  const durationFields = diffDateTimeRounded(
    calendar,
    plainDateTimeSlots0,
    plainDateTimeSlots1,
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
  )

  return createDiffDurationSlots(invert, durationFields)
}

export function diffDates(
  invert: boolean,
  plainDateSlots0: CalendarDateFields & { calendar: CalendarImpl },
  plainDateSlots1: CalendarDateFields & { calendar: CalendarImpl },
  options?: Temporal.RoundingOptionsWithLargestUnit<Temporal.DateUnit>,
): DurationFields & { sign: NumberSign } {
  const calendar = getCommonCalendar(
    plainDateSlots0.calendar,
    plainDateSlots1.calendar,
  )
  const [largestUnit, smallestUnit, roundingInc, roundingMode] =
    refineDiffOptions(invert, options, Unit.Day, Unit.Year, Unit.Day)

  const durationFields = diffDateRounded(
    calendar,
    plainDateSlots0,
    plainDateSlots1,
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
  )

  return createDiffDurationSlots(invert, durationFields)
}

export function diffYearMonths(
  invert: boolean,
  plainYearMonthSlots0: CalendarDateFields & { calendar: CalendarImpl },
  plainYearMonthSlots1: CalendarDateFields & { calendar: CalendarImpl },
  options?: Temporal.RoundingOptionsWithLargestUnit<'year' | 'month'>,
): DurationFields & { sign: NumberSign } {
  const calendar = getCommonCalendar(
    plainYearMonthSlots0.calendar,
    plainYearMonthSlots1.calendar,
  )
  const [largestUnit, smallestUnit, roundingInc, roundingMode] =
    refineDiffOptions(invert, options, Unit.Year, Unit.Year, Unit.Month)

  const durationFields = diffYearMonthRounded(
    calendar,
    plainYearMonthSlots0,
    plainYearMonthSlots1,
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
  )

  return createDiffDurationSlots(invert, durationFields)
}

export function diffTimes(
  invert: boolean,
  plainTimeSlots0: TimeFields,
  plainTimeSlots1: TimeFields,
  options?: Temporal.RoundingOptionsWithLargestUnit<Temporal.TimeUnit>,
): DurationFields & { sign: NumberSign } {
  const [largestUnit, smallestUnit, roundingInc, roundingMode] =
    refineDiffOptions(invert, options, Unit.Hour, Unit.Hour)

  const durationFields = diffTimeRounded(
    plainTimeSlots0,
    plainTimeSlots1,
    largestUnit as TimeUnit,
    smallestUnit as TimeUnit,
    roundingInc,
    roundingMode,
  )

  return createDiffDurationSlots(invert, durationFields)
}

// Finish every public diff the same way: since negates the rounded fields,
// then slot construction computes the sign from that final duration.
function createDiffDurationSlots(
  invert: boolean,
  durationFields: DurationFields,
): DurationFields & { sign: NumberSign } {
  return createDurationSlots(
    invert ? negateDurationFields(durationFields) : durationFields,
  )
}
