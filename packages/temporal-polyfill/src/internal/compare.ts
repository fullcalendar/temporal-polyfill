import { compareBigNanos } from './bigNano'
import { durationFieldNamesAsc } from './durationFields'
import { durationFieldsToBigNano, getMaxDurationUnit } from './durationMath'
import * as errorMessages from './errorMessages'
import { CalendarDateFields, TimeFields } from './fieldTypes'
import { RelativeToOptions } from './optionsModel'
import { normalizeOptions } from './optionsNormalize'
import {
  RelativeToSlots,
  createMarkerToEpochNano,
  createMoveMarker,
  createRelativeOrigin,
  isUniformUnit,
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
import { isoDateToEpochMilli, timeFieldsToNano } from './timeMath'
import { getTimeZoneAtomic } from './timeZoneId'
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

  const [marker, timeZoneImpl] = createRelativeOrigin(relativeToSlots)
  const markerToEpochNano = createMarkerToEpochNano(timeZoneImpl)
  const moveMarker = createMoveMarker(timeZoneImpl, relativeToSlots.calendar)

  return compareBigNanos(
    markerToEpochNano(moveMarker(marker, durationSlots0)),
    markerToEpochNano(moveMarker(marker, durationSlots1)),
  )
}

// Low-Level Compare
// -----------------------------------------------------------------------------

export function compareIsoDateTimeFields(
  isoDate0: CalendarDateFields,
  time0: TimeFields,
  isoDate1: CalendarDateFields,
  time1: TimeFields,
): NumberSign {
  return (
    compareIsoDateFields(isoDate0, isoDate1) || compareTimeFields(time0, time1)
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
    !!isTimeZoneIdsEqual(
      zonedDateTimeSlots0.timeZone,
      zonedDateTimeSlots1.timeZone,
    ) &&
    zonedDateTimeSlots0.calendar === zonedDateTimeSlots1.calendar
  )
}

export function plainDateTimesEqual(
  plainDateTimeSlots0: PlainDateTimeSlots,
  plainDateTimeSlots1: PlainDateTimeSlots,
): boolean {
  return (
    !compareIsoDateTimeFields(
      plainDateTimeSlots0.isoDate,
      plainDateTimeSlots0.time,
      plainDateTimeSlots1.isoDate,
      plainDateTimeSlots1.time,
    ) && plainDateTimeSlots0.calendar === plainDateTimeSlots1.calendar
  )
}

export function plainDatesEqual(
  plainDateSlots0: PlainDateSlots,
  plainDateSlots1: PlainDateSlots,
): boolean {
  return (
    !compareIsoDateFields(plainDateSlots0.isoDate, plainDateSlots1.isoDate) &&
    plainDateSlots0.calendar === plainDateSlots1.calendar
  )
}

export function plainYearMonthsEqual(
  plainYearMonthSlots0: PlainYearMonthSlots,
  plainYearMonthSlots1: PlainYearMonthSlots,
): boolean {
  return (
    !compareIsoDateFields(
      plainYearMonthSlots0.isoDate,
      plainYearMonthSlots1.isoDate,
    ) && plainYearMonthSlots0.calendar === plainYearMonthSlots1.calendar
  )
}

export function plainMonthDaysEqual(
  plainMonthDaySlots0: PlainMonthDaySlots,
  plainMonthDaySlots1: PlainMonthDaySlots,
): boolean {
  return (
    !compareIsoDateFields(
      plainMonthDaySlots0.isoDate,
      plainMonthDaySlots1.isoDate,
    ) && plainMonthDaySlots0.calendar === plainMonthDaySlots1.calendar
  )
}

export function plainTimesEqual(
  plainTimeSlots0: PlainTimeSlots,
  plainTimeSlots1: PlainTimeSlots,
): boolean {
  return !compareTimeFields(plainTimeSlots0.time, plainTimeSlots1.time)
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
    return getTimeZoneAtomic(a) === getTimeZoneAtomic(b)
  } catch {}

  // If reaching here, there was an error, so NOT equal
}
