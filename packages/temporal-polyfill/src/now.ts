import { CalendarArg } from './calendar'
import { isoCalendarId } from './calendarConfig'
import { queryCalendarOps } from './calendarOpsQuery'
import { Instant, createInstant } from './instant'
import { OrigDateTimeFormat } from './intlFormat'
import { pluckIsoTimeFields } from './isoFields'
import { IsoDateTimeInternals, pluckIsoDateInternals, pluckIsoDateTimeInternals } from './isoInternals'
import { PlainDate, createPlainDate } from './plainDate'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { PlainTime, createPlainTime } from './plainTime'
import { TimeZoneArg } from './timeZone'
import { queryTimeZoneOps, zonedInternalsToIso } from './timeZoneOps'
import { createPropDescriptors, createTemporalNameDescriptors } from './utils'
import { ZonedDateTime, ZonedInternals, createZonedDateTime } from './zonedDateTime'
import { epochMilliToNano } from './isoMath'
import { DayTimeNano } from './dayTimeNano'

export const Now = Object.defineProperties({}, {
  ...createTemporalNameDescriptors('Now'),
  ...createPropDescriptors({
    zonedDateTime: getCurrentZonedDateTime,
    zonedDateTimeISO(timeZoneArg: TimeZoneArg) {
      return getCurrentZonedDateTime(isoCalendarId, timeZoneArg)
    },
    plainDateTime: getCurrentPlainDateTime,
    plainDateTimeISO(timeZoneArg: TimeZoneArg) {
      return getCurrentPlainDateTime(isoCalendarId, timeZoneArg)
    },
    plainDate: getCurrentPlainDate,
    plainDateISO(timeZoneArg: TimeZoneArg) {
      return getCurrentPlainDate(isoCalendarId, timeZoneArg)
    },
    plainTimeISO: getCurrentPlainTime,
    instant: getCurrentInstant,
    timeZoneId: getCurrentTimeZoneId,
  }),
})

function getCurrentZonedDateTime(
  calendarArg: CalendarArg,
  timeZoneArg: TimeZoneArg
): ZonedDateTime {
  return createZonedDateTime(
    getCurrentZonedDateTimeSlots(calendarArg, timeZoneArg),
  )
}

function getCurrentPlainDateTime(
  calendarArg: CalendarArg,
  timeZoneArg: TimeZoneArg,
): PlainDateTime {
  return createPlainDateTime(
    getCurrentPlainDateTimeSlots(calendarArg, timeZoneArg),
  )
}

function getCurrentPlainDate(
  calendarArg: CalendarArg,
  timeZoneArg: TimeZoneArg,
): PlainDate {
  return createPlainDate(
    pluckIsoDateInternals(getCurrentPlainDateTimeSlots(calendarArg, timeZoneArg)),
  )
}

function getCurrentPlainTime(timeZoneArg: TimeZoneArg): PlainTime {
  return createPlainTime(
    pluckIsoTimeFields(getCurrentPlainDateTimeSlots(isoCalendarId, timeZoneArg)),
  )
}

function getCurrentInstant(): Instant {
  return createInstant(getCurrentEpochNanoseconds())
}

function getCurrentPlainDateTimeSlots(
  calendarArg: CalendarArg,
  timeZoneArg: TimeZoneArg,
): IsoDateTimeInternals {
  return pluckIsoDateTimeInternals(
    zonedInternalsToIso(getCurrentZonedDateTimeSlots(calendarArg, timeZoneArg)),
  )
}

function getCurrentZonedDateTimeSlots(
  calendarArg: CalendarArg,
  timeZoneArg: TimeZoneArg = getCurrentTimeZoneId(),
): ZonedInternals {
  return {
    epochNanoseconds: getCurrentEpochNanoseconds(),
    calendar: queryCalendarOps(calendarArg),
    timeZone: queryTimeZoneOps(timeZoneArg),
  }
}

function getCurrentEpochNanoseconds(): DayTimeNano {
  return epochMilliToNano(Date.now())
}

// TimeZone
// --------

let queriedCurrentTimeZoneId: string | undefined

function getCurrentTimeZoneId(): string {
  return queriedCurrentTimeZoneId ?? (queriedCurrentTimeZoneId = queryCurrentTimeZoneId())
}

function queryCurrentTimeZoneId(): string {
  return new OrigDateTimeFormat().resolvedOptions().timeZone
}
