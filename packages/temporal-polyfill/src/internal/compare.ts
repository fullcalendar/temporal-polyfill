import { compareDayTimeNanos } from './dayTimeNano'
import { Unit, givenFieldsToDayTimeNano } from './units'
import { NumSign } from './utils'
import { durationFieldNamesAsc } from './durationFields'
import { DiffOps } from './calendarOps'
import { TimeZoneOps } from './timeZoneOps'
import { DurationSlots, IdLike, InstantSlots, PlainDateSlots, PlainDateTimeSlots, PlainMonthDaySlots, PlainTimeSlots, PlainYearMonthSlots, ZonedDateTimeSlots, isIdLikeEqual, isTimeZoneSlotsEqual } from './slots'
import { RelativeToOptions, normalizeOptions } from './optionsRefine'
import { MarkerSlots, getLargestDurationUnit, createMarkerSystem, MarkerSystem, isDurationsEqual } from './durationMath'
import { compareIsoDateFields, compareIsoDateTimeFields, compareIsoTimeFields } from './epochAndTime'

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
  if (isDurationsEqual(durationSlots0, durationSlots1)) {
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
    throw new RangeError('need relativeTo')
  }

  const [marker, markerToEpochNano, moveMarker] = createMarkerSystem(getCalendarOps, getTimeZoneOps, markerSlots) as MarkerSystem<any>

  return compareDayTimeNanos(
    markerToEpochNano(moveMarker(marker, durationSlots0)),
    markerToEpochNano(moveMarker(marker, durationSlots1))
  )
}

export function compareInstants(
  instantSlots0: InstantSlots,
  instantSlots1: InstantSlots,
): NumSign {
  return compareDayTimeNanos(instantSlots0.epochNanoseconds, instantSlots1.epochNanoseconds)
}

export function instantsEqual(
  instantSlots0: InstantSlots,
  instantSlots1: InstantSlots,
): boolean {
  return !compareInstants(instantSlots0, instantSlots1)
}

export function plainDatesEqual<C extends IdLike>(
  plainDateSlots0: PlainDateSlots<C>,
  plainDateSlots1: PlainDateSlots<C>,
):  boolean {
  return !compareIsoDateFields(plainDateSlots0, plainDateSlots1) &&
    isIdLikeEqual(plainDateSlots0.calendar, plainDateSlots1.calendar)
}

export function plainDateTimesEqual<C extends IdLike>(
  plainDateTimeSlots0: PlainDateTimeSlots<C>,
  plainDateTimeSlots1: PlainDateTimeSlots<C>,
): boolean {
  return !compareIsoDateTimeFields(plainDateTimeSlots0, plainDateTimeSlots1) &&
    isIdLikeEqual(plainDateTimeSlots0.calendar, plainDateTimeSlots1.calendar)
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

export function plainYearMonthsEqual(
  plainYearMonthSlots0: PlainYearMonthSlots<IdLike>,
  plainYearMonthSlots1: PlainYearMonthSlots<IdLike>,
): boolean {
  return !compareIsoDateFields(plainYearMonthSlots0, plainYearMonthSlots1) &&
    isIdLikeEqual(plainYearMonthSlots0.calendar, plainYearMonthSlots1.calendar)
}

export function compareZonedDateTimes(
  zonedDateTimeSlots0: ZonedDateTimeSlots<unknown, unknown>,
  zonedDateTimeSlots1: ZonedDateTimeSlots<unknown, unknown>,
): NumSign {
  return compareDayTimeNanos(
    zonedDateTimeSlots0.epochNanoseconds,
    zonedDateTimeSlots1.epochNanoseconds,
  )
}

export function zonedDateTimesEqual<C extends IdLike, T extends IdLike>(
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, T>,
  zonedDateTimeSlots1: ZonedDateTimeSlots<C, T>,
): boolean {
  return !compareZonedDateTimes(zonedDateTimeSlots0, zonedDateTimeSlots1) &&
    isTimeZoneSlotsEqual(zonedDateTimeSlots0.timeZone, zonedDateTimeSlots1.timeZone) &&
    isIdLikeEqual(zonedDateTimeSlots0.calendar, zonedDateTimeSlots1.calendar)
}
