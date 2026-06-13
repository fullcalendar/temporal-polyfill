import {
  type CalendarImpl,
  getCalendarSlotId,
  isoCalendarImpl,
} from './calendarImpl'
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
import { throwRangeError } from './utils'

// ZonedDateTime with *
// -----------------------------------------------------------------------------

export function zonedDateTimeWithPlainTime(
  zonedDateTimeSlots: ZonedEpochNanoFields & { calendar: CalendarImpl },
  plainTimeFields: TimeFields | undefined,
): ZonedEpochNanoFields & { calendar: CalendarImpl } {
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
  zonedDateTimeSlots: ZonedEpochNanoFields & { calendar: CalendarImpl },
  plainDateSlots: CalendarDateFields & { calendar: CalendarImpl },
): ZonedEpochNanoFields & { calendar: CalendarImpl } {
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
  plainDateTimeSlots: CalendarDateTimeFields & { calendar: CalendarImpl },
  plainDateSlots: CalendarDateFields & { calendar: CalendarImpl },
) {
  return createDateTimeSlots(
    combineDateAndTime(plainDateSlots, plainDateTimeSlots),
    getPreferredCalendar(plainDateTimeSlots.calendar, plainDateSlots.calendar),
  )
}

// -----------------------------------------------------------------------------

function getPreferredCalendar(a: CalendarImpl, b: CalendarImpl): CalendarImpl {
  if (a === b) {
    return a
  }

  if (a === isoCalendarImpl) {
    return b
  }
  if (b === isoCalendarImpl) {
    return a
  }

  if (getCalendarSlotId(a) === getCalendarSlotId(b)) {
    return b
  }

  throwRangeError(errorMessages.mismatchingCalendars)
}
