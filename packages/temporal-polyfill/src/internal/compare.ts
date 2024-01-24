import { compareDayTimeNanos } from './dayTimeNano'
import { Unit, givenFieldsToDayTimeNano } from './units'
import { NumSign, allFieldsEqual, compareNumbers } from './utils'
import { durationFieldNamesAsc } from './durationFields'
import { DiffOps } from './calendarOps'
import { TimeZoneOps } from './timeZoneOps'
import { DurationSlots, IdLike, InstantSlots, PlainDateSlots, PlainDateTimeSlots, PlainMonthDaySlots, PlainTimeSlots, PlainYearMonthSlots, ZonedDateTimeSlots, isIdLikeEqual, isTimeZoneSlotsEqual } from './slots'
import { RelativeToOptions, normalizeOptions } from './optionsRefine'
import { MarkerSlots, getLargestDurationUnit, createMarkerSystem, MarkerSystem } from './durationMath'
import { isoTimeFieldsToNano, isoToEpochMilli } from './epochAndTime'
import { IsoDateFields, IsoDateTimeFields, IsoTimeFields } from './calendarIsoFields'
import * as errorMessages from './errorMessages'

// High-Level Compare
// -------------------------------------------------------------------------------------------------

export function compareInstants(
  instantSlots0: InstantSlots,
  instantSlots1: InstantSlots,
): NumSign {
  return compareDayTimeNanos(instantSlots0.epochNanoseconds, instantSlots1.epochNanoseconds)
}

export function compareZonedDateTimes<C, T>(
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, T>,
  zonedDateTimeSlots1: ZonedDateTimeSlots<C, T>,
): NumSign {
  return compareDayTimeNanos(
    zonedDateTimeSlots0.epochNanoseconds,
    zonedDateTimeSlots1.epochNanoseconds,
  )
}

export function compareDurations<RA, C, T>(
  refineRelativeTo: (relativeToArg: RA) => MarkerSlots<C, T> | undefined,
  getCalendarOps: (calendarSlot: C) => DiffOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  durationSlots0: DurationSlots,
  durationSlots1: DurationSlots,
  options?: RelativeToOptions<RA>
): NumSign {
  const normalOptions = normalizeOptions(options)
  const markerSlots = refineRelativeTo(normalOptions.relativeTo)
  const largestUnit = Math.max(
    getLargestDurationUnit(durationSlots0),
    getLargestDurationUnit(durationSlots1)
  ) as Unit

  // fast-path if fields identical
  if (allFieldsEqual(durationFieldNamesAsc, durationSlots0, durationSlots1)) {
    return 0
  }

  if (largestUnit < Unit.Day || (
    largestUnit === Unit.Day &&
    // has uniform days?
    !(markerSlots && (markerSlots as any).epochNanoseconds)
  )) {
    return compareDayTimeNanos(
      givenFieldsToDayTimeNano(durationSlots0, Unit.Day, durationFieldNamesAsc),
      givenFieldsToDayTimeNano(durationSlots1, Unit.Day, durationFieldNamesAsc)
    )
  }

  if (!markerSlots) {
    throw new RangeError(errorMessages.missingRelativeTo)
  }

  const [marker, markerToEpochNano, moveMarker] = createMarkerSystem(getCalendarOps, getTimeZoneOps, markerSlots) as MarkerSystem<any>

  return compareDayTimeNanos(
    markerToEpochNano(moveMarker(marker, durationSlots0)),
    markerToEpochNano(moveMarker(marker, durationSlots1))
  )
}

// Low-Level Compare
// -------------------------------------------------------------------------------------------------

export function compareIsoDateTimeFields(
  isoFields0: IsoDateTimeFields,
  isoFields1: IsoDateTimeFields,
): NumSign {
  return compareIsoDateFields(isoFields0, isoFields1) ||
    compareIsoTimeFields(isoFields0, isoFields1)
}

export function compareIsoDateFields(
  isoFields0: IsoDateFields,
  isoFields1: IsoDateFields,
): NumSign {
  return compareNumbers(
    isoToEpochMilli(isoFields0)!,
    isoToEpochMilli(isoFields1)!
  )
}

export function compareIsoTimeFields(
  isoFields0: IsoTimeFields,
  isoFields1: IsoTimeFields,
): NumSign {
  return compareNumbers(
    isoTimeFieldsToNano(isoFields0),
    isoTimeFieldsToNano(isoFields1),
  )
}

// Is-equal
// -------------------------------------------------------------------------------------------------

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
  return !compareZonedDateTimes(zonedDateTimeSlots0, zonedDateTimeSlots1) &&
    isTimeZoneSlotsEqual(zonedDateTimeSlots0.timeZone, zonedDateTimeSlots1.timeZone) &&
    isIdLikeEqual(zonedDateTimeSlots0.calendar, zonedDateTimeSlots1.calendar)
}

export function plainDateTimesEqual<C extends IdLike>(
  plainDateTimeSlots0: PlainDateTimeSlots<C>,
  plainDateTimeSlots1: PlainDateTimeSlots<C>,
): boolean {
  return !compareIsoDateTimeFields(plainDateTimeSlots0, plainDateTimeSlots1) &&
    isIdLikeEqual(plainDateTimeSlots0.calendar, plainDateTimeSlots1.calendar)
}

export function plainDatesEqual<C extends IdLike>(
  plainDateSlots0: PlainDateSlots<C>,
  plainDateSlots1: PlainDateSlots<C>,
): boolean {
  return !compareIsoDateFields(plainDateSlots0, plainDateSlots1) &&
    isIdLikeEqual(plainDateSlots0.calendar, plainDateSlots1.calendar)
}

export function plainYearMonthsEqual<C extends IdLike>(
  plainYearMonthSlots0: PlainYearMonthSlots<C>,
  plainYearMonthSlots1: PlainYearMonthSlots<C>,
): boolean {
  return !compareIsoDateFields(plainYearMonthSlots0, plainYearMonthSlots1) &&
    isIdLikeEqual(plainYearMonthSlots0.calendar, plainYearMonthSlots1.calendar)
}

export function plainMonthDaysEqual<C extends IdLike>(
  plainMonthDaySlots0: PlainMonthDaySlots<C>,
  plainMonthDaySlots1: PlainMonthDaySlots<C>,
): boolean {
  return !compareIsoDateFields(plainMonthDaySlots0, plainMonthDaySlots1) &&
    isIdLikeEqual(plainMonthDaySlots0.calendar, plainMonthDaySlots1.calendar)
}

export function plainTimesEqual(
  plainTimeSlots0: PlainTimeSlots,
  plainTimeSlots1: PlainTimeSlots,
): boolean {
  return !compareIsoTimeFields(plainTimeSlots0, plainTimeSlots1)
}
