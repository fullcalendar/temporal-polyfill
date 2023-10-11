import { CalendarArg } from './calendar'
import { isoCalendarId } from './calendarConfig'
import { Instant, createInstant } from './instant'
import { OrigDateTimeFormat } from './intlFormat'
import { pluckIsoTimeFields } from './isoFields'
import { pluckIsoDateInternals, pluckIsoDateTimeInternals } from './isoInternals'
import { PlainDate, createPlainDate } from './plainDate'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { PlainTime, createPlainTime } from './plainTime'
import { TimeZoneArg } from './timeZone'
import { createPropDescriptors, createTemporalNameDescriptors } from './utils'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'
import { epochMilliToNano } from './isoMath'
import { DayTimeNano } from './dayTimeNano'
import { InstantBranding, IsoDateTimeSlots, PlainDateBranding, PlainDateTimeBranding, PlainTimeBranding, ZonedDateTimeBranding, ZonedEpochSlots } from './slots'
import { refineCalendarSlot } from './calendarSlot'
import { refineTimeZoneSlot, zonedInternalsToIso } from './timeZoneSlot'

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
  return createZonedDateTime({
    branding: ZonedDateTimeBranding,
    ...getCurrentZonedDateTimeSlots(calendarArg, timeZoneArg),
  })
}

function getCurrentPlainDateTime(
  calendarArg: CalendarArg,
  timeZoneArg: TimeZoneArg,
): PlainDateTime {
  return createPlainDateTime({
    ...getCurrentPlainDateTimeSlots(calendarArg, timeZoneArg),
    branding: PlainDateTimeBranding,
  })
}

function getCurrentPlainDate(
  calendarArg: CalendarArg,
  timeZoneArg: TimeZoneArg,
): PlainDate {
  return createPlainDate({
    ...pluckIsoDateInternals(getCurrentPlainDateTimeSlots(calendarArg, timeZoneArg)),
    branding: PlainDateBranding,
  })
}

function getCurrentPlainTime(timeZoneArg: TimeZoneArg): PlainTime {
  return createPlainTime({
    ...pluckIsoTimeFields(getCurrentPlainDateTimeSlots(isoCalendarId, timeZoneArg)),
    branding: PlainTimeBranding,
  })
}

function getCurrentInstant(): Instant {
  return createInstant({
    branding: InstantBranding,
    epochNanoseconds: getCurrentEpochNanoseconds(),
  })
}

function getCurrentPlainDateTimeSlots(
  calendarArg: CalendarArg,
  timeZoneArg: TimeZoneArg,
): IsoDateTimeSlots {
  return pluckIsoDateTimeInternals(
    zonedInternalsToIso(getCurrentZonedDateTimeSlots(calendarArg, timeZoneArg)),
  )
}

function getCurrentZonedDateTimeSlots(
  calendarArg: CalendarArg,
  timeZoneArg: TimeZoneArg = getCurrentTimeZoneId(),
): ZonedEpochSlots {
  return {
    epochNanoseconds: getCurrentEpochNanoseconds(),
    calendar: refineCalendarSlot(calendarArg),
    timeZone: refineTimeZoneSlot(timeZoneArg),
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
