import { isoCalendarId } from '../internal/calendarConfig'
import { createPropDescriptors, createTemporalNameDescriptors } from '../internal/utils'
import { InstantBranding, PlainDateBranding, PlainDateTimeBranding, PlainTimeBranding, ZonedDateTimeBranding } from '../genericApi/branding'

// public
import { CalendarSlot } from './calendarSlot'
import { TimeZoneSlot } from './timeZoneSlot'
import { Instant, createInstant } from './instant'
import { PlainDate, createPlainDate } from './plainDate'
import { PlainTime, createPlainTime } from './plainTime'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'
import { createTimeZoneOps } from './timeZoneOpsQuery'
import { getCurrentEpochNanoseconds, getCurrentIsoDate, getCurrentIsoDateTime, getCurrentIsoTime, getCurrentTimeZoneId } from '../genericApi/now'

export const Now = Object.defineProperties({}, {
  ...createTemporalNameDescriptors('Now'),
  ...createPropDescriptors({

    timeZoneId: getCurrentTimeZoneId,

    instant(): Instant {
      return createInstant({
        epochNanoseconds: getCurrentEpochNanoseconds(),
        branding: InstantBranding,
      })
    },

    zonedDateTime(
      calendar: CalendarSlot,
      timeZone: TimeZoneSlot = getCurrentTimeZoneId(),
    ): ZonedDateTime {
      return createZonedDateTime({
        epochNanoseconds: getCurrentEpochNanoseconds(),
        timeZone,
        calendar,
        branding: ZonedDateTimeBranding,
      })
    },

    zonedDateTimeISO(
      timeZone: TimeZoneSlot = getCurrentTimeZoneId(),
    ): ZonedDateTime {
      return createZonedDateTime({
        epochNanoseconds: getCurrentEpochNanoseconds(),
        timeZone,
        calendar: isoCalendarId,
        branding: ZonedDateTimeBranding,
      })
    },

    plainDateTime(
      calendar: CalendarSlot,
      timeZone: TimeZoneSlot = getCurrentTimeZoneId(),
    ): PlainDateTime {
      return createPlainDateTime({
        ...getCurrentIsoDateTime(createTimeZoneOps(timeZone)),
        calendar,
        branding: PlainDateTimeBranding,
      })
    },

    plainDateTimeISO(
      timeZone: TimeZoneSlot = getCurrentTimeZoneId(),
    ): PlainDateTime {
      return createPlainDateTime({
        ...getCurrentIsoDateTime(createTimeZoneOps(timeZone)),
        calendar: isoCalendarId,
        branding: PlainDateTimeBranding,
      })
    },

    plainDate(
      calendar: CalendarSlot,
      timeZone: TimeZoneSlot = getCurrentTimeZoneId(),
    ): PlainDate {
      return createPlainDate({
        ...getCurrentIsoDate(createTimeZoneOps(timeZone)),
        calendar,
        branding: PlainDateBranding,
      })
    },

    plainDateISO(
      timeZone: TimeZoneSlot = getCurrentTimeZoneId(),
    ): PlainDate {
      return createPlainDate({
        ...getCurrentIsoDate(createTimeZoneOps(timeZone)),
        calendar: isoCalendarId,
        branding: PlainDateBranding,
      })
    },

    plainTimeISO(
      timeZone: TimeZoneSlot = getCurrentTimeZoneId(),
    ): PlainTime {
      return createPlainTime({
        ...getCurrentIsoTime(createTimeZoneOps(timeZone)),
        branding: PlainTimeBranding,
      })
    },
  }),
})
