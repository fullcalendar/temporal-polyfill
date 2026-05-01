import { BigNano } from './bigNano'
import * as errorMessages from './errorMessages'
import { timeFieldDefaults } from './fieldNames'
import { TimeFields } from './fieldTypes'
import { isoCalendarId } from './intlCalendarConfig'
import { OffsetDisambig } from './optionsModel'
import {
  PlainDateSlots,
  PlainDateTimeSlots,
  ZonedDateTimeSlots,
  createPlainDateTimeSlots,
  createZonedDateTimeSlots,
} from './slots'
import { queryTimeZone } from './timeZoneImpl'
import {
  getMatchingInstantFor,
  getStartOfDayInstantFor,
  zonedEpochSlotsToIso,
} from './timeZoneMath'

// ZonedDateTime with *
// -----------------------------------------------------------------------------

export function zonedDateTimeWithPlainTime(
  zonedDateTimeSlots: ZonedDateTimeSlots,
  plainTimeFields: TimeFields | undefined,
): ZonedDateTimeSlots {
  const timeZoneId = zonedDateTimeSlots.timeZone
  const timeZoneImpl = queryTimeZone(timeZoneId)
  const { isoDate, offsetNanoseconds } = zonedEpochSlotsToIso(
    zonedDateTimeSlots,
    timeZoneImpl,
  )

  const time = plainTimeFields || timeFieldDefaults

  let epochNano: BigNano

  if (plainTimeFields) {
    epochNano = getMatchingInstantFor(
      timeZoneImpl,
      isoDate,
      time,
      offsetNanoseconds,
      OffsetDisambig.Prefer, // OffsetDisambig
    )
  } else {
    epochNano = getStartOfDayInstantFor(timeZoneImpl, isoDate, time)
  }

  return createZonedDateTimeSlots(
    epochNano,
    timeZoneId,
    zonedDateTimeSlots.calendar,
  )
}

export function zonedDateTimeWithPlainDate(
  zonedDateTimeSlots: ZonedDateTimeSlots,
  plainDateSlots: PlainDateSlots,
): ZonedDateTimeSlots {
  const timeZoneId = zonedDateTimeSlots.timeZone
  const timeZoneImpl = queryTimeZone(timeZoneId)
  const { time, offsetNanoseconds } = zonedEpochSlotsToIso(
    zonedDateTimeSlots,
    timeZoneImpl,
  )

  const calendar = getPreferredCalendarId(
    zonedDateTimeSlots.calendar,
    plainDateSlots.calendar,
  )

  const epochNano = getMatchingInstantFor(
    timeZoneImpl,
    plainDateSlots.isoDate,
    time,
    offsetNanoseconds,
    OffsetDisambig.Prefer, // OffsetDisambig
  )

  return createZonedDateTimeSlots(epochNano, timeZoneId, calendar)
}

/*
Only used by funcApi
*/
export function plainDateTimeWithPlainDate(
  plainDateTimeSlots: PlainDateTimeSlots,
  plainDateSlots: PlainDateSlots,
) {
  const time = plainDateTimeSlots.time
  return createPlainDateTimeSlots(
    plainDateSlots.isoDate,
    time,
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
