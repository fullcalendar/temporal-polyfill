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
  const newIsoDateTime = combineDateAndTime(isoDateTime, time)

  // The new wall-clock time resolves on its own, as 'compatible'. The receiver's
  // offset doesn't influence which occurrence of a repeated hour is chosen,
  // unlike ZonedDateTime#with, whose offset option defaults to 'prefer'.
  const epochNano = plainTimeFields
    ? getSingleInstantFor(timeZone, newIsoDateTime)
    : getStartOfDayInstantFor(timeZone, newIsoDateTime)

  return createZonedEpochNanoSlots(
    epochNano,
    timeZone,
    zonedDateTimeSlots.calendar,
  )
}
