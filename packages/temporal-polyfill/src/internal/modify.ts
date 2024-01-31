import { isoCalendarId } from './calendarConfig'
import * as errorMessages from './errorMessages'
import { IsoTimeFields, isoTimeFieldDefaults } from './isoFields'
import { OffsetDisambig } from './options'
import {
  IdLike,
  PlainDateSlots,
  PlainDateTimeSlots,
  ZonedDateTimeSlots,
  createPlainDateTimeSlots,
  createZonedDateTimeSlots,
  getId,
} from './slots'
import {
  TimeZoneOps,
  getMatchingInstantFor,
  zonedEpochSlotsToIso,
} from './timeZoneOps'

// ZonedDateTime with *
// -----------------------------------------------------------------------------

export function zonedDateTimeWithPlainTime<C, T>(
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  zonedDateTimeSlots: ZonedDateTimeSlots<C, T>,
  plainTimeSlots: IsoTimeFields = isoTimeFieldDefaults,
): ZonedDateTimeSlots<C, T> {
  const timeZoneSlot = zonedDateTimeSlots.timeZone
  const timeZoneOps = getTimeZoneOps(timeZoneSlot)

  const isoFields = {
    ...zonedEpochSlotsToIso(zonedDateTimeSlots, timeZoneOps),
    ...plainTimeSlots,
  }

  const epochNano = getMatchingInstantFor(
    timeZoneOps,
    isoFields,
    isoFields.offsetNanoseconds,
    OffsetDisambig.Prefer, // OffsetDisambig
  )

  return createZonedDateTimeSlots(
    epochNano,
    timeZoneSlot,
    zonedDateTimeSlots.calendar,
  )
}

export function zonedDateTimeWithPlainDate<C extends IdLike, T>(
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  zonedDateTimeSlots: ZonedDateTimeSlots<C, T>,
  plainDateSlots: PlainDateSlots<C>,
): ZonedDateTimeSlots<C, T> {
  const timeZoneSlot = zonedDateTimeSlots.timeZone
  const timeZoneOps = getTimeZoneOps(timeZoneSlot)

  const isoFields = {
    ...zonedEpochSlotsToIso(zonedDateTimeSlots, timeZoneOps),
    ...plainDateSlots,
  }
  const calendar = getPreferredCalendarSlot(
    zonedDateTimeSlots.calendar,
    plainDateSlots.calendar,
  )

  const epochNano = getMatchingInstantFor(
    timeZoneOps,
    isoFields,
    isoFields.offsetNanoseconds,
    OffsetDisambig.Prefer, // OffsetDisambig
  )

  return createZonedDateTimeSlots(epochNano, timeZoneSlot, calendar)
}

// PlainDateTime with *
// -----------------------------------------------------------------------------

export function plainDateTimeWithPlainTime<C>(
  plainDateTimeSlots: PlainDateTimeSlots<C>,
  plainTimeSlots: IsoTimeFields = isoTimeFieldDefaults,
): PlainDateTimeSlots<C> {
  return createPlainDateTimeSlots({
    ...plainDateTimeSlots,
    ...plainTimeSlots,
  })
}

export function plainDateTimeWithPlainDate<C extends IdLike>(
  plainDateTimeSlots: PlainDateTimeSlots<C>,
  plainDateSlots: PlainDateSlots<C>,
) {
  return createPlainDateTimeSlots(
    {
      ...plainDateTimeSlots,
      ...plainDateSlots,
    },
    getPreferredCalendarSlot(
      plainDateTimeSlots.calendar,
      plainDateSlots.calendar,
    ),
  )
}

// Anything with calendar/timeZone
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------

function getPreferredCalendarSlot<C extends IdLike>(a: C, b: C): C {
  if (a === b) {
    return a
  }

  const aId = getId(a)
  const bId = getId(b)

  if (aId === bId || aId === isoCalendarId) {
    return b
  }
  if (bId === isoCalendarId) {
    return a
  }

  throw new RangeError(errorMessages.mismatchingCalendars)
}
