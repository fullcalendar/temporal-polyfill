import { isoCalendarId } from '../internal/calendarConfig'
import { OrigDateTimeFormat } from '../internal/intlFormat'
import { pluckIsoTimeFields } from '../internal/isoFields'
import { createPropDescriptors, createTemporalNameDescriptors } from '../internal/utils'
import { epochMilliToNano } from '../internal/isoMath'
import { DayTimeNano } from '../internal/dayTimeNano'

// public
import { InstantBranding, IsoDateTimeSlots, PlainDateBranding, PlainDateTimeBranding, PlainTimeBranding, ZonedDateTimeBranding, ZonedEpochSlots, pluckIsoDateInternals, pluckIsoDateTimeInternals } from './slots'
import { refineCalendarSlot } from './calendarSlot'
import { refineTimeZoneSlot } from './timeZoneSlot'
import { zonedInternalsToIso } from './zonedInternalsToIso'
import { CalendarArg } from './calendar'
import { Instant, createInstant } from './instant'
import { PlainDate, createPlainDate } from './plainDate'
import { PlainTime, createPlainTime } from './plainTime'
import { TimeZoneArg } from './timeZone'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'

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
