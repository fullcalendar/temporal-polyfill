import { compareBigNanos } from './bigNano'
import { MoveOps } from './calendarOps'
import { durationFieldNamesAsc } from './durationFields'
import { getLargestDurationUnit } from './durationMath'
import * as errorMessages from './errorMessages'
import { IsoDateFields, IsoDateTimeFields, IsoTimeFields } from './isoFields'
import { moveRelativeMarker } from './move'
import { RelativeToOptions, normalizeOptions } from './optionsRefine'
import {
  RelativeToSlots,
  createRelativeSystem,
  relativeMarkerToEpochNano,
} from './relativeSystem'
import {
  DurationSlots,
  IdLike,
  InstantSlots,
  PlainDateSlots,
  PlainDateTimeSlots,
  PlainMonthDaySlots,
  PlainTimeSlots,
  PlainYearMonthSlots,
  ZonedDateTimeSlots,
  getId,
  isIdLikeEqual,
} from './slots'
import { isoTimeFieldsToNano, isoToEpochMilli } from './timeMath'
import { getTimeZoneAtomic } from './timeZoneId'
import { TimeZoneOps } from './timeZoneOps'
import { Unit, givenFieldsToBigNano } from './units'
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

export function compareZonedDateTimes<C, T>(
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, T>,
  zonedDateTimeSlots1: ZonedDateTimeSlots<C, T>,
): NumberSign {
  return compareBigNanos(
    zonedDateTimeSlots0.epochNanoseconds,
    zonedDateTimeSlots1.epochNanoseconds,
  )
}

export function compareDurations<RA, C, T>(
  refineRelativeTo: (relativeToArg?: RA) => RelativeToSlots<C, T> | undefined,
  getCalendarOps: (calendarSlot: C) => MoveOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  durationSlots0: DurationSlots,
  durationSlots1: DurationSlots,
  options?: RelativeToOptions<RA>,
): NumberSign {
  const normalOptions = normalizeOptions(options)
  const relativeToSlots = refineRelativeTo(normalOptions.relativeTo)
  const largestUnit = Math.max(
    getLargestDurationUnit(durationSlots0),
    getLargestDurationUnit(durationSlots1),
  ) as Unit

  // fast-path if fields identical
  if (allPropsEqual(durationFieldNamesAsc, durationSlots0, durationSlots1)) {
    return 0
  }

  if (
    largestUnit < Unit.Day ||
    (largestUnit === Unit.Day &&
      // has uniform days?
      !(relativeToSlots && (relativeToSlots as any).epochNanoseconds))
  ) {
    return compareBigNanos(
      givenFieldsToBigNano(durationSlots0, Unit.Day, durationFieldNamesAsc),
      givenFieldsToBigNano(durationSlots1, Unit.Day, durationFieldNamesAsc),
    )
  }

  if (!relativeToSlots) {
    throw new RangeError(errorMessages.missingRelativeTo)
  }

  const [marker, calendarOps, timeZoneOps] = createRelativeSystem(
    getCalendarOps,
    getTimeZoneOps,
    relativeToSlots,
  )

  return compareBigNanos(
    relativeMarkerToEpochNano(
      moveRelativeMarker(durationSlots0, marker, calendarOps, timeZoneOps),
      timeZoneOps,
    ),
    relativeMarkerToEpochNano(
      moveRelativeMarker(durationSlots1, marker, calendarOps, timeZoneOps),
      timeZoneOps,
    ),
  )
}

// Low-Level Compare
// -----------------------------------------------------------------------------

export function compareIsoDateTimeFields(
  isoFields0: IsoDateTimeFields,
  isoFields1: IsoDateTimeFields,
): NumberSign {
  return (
    compareIsoDateFields(isoFields0, isoFields1) ||
    compareIsoTimeFields(isoFields0, isoFields1)
  )
}

export function compareIsoDateFields(
  isoFields0: IsoDateFields,
  isoFields1: IsoDateFields,
): NumberSign {
  return compareNumbers(
    isoToEpochMilli(isoFields0)!,
    isoToEpochMilli(isoFields1)!,
  )
}

export function compareIsoTimeFields(
  isoFields0: IsoTimeFields,
  isoFields1: IsoTimeFields,
): NumberSign {
  return compareNumbers(
    isoTimeFieldsToNano(isoFields0),
    isoTimeFieldsToNano(isoFields1),
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

export function zonedDateTimesEqual<C extends IdLike, T extends IdLike>(
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, T>,
  zonedDateTimeSlots1: ZonedDateTimeSlots<C, T>,
): boolean {
  return (
    !compareZonedDateTimes(zonedDateTimeSlots0, zonedDateTimeSlots1) &&
    !!isTimeZoneSlotsEqual(
      zonedDateTimeSlots0.timeZone,
      zonedDateTimeSlots1.timeZone,
    ) &&
    isIdLikeEqual(zonedDateTimeSlots0.calendar, zonedDateTimeSlots1.calendar)
  )
}

export function plainDateTimesEqual<C extends IdLike>(
  plainDateTimeSlots0: PlainDateTimeSlots<C>,
  plainDateTimeSlots1: PlainDateTimeSlots<C>,
): boolean {
  return (
    !compareIsoDateTimeFields(plainDateTimeSlots0, plainDateTimeSlots1) &&
    isIdLikeEqual(plainDateTimeSlots0.calendar, plainDateTimeSlots1.calendar)
  )
}

export function plainDatesEqual<C extends IdLike>(
  plainDateSlots0: PlainDateSlots<C>,
  plainDateSlots1: PlainDateSlots<C>,
): boolean {
  return (
    !compareIsoDateFields(plainDateSlots0, plainDateSlots1) &&
    isIdLikeEqual(plainDateSlots0.calendar, plainDateSlots1.calendar)
  )
}

export function plainYearMonthsEqual<C extends IdLike>(
  plainYearMonthSlots0: PlainYearMonthSlots<C>,
  plainYearMonthSlots1: PlainYearMonthSlots<C>,
): boolean {
  return (
    !compareIsoDateFields(plainYearMonthSlots0, plainYearMonthSlots1) &&
    isIdLikeEqual(plainYearMonthSlots0.calendar, plainYearMonthSlots1.calendar)
  )
}

export function plainMonthDaysEqual<C extends IdLike>(
  plainMonthDaySlots0: PlainMonthDaySlots<C>,
  plainMonthDaySlots1: PlainMonthDaySlots<C>,
): boolean {
  return (
    !compareIsoDateFields(plainMonthDaySlots0, plainMonthDaySlots1) &&
    isIdLikeEqual(plainMonthDaySlots0.calendar, plainMonthDaySlots1.calendar)
  )
}

export function plainTimesEqual(
  plainTimeSlots0: PlainTimeSlots,
  plainTimeSlots1: PlainTimeSlots,
): boolean {
  return !compareIsoTimeFields(plainTimeSlots0, plainTimeSlots1)
}

// TimeZone
// -----------------------------------------------------------------------------

/*
NOTE: our minifier converts true/false to 1/0, which impares this function's
ability to return true/false literals. So, resign to returning loose truthy values
and make the caller responsible for casting to a boolean.
*/
export function isTimeZoneSlotsEqual(
  a: IdLike,
  b: IdLike,
): number | boolean | undefined {
  if (a === b) {
    return 1
  }

  const aId = getId(a)
  const bId = getId(b)

  if (aId === bId) {
    return 1
  }

  // If either is an unresolvable, return false
  // Unfortunately, can only be detected with try/catch because `new Intl.DateTimeFormat` throws
  try {
    return getTimeZoneAtomic(aId) === getTimeZoneAtomic(bId)
  } catch {}

  // If reaching here, there was an error, so NOT equal
}
