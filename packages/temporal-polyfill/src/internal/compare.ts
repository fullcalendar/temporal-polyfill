import { compareBigNanos } from './bigNano'
import { durationFieldNamesAsc } from './durationFields'
import { durationFieldsToBigNano, getMaxDurationUnit } from './durationMath'
import { isoDateToEpochMilli } from './epochMath'
import * as errorMessages from './errorMessages'
import {
  type InternalCalendar,
  getInternalCalendarId,
} from './externalCalendar'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  TimeFields,
} from './fieldTypes'
import { RelativeToOptions } from './optionsModel'
import { normalizeOptions } from './optionsNormalize'
import {
  RelativeToSlots,
  createMarkerSpanOps,
  isUniformUnit,
  moveMarkerToEpochNano,
} from './relativeMath'
import {
  DurationSlots,
  InstantSlots,
  PlainDateSlots,
  PlainDateTimeSlots,
  PlainMonthDaySlots,
  PlainTimeSlots,
  PlainYearMonthSlots,
  ZonedDateTimeSlots,
} from './slots'
import { timeFieldsToNano } from './timeFieldMath'
import { resolveTimeZoneRecord } from './timeZoneId'
import { Unit } from './units'
import { NumberSign, allPropsEqual, compareNumbers } from './utils'

// High-Level Compare
// -----------------------------------------------------------------------------

export function compareInstants(
  instantSlots0: InstantSlots,
  instantSlots1: InstantSlots,
): NumberSign {
  return compareBigNanos(
    instantSlots0.epochNanoseconds,
    instantSlots1.epochNanoseconds,
  )
}

export function compareZonedDateTimes(
  zonedDateTimeSlots0: ZonedDateTimeSlots,
  zonedDateTimeSlots1: ZonedDateTimeSlots,
): NumberSign {
  return compareBigNanos(
    zonedDateTimeSlots0.epochNanoseconds,
    zonedDateTimeSlots1.epochNanoseconds,
  )
}

export function compareDurations<RA>(
  refineRelativeTo: (relativeToArg?: RA) => RelativeToSlots | undefined,
  durationSlots0: DurationSlots,
  durationSlots1: DurationSlots,
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
    return compareBigNanos(
      durationFieldsToBigNano(durationSlots0),
      durationFieldsToBigNano(durationSlots1),
    )
  }

  if (!relativeToSlots) {
    throw new RangeError(errorMessages.missingRelativeTo)
  }

  const markerSpanOps = createMarkerSpanOps(relativeToSlots)

  return compareBigNanos(
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
    isoDateToEpochMilli(isoFields0)!,
    isoDateToEpochMilli(isoFields1)!,
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
  instantSlots0: InstantSlots,
  instantSlots1: InstantSlots,
): boolean {
  return !compareInstants(instantSlots0, instantSlots1)
}

export function zonedDateTimesEqual(
  zonedDateTimeSlots0: ZonedDateTimeSlots,
  zonedDateTimeSlots1: ZonedDateTimeSlots,
): boolean {
  return (
    !compareZonedDateTimes(zonedDateTimeSlots0, zonedDateTimeSlots1) &&
    zonedDateTimeSlots0.timeZone.compareKey ===
      zonedDateTimeSlots1.timeZone.compareKey &&
    calendarsEqual(zonedDateTimeSlots0.calendar, zonedDateTimeSlots1.calendar)
  )
}

export function plainDateTimesEqual(
  plainDateTimeSlots0: PlainDateTimeSlots,
  plainDateTimeSlots1: PlainDateTimeSlots,
): boolean {
  return (
    !compareIsoDateTimeFields(plainDateTimeSlots0, plainDateTimeSlots1) &&
    calendarsEqual(plainDateTimeSlots0.calendar, plainDateTimeSlots1.calendar)
  )
}

export function plainDatesEqual(
  plainDateSlots0: PlainDateSlots,
  plainDateSlots1: PlainDateSlots,
): boolean {
  return (
    !compareIsoDateFields(plainDateSlots0, plainDateSlots1) &&
    calendarsEqual(plainDateSlots0.calendar, plainDateSlots1.calendar)
  )
}

export function plainYearMonthsEqual(
  plainYearMonthSlots0: PlainYearMonthSlots,
  plainYearMonthSlots1: PlainYearMonthSlots,
): boolean {
  return (
    !compareIsoDateFields(plainYearMonthSlots0, plainYearMonthSlots1) &&
    calendarsEqual(plainYearMonthSlots0.calendar, plainYearMonthSlots1.calendar)
  )
}

export function plainMonthDaysEqual(
  plainMonthDaySlots0: PlainMonthDaySlots,
  plainMonthDaySlots1: PlainMonthDaySlots,
): boolean {
  return (
    !compareIsoDateFields(plainMonthDaySlots0, plainMonthDaySlots1) &&
    calendarsEqual(plainMonthDaySlots0.calendar, plainMonthDaySlots1.calendar)
  )
}

function calendarsEqual(
  calendar0: InternalCalendar,
  calendar1: InternalCalendar,
): boolean {
  return (
    calendar0 === calendar1 ||
    (!!calendar0 &&
      !!calendar1 &&
      getInternalCalendarId(calendar0) === getInternalCalendarId(calendar1))
  )
}

export function plainTimesEqual(
  plainTimeSlots0: PlainTimeSlots,
  plainTimeSlots1: PlainTimeSlots,
): boolean {
  return !compareTimeFields(plainTimeSlots0, plainTimeSlots1)
}

// TimeZone
// -----------------------------------------------------------------------------

/*
NOTE: our minifier converts true/false to 1/0, which impares this function's
ability to return true/false literals. So, resign to returning loose truthy values
and make the caller responsible for casting to a boolean.
*/
export function isTimeZoneIdsEqual(
  a: string,
  b: string,
): number | boolean | undefined {
  if (a === b) {
    return 1
  }

  // If either is an unresolvable, return false
  // Unfortunately, can only be detected with try/catch because `new Intl.DateTimeFormat` throws
  try {
    return (
      resolveTimeZoneRecord(a).compareKey ===
      resolveTimeZoneRecord(b).compareKey
    )
  } catch {}

  // If reaching here, there was an error, so NOT equal
}
