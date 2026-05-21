import {
  type CalendarSlot,
  getCalendarSlotId,
  isoCalendar,
} from './calendarSlot'
import * as errorMessages from './errorMessages'
import { timeFieldDefaults } from './fieldNames'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  TimeFields,
} from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import { OffsetDisambig } from './optionsModel'
import {
  ZonedEpochNanoFields,
  createDateTimeSlots,
  createZonedEpochNanoSlots,
} from './slots'
import {
  getMatchingInstantFor,
  getStartOfDayInstantFor,
  zonedEpochSlotsToIso,
} from './timeZoneMath'

// ZonedDateTime with *
// -----------------------------------------------------------------------------

export function zonedDateTimeWithPlainTime(
  zonedDateTimeSlots: ZonedEpochNanoFields & { calendar: CalendarSlot },
  plainTimeFields: TimeFields | undefined,
): ZonedEpochNanoFields & { calendar: CalendarSlot } {
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

  return createZonedEpochNanoSlots(
    epochNano,
    timeZone,
    zonedDateTimeSlots.calendar,
  )
}

export function zonedDateTimeWithPlainDate(
  zonedDateTimeSlots: ZonedEpochNanoFields & { calendar: CalendarSlot },
  plainDateSlots: CalendarDateFields & { calendar: CalendarSlot },
): ZonedEpochNanoFields & { calendar: CalendarSlot } {
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

  return createZonedEpochNanoSlots(epochNano, timeZone, calendar)
}

/*
Only used by funcApi
*/
export function plainDateTimeWithPlainDate(
  plainDateTimeSlots: CalendarDateTimeFields & { calendar: CalendarSlot },
  plainDateSlots: CalendarDateFields & { calendar: CalendarSlot },
) {
  return createDateTimeSlots(
    combineDateAndTime(plainDateSlots, plainDateTimeSlots),
    getPreferredCalendar(plainDateTimeSlots.calendar, plainDateSlots.calendar),
  )
}

// -----------------------------------------------------------------------------

function getPreferredCalendar(a: CalendarSlot, b: CalendarSlot): CalendarSlot {
  if (a === b) {
    return a
  }

  if (a === isoCalendar) {
    return b
  }
  if (b === isoCalendar) {
    return a
  }

  if (getCalendarSlotId(a) === getCalendarSlotId(b)) {
    return b
  }

  throw new RangeError(errorMessages.mismatchingCalendars)
}
