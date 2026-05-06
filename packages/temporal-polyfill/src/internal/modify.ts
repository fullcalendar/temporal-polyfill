import { BigNano } from './bigNano'
import * as errorMessages from './errorMessages'
import {
  type InternalCalendar,
  getInternalCalendarId,
  isoCalendar,
} from './externalCalendar'
import { timeFieldDefaults } from './fieldNames'
import { TimeFields } from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import { OffsetDisambig } from './optionsModel'
import {
  PlainDateSlots,
  PlainDateTimeSlots,
  ZonedDateTimeSlots,
  createPlainDateTimeSlots,
  createZonedDateTimeSlots,
} from './slots'
import type { TimeZoneImpl } from './timeZoneImpl'
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
  const { timeZone } = zonedDateTimeSlots
  const isoDateTime = zonedEpochSlotsToIso(zonedDateTimeSlots, timeZone)
  const { offsetNanoseconds } = isoDateTime

  const time = plainTimeFields || timeFieldDefaults

  let epochNano: BigNano

  if (plainTimeFields) {
    epochNano = getMatchingInstantFor(
      timeZone,
      combineDateAndTime(isoDateTime, time),
      offsetNanoseconds,
      OffsetDisambig.Prefer, // OffsetDisambig
    )
  } else {
    epochNano = getStartOfDayInstantFor(
      timeZone,
      combineDateAndTime(isoDateTime, time),
    )
  }

  return createZonedDateTimeSlots(
    epochNano,
    timeZone,
    zonedDateTimeSlots.calendar,
  )
}

export function zonedDateTimeWithPlainDate(
  zonedDateTimeSlots: ZonedDateTimeSlots,
  plainDateSlots: PlainDateSlots,
): ZonedDateTimeSlots {
  const { timeZone } = zonedDateTimeSlots
  const isoDateTime = zonedEpochSlotsToIso(zonedDateTimeSlots, timeZone)
  const { offsetNanoseconds } = isoDateTime

  const calendar = getPreferredCalendar(
    zonedDateTimeSlots.calendar,
    plainDateSlots.calendar,
  )

  const epochNano = getMatchingInstantFor(
    timeZone,
    combineDateAndTime(plainDateSlots, isoDateTime),
    offsetNanoseconds,
    OffsetDisambig.Prefer, // OffsetDisambig
  )

  return createZonedDateTimeSlots(epochNano, timeZone, calendar)
}

/*
Only used by funcApi
*/
export function plainDateTimeWithPlainDate(
  plainDateTimeSlots: PlainDateTimeSlots,
  plainDateSlots: PlainDateSlots,
) {
  return createPlainDateTimeSlots(
    combineDateAndTime(plainDateSlots, plainDateTimeSlots),
    getPreferredCalendar(plainDateTimeSlots.calendar, plainDateSlots.calendar),
  )
}

// Anything with calendar/timeZone
// -----------------------------------------------------------------------------

export function slotsWithCalendar<S extends object>(
  slots: S,
  calendar: InternalCalendar,
): S & { calendar: InternalCalendar } {
  return { ...slots, calendar }
}

export function slotsWithTimeZone<S extends { timeZone: TimeZoneImpl }>(
  slots: S,
  timeZone: TimeZoneImpl,
): S {
  return { ...slots, timeZone }
}

// -----------------------------------------------------------------------------

function getPreferredCalendar(
  a: InternalCalendar,
  b: InternalCalendar,
): InternalCalendar {
  if (a === b) {
    return a
  }

  if (a === isoCalendar) {
    return b
  }
  if (b === isoCalendar) {
    return a
  }

  if (getInternalCalendarId(a) === getInternalCalendarId(b)) {
    return b
  }

  throw new RangeError(errorMessages.mismatchingCalendars)
}
