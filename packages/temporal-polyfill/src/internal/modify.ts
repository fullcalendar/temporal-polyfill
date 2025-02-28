import { isoCalendarId } from './calendarConfig'
import * as errorMessages from './errorMessages'
import { IsoTimeFields, isoTimeFieldDefaults } from './isoFields'
import { OffsetDisambig } from './options'
import {
  PlainDateSlots,
  PlainDateTimeSlots,
  ZonedDateTimeSlots,
  createPlainDateTimeSlots,
  createZonedDateTimeSlots,
} from './slots'
import { checkIsoDateTimeInBounds } from './timeMath'
import {
  TimeZoneOps,
  getMatchingInstantFor,
  zonedEpochSlotsToIso,
} from './timeZoneOps'

// ZonedDateTime with *
// -----------------------------------------------------------------------------

export function zonedDateTimeWithPlainTime(
  getTimeZoneOps: (timeZoneId: string) => TimeZoneOps,
  zonedDateTimeSlots: ZonedDateTimeSlots,
  plainTimeSlots: IsoTimeFields = isoTimeFieldDefaults,
): ZonedDateTimeSlots {
  const timeZoneId = zonedDateTimeSlots.timeZone
  const timeZoneOps = getTimeZoneOps(timeZoneId)

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
    timeZoneId,
    zonedDateTimeSlots.calendar,
  )
}

export function zonedDateTimeWithPlainDate(
  getTimeZoneOps: (timeZoneId: string) => TimeZoneOps,
  zonedDateTimeSlots: ZonedDateTimeSlots,
  plainDateSlots: PlainDateSlots,
): ZonedDateTimeSlots {
  const timeZoneId = zonedDateTimeSlots.timeZone
  const timeZoneOps = getTimeZoneOps(timeZoneId)

  const isoFields = {
    ...zonedEpochSlotsToIso(zonedDateTimeSlots, timeZoneOps),
    ...plainDateSlots,
  }
  const calendar = getPreferredCalendarId(
    zonedDateTimeSlots.calendar,
    plainDateSlots.calendar,
  )

  const epochNano = getMatchingInstantFor(
    timeZoneOps,
    isoFields,
    isoFields.offsetNanoseconds,
    OffsetDisambig.Prefer, // OffsetDisambig
  )

  return createZonedDateTimeSlots(epochNano, timeZoneId, calendar)
}

// PlainDateTime with *
// -----------------------------------------------------------------------------

export function plainDateTimeWithPlainTime(
  plainDateTimeSlots: PlainDateTimeSlots,
  plainTimeSlots: IsoTimeFields = isoTimeFieldDefaults,
): PlainDateTimeSlots {
  return createPlainDateTimeSlots(
    checkIsoDateTimeInBounds({
      ...plainDateTimeSlots,
      ...plainTimeSlots,
    }),
  )
}

/*
Only used by funcApi
*/
export function plainDateTimeWithPlainDate(
  plainDateTimeSlots: PlainDateTimeSlots,
  plainDateSlots: PlainDateSlots,
) {
  return createPlainDateTimeSlots(
    {
      ...plainDateTimeSlots,
      ...plainDateSlots,
    },
    getPreferredCalendarId(
      plainDateTimeSlots.calendar,
      plainDateSlots.calendar,
    ),
  )
}

// Anything with calendar/timeZone
// -----------------------------------------------------------------------------

export function slotsWithCalendarId<S extends { calendar: string }>(
  slots: S,
  calendarId: string,
): S {
  return { ...slots, calendar: calendarId }
}

export function slotsWithTimeZoneId<S extends { timeZone: string }>(
  slots: S,
  timeZoneId: string,
): S {
  return { ...slots, timeZone: timeZoneId }
}

// -----------------------------------------------------------------------------

function getPreferredCalendarId(a: string, b: string): string {
  if (a === b) {
    return a
  }

  if (a === b || a === isoCalendarId) {
    return b
  }
  if (b === isoCalendarId) {
    return a
  }

  throw new RangeError(errorMessages.mismatchingCalendars)
}
