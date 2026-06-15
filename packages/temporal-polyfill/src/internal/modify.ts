import { type CalendarImpl } from './calendarImpl'
import { timeFieldDefaults } from './fieldNames'
import { TimeFields } from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import { OffsetDisambig } from './optionsModel'
import { ZonedEpochNanoFields, createZonedEpochNanoSlots } from './slots'
import {
  getMatchingInstantFor,
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
