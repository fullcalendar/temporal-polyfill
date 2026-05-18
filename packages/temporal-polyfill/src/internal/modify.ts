import * as errorMessages from './errorMessages'
import {
  type InternalCalendar,
  getInternalCalendarId,
  isoCalendar,
} from './externalCalendar'
import { timeFieldDefaults } from './fieldNames'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  TimeFields,
} from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import { OffsetDisambig } from './optionsModel'
import {
  EpochAndZoneSlots,
  ZonedDateTimeSlots,
  createPlainDateTimeSlots,
  createZonedDateTimeSlots,
} from './slots'
import {
  getMatchingInstantFor,
  getStartOfDayInstantFor,
  zonedEpochSlotsToIso,
} from './timeZoneMath'

// ZonedDateTime with *
// -----------------------------------------------------------------------------

export function zonedDateTimeWithPlainTime(
  zonedDateTimeSlots: EpochAndZoneSlots & { calendar: InternalCalendar },
  plainTimeFields: TimeFields | undefined,
): ZonedDateTimeSlots {
  const { timeZone } = zonedDateTimeSlots
  const isoDateTime = zonedEpochSlotsToIso(zonedDateTimeSlots, timeZone)
  const { offsetNanoseconds } = isoDateTime

  const time = plainTimeFields || timeFieldDefaults

  let epochNano: bigint

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
  zonedDateTimeSlots: EpochAndZoneSlots & { calendar: InternalCalendar },
  plainDateSlots: CalendarDateFields & { calendar: InternalCalendar },
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
  plainDateTimeSlots: CalendarDateTimeFields & { calendar: InternalCalendar },
  plainDateSlots: CalendarDateFields & { calendar: InternalCalendar },
) {
  return createPlainDateTimeSlots(
    combineDateAndTime(plainDateSlots, plainDateTimeSlots),
    getPreferredCalendar(plainDateTimeSlots.calendar, plainDateSlots.calendar),
  )
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
