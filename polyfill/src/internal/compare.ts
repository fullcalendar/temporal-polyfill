import { type CalendarImpl } from './calendarImpl'
import { DurationFields, durationFieldNamesAsc } from './durationFields'
import { durationDayTimeToBigNano, getMaxDurationUnit } from './durationMath'
import { isoDateToEpochDays } from './epochMath'
import * as errorMessages from './errorMessages'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  TimeFields,
} from './fieldTypes'
import { normalizeOptions } from './optionsNormalize'
import {
  RelativeToSlots,
  createMarkerSpanOps,
  isUniformUnit,
  moveMarkerToEpochNano,
} from './relativeMath'
import { EpochNanoFields, ZonedEpochNanoFields } from './slots'
import type { RelativeToOptions } from './temporalSpecHelpers'
import { timeFieldsToNano } from './timeFieldMath'
import { Unit } from './units'
import {
  NumberSign,
  allPropsEqual,
  compareBigInts,
  compareNumbers,
  throwRangeError,
} from './utils'

// High-Level Compare
// -----------------------------------------------------------------------------

// Compares the epoch-nanosecond slots shared by Instant and ZonedDateTime.
export function compareZonedEpochSlots(
  zonedEpochSlots0: EpochNanoFields,
  zonedEpochSlots1: EpochNanoFields,
): NumberSign {
  return compareBigInts(
    zonedEpochSlots0.epochNanoseconds,
    zonedEpochSlots1.epochNanoseconds,
  )
}

export function compareDurations<RA>(
  refineRelativeTo: (relativeToArg?: RA) => RelativeToSlots | undefined,
  durationSlots0: DurationFields,
  durationSlots1: DurationFields,
  options?: RelativeToOptions<RA>,
): NumberSign {
  const normalOptions = normalizeOptions(options)
  const relativeToSlots = refineRelativeTo(normalOptions.relativeTo)
  const maxUnit = Math.max(
    getMaxDurationUnit(durationSlots0),
    getMaxDurationUnit(durationSlots1),
  ) as Unit

  // fast-path if fields identical
  if (allPropsEqual(durationFieldNamesAsc, durationSlots0, durationSlots1)) {
    return 0
  }

  if (isUniformUnit(maxUnit, relativeToSlots)) {
    return compareBigInts(
      durationDayTimeToBigNano(durationSlots0),
      durationDayTimeToBigNano(durationSlots1),
    )
  }

  if (!relativeToSlots) {
    throwRangeError(errorMessages.missingRelativeTo)
  }

  const markerSpanOps = createMarkerSpanOps(relativeToSlots)

  return compareBigInts(
    moveMarkerToEpochNano(markerSpanOps, durationSlots0),
    moveMarkerToEpochNano(markerSpanOps, durationSlots1),
  )
}

// Low-Level Compare
// -----------------------------------------------------------------------------

export function compareIsoDateTimeFields(
  isoDateTime0: CalendarDateTimeFields,
  isoDateTime1: CalendarDateTimeFields,
): NumberSign {
  return (
    compareIsoDateFields(isoDateTime0, isoDateTime1) ||
    compareTimeFields(isoDateTime0, isoDateTime1)
  )
}

export function compareIsoDateFields(
  isoFields0: CalendarDateFields,
  isoFields1: CalendarDateFields,
): NumberSign {
  return compareNumbers(
    isoDateToEpochDays(isoFields0),
    isoDateToEpochDays(isoFields1),
  )
}

export function compareTimeFields(
  isoFields0: TimeFields,
  isoFields1: TimeFields,
): NumberSign {
  return compareNumbers(
    timeFieldsToNano(isoFields0),
    timeFieldsToNano(isoFields1),
  )
}

// Is-equal
// -----------------------------------------------------------------------------

export function instantsEqual(
  instantSlots0: EpochNanoFields,
  instantSlots1: EpochNanoFields,
): boolean {
  return !compareZonedEpochSlots(instantSlots0, instantSlots1)
}

export function zonedDateTimesEqual(
  zonedDateTimeSlots0: ZonedEpochNanoFields & { calendar: CalendarImpl },
  zonedDateTimeSlots1: ZonedEpochNanoFields & { calendar: CalendarImpl },
): boolean {
  return (
    !compareZonedEpochSlots(zonedDateTimeSlots0, zonedDateTimeSlots1) &&
    zonedDateTimeSlots0.timeZone.compareKey ===
      zonedDateTimeSlots1.timeZone.compareKey &&
    zonedDateTimeSlots0.calendar === zonedDateTimeSlots1.calendar
  )
}

export function plainDateTimesEqual(
  plainDateTimeSlots0: CalendarDateTimeFields & { calendar: CalendarImpl },
  plainDateTimeSlots1: CalendarDateTimeFields & { calendar: CalendarImpl },
): boolean {
  return (
    !compareIsoDateTimeFields(plainDateTimeSlots0, plainDateTimeSlots1) &&
    plainDateTimeSlots0.calendar === plainDateTimeSlots1.calendar
  )
}

export function plainDatesEqual(
  plainDateSlots0: CalendarDateFields & { calendar: CalendarImpl },
  plainDateSlots1: CalendarDateFields & { calendar: CalendarImpl },
): boolean {
  return (
    !compareIsoDateFields(plainDateSlots0, plainDateSlots1) &&
    plainDateSlots0.calendar === plainDateSlots1.calendar
  )
}

export function plainYearMonthsEqual(
  plainYearMonthSlots0: CalendarDateFields & { calendar: CalendarImpl },
  plainYearMonthSlots1: CalendarDateFields & { calendar: CalendarImpl },
): boolean {
  return (
    !compareIsoDateFields(plainYearMonthSlots0, plainYearMonthSlots1) &&
    plainYearMonthSlots0.calendar === plainYearMonthSlots1.calendar
  )
}

export function plainMonthDaysEqual(
  plainMonthDaySlots0: CalendarDateFields & { calendar: CalendarImpl },
  plainMonthDaySlots1: CalendarDateFields & { calendar: CalendarImpl },
): boolean {
  return (
    !compareIsoDateFields(plainMonthDaySlots0, plainMonthDaySlots1) &&
    plainMonthDaySlots0.calendar === plainMonthDaySlots1.calendar
  )
}

export function plainTimesEqual(
  plainTimeSlots0: TimeFields,
  plainTimeSlots1: TimeFields,
): boolean {
  return !compareTimeFields(plainTimeSlots0, plainTimeSlots1)
}
