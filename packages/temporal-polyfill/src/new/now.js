import { nanoInMilli } from '../dateUtils/units'
import { isoCalendarId } from './calendarConfig'
import { queryCalendarOps } from './calendarOps'
import { createInstant } from './instant'
import { IntlDateTimeFormat } from './intlFormat'
import { pluckIsoDateInternals, pluckIsoDateTimeInternals, pluckIsoTimeFields } from './isoFields'
import { numberToLargeInt } from './largeInt'
import { createPlainDate } from './plainDate'
import { createPlainDateTime } from './plainDateTime'
import { createPlainTime } from './plainTime'
import { queryTimeZoneOps, zonedInternalsToIso } from './timeZoneOps'
import { createPropDescriptors, createTemporalNameDescriptors } from './utils'
import { createZonedDateTime } from './zonedDateTime'

export const Now = Object.defineProperties({}, {
  ...createTemporalNameDescriptors('Now'),
  ...createPropDescriptors({
    zonedDateTime: getCurrentZonedDateTime,
    zonedDateTimeISO: (timeZoneArg) => getCurrentZonedDateTime(isoCalendarId, timeZoneArg),
    plainDateTime: getCurrentPlainDateTime,
    plainDateTimeISO: (timeZoneArg) => getCurrentPlainDateTime(isoCalendarId, timeZoneArg),
    plainDate: getCurrentPlainDate,
    plainDateISO: (timeZoneArg) => getCurrentPlainDate(isoCalendarId, timeZoneArg),
    plainTimeISO: getCurrentPlainTime,
    instant: getCurrentInstant,
    timeZoneId: getCurrentTimeZoneId,
  }),
})

function getCurrentZonedDateTime(calendarArg, timeZoneArg) {
  return createZonedDateTime(
    getCurrentZonedDateTimeSlots(calendarArg, timeZoneArg),
  )
}

function getCurrentPlainDateTime(calendarArg, timeZoneArg) {
  return createPlainDateTime(
    getCurrentPlainDateTimeSlots(calendarArg, timeZoneArg),
  )
}

function getCurrentPlainDate(calendarArg, timeZoneArg) {
  return createPlainDate(
    pluckIsoDateInternals(getCurrentPlainDateTimeSlots(calendarArg, timeZoneArg)),
  )
}

function getCurrentPlainTime(timeZoneArg) {
  return createPlainTime(
    pluckIsoTimeFields(getCurrentPlainDateTimeSlots(isoCalendarId, timeZoneArg)),
  )
}

function getCurrentInstant() {
  return createInstant(getCurrentEpochNanoseconds())
}

function getCurrentPlainDateTimeSlots(calendarArg, timeZoneArg) {
  return pluckIsoDateTimeInternals(
    zonedInternalsToIso(getCurrentZonedDateTimeSlots(calendarArg, timeZoneArg)),
  )
}

function getCurrentZonedDateTimeSlots(
  calendarArg,
  timeZoneArg = getCurrentTimeZoneId(),
) {
  return {
    epochNanoseconds: getCurrentEpochNanoseconds(),
    calendar: queryCalendarOps(calendarArg),
    timeZone: queryTimeZoneOps(timeZoneArg),
  }
}

function getCurrentEpochNanoseconds() {
  return numberToLargeInt(Date.now()).mult(nanoInMilli)
}

// TimeZone
// --------
// TODO: use lazy cache util?

let queriedCurrentTimeZoneId

function getCurrentTimeZoneId() {
  return queriedCurrentTimeZoneId ?? (queriedCurrentTimeZoneId = queryCurrentTimeZoneId())
}

function queryCurrentTimeZoneId() {
  return new IntlDateTimeFormat().resolvedOptions().timeZone
}
