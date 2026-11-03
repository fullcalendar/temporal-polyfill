import { type CalendarImpl } from './calendarImpl'
import { timeFieldDefaults } from './fieldNames'
import { TimeFields } from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import { ZonedEpochNanoFields, createZonedEpochNanoSlots } from './slots'
import {
  getSingleInstantFor,
  getStartOfDayInstantFor,
  zonedEpochSlotsToIso,
} from './timeZoneMath'

// ZonedDateTime with *
// -----------------------------------------------------------------------------

export function zonedDateTimeWithPlainTime(
  zonedDateTimeSlots: ZonedEpochNanoFields & { calendar: CalendarImpl },
  plainTimeFields: TimeFields | undefined,
): ZonedEpochNanoFields & { calendar: CalendarImpl } {
  const { timeZone } = zonedDateTimeSlots
  const isoDateTime = zonedEpochSlotsToIso(zonedDateTimeSlots)

  const time = plainTimeFields || timeFieldDefaults

  let epochNano: bigint

  if (plainTimeFields) {
    epochNano = getSingleInstantFor(
      timeZone,
      combineDateAndTime(isoDateTime, time),
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
