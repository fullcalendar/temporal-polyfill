import { IsoTimeFields, isoTimeFieldDefaults } from './calendarIsoFields'
import { OffsetDisambig } from './options'
import { IdLike, PlainDateSlots, PlainDateTimeBranding, PlainDateTimeSlots, PlainTimeSlots, ZonedDateTimeBranding, ZonedDateTimeSlots, getPreferredCalendarSlot } from './slots'
import { TimeZoneOps, getMatchingInstantFor, zonedInternalsToIso } from './timeZoneOps'

// ZonedDateTime with *
// -------------------------------------------------------------------------------------------------

export function zonedDateTimeWithPlainTime<C, T>(
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  zonedDateTimeSlots: ZonedDateTimeSlots<C, T>,
  plainTimeSlots: IsoTimeFields = isoTimeFieldDefaults,
): ZonedDateTimeSlots<C, T> {
  const timeZoneSlot = zonedDateTimeSlots.timeZone
  const timeZoneOps = getTimeZoneOps(timeZoneSlot)

  const isoFields = {
    ...zonedInternalsToIso(zonedDateTimeSlots as any, timeZoneOps),
    ...plainTimeSlots,
  }

  const epochNano = getMatchingInstantFor(
    timeZoneOps,
    isoFields,
    isoFields.offsetNanoseconds,
    false, // hasZ
    OffsetDisambig.Prefer, // OffsetDisambig
    undefined, // EpochDisambig
    false, // fuzzy
  )

  return {
    branding: ZonedDateTimeBranding,
    epochNanoseconds: epochNano,
    timeZone: timeZoneSlot,
    calendar: zonedDateTimeSlots.calendar,
  }
}

export function zonedDateTimeWithPlainDate<C extends IdLike, T>(
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  zonedDateTimeSlots: ZonedDateTimeSlots<C, T>,
  plainDateSlots: PlainDateSlots<C>,
): ZonedDateTimeSlots<C, T> {
  const timeZoneSlot = zonedDateTimeSlots.timeZone
  const timeZoneOps = getTimeZoneOps(timeZoneSlot)

  const isoFields = {
    ...zonedInternalsToIso(zonedDateTimeSlots as any, timeZoneOps),
    ...plainDateSlots,
  }
  const calendar = getPreferredCalendarSlot(zonedDateTimeSlots.calendar, plainDateSlots.calendar)

  const epochNano = getMatchingInstantFor(
    timeZoneOps,
    isoFields,
    isoFields.offsetNanoseconds,
    false, // hasZ
    OffsetDisambig.Prefer, // OffsetDisambig
    undefined, // EpochDisambig
    false, // fuzzy
  )

  return {
    branding: ZonedDateTimeBranding,
    epochNanoseconds: epochNano,
    timeZone: timeZoneSlot,
    calendar,
  }
}

// PlainDateTime with *
// -------------------------------------------------------------------------------------------------

export function plainDateTimeWithPlainTime<C>(
  plainDateTimeSlots: PlainDateTimeSlots<C>,
  plainTimeSlots: IsoTimeFields = isoTimeFieldDefaults,
): PlainDateTimeSlots<C> {
  return {
    ...plainDateTimeSlots,
    ...plainTimeSlots,
    branding: PlainDateTimeBranding,
  }
}

export function plainDateTimeWithPlainDate<C extends IdLike>(
  plainDateTimeSlots: PlainDateTimeSlots<C>,
  plainDateSlots: PlainDateSlots<C>,
) {
  return {
    ...plainDateTimeSlots,
    ...plainDateSlots,
    // TODO: more DRY with other datetime types
    calendar: getPreferredCalendarSlot(plainDateTimeSlots.calendar, plainDateSlots.calendar),
    branding: PlainDateTimeBranding,
  }
}

// Anything with calendar/timeZone
// -------------------------------------------------------------------------------------------------

export function slotsWithCalendar<C, S extends { calendar: C }>(
  slots: S,
  calendarSlot: C,
): S {
  return { ...slots, calendar: calendarSlot }
}

export function slotsWithTimeZone<T, S extends { timeZone: T }>(
  slots: S,
  timeZoneSlot: T,
): S {
  return { ...slots, timeZone: timeZoneSlot }
}
