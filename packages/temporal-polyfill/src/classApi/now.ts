import { isoCalendarId } from '../internal/calendarConfig'
import { createPropDescriptors, createTemporalNameDescriptors } from '../internal/utils'
import { CalendarSlot, refineCalendarSlot } from './slotsForClasses'
import { TimeZoneSlot, refineTimeZoneSlot } from './slotsForClasses'
import { Instant, createInstant } from './instant'
import { PlainDate, createPlainDate } from './plainDate'
import { PlainTime, createPlainTime } from './plainTime'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'
import { createSimpleTimeZoneOps } from './timeZoneOpsQuery'
import { getCurrentEpochNanoseconds, getCurrentIsoDate, getCurrentIsoDateTime, getCurrentIsoTime, getCurrentTimeZoneId } from '../internal/current'
import { InstantBranding, PlainDateBranding, PlainDateTimeBranding, PlainTimeBranding, ZonedDateTimeBranding } from '../internal/slots'

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
        timeZone: refineTimeZoneSlot(timeZone),
        calendar: refineCalendarSlot(calendar),
        branding: ZonedDateTimeBranding,
      })
    },

    zonedDateTimeISO(
      timeZone: TimeZoneSlot = getCurrentTimeZoneId(),
    ): ZonedDateTime {
      return createZonedDateTime({
        epochNanoseconds: getCurrentEpochNanoseconds(),
        timeZone: refineTimeZoneSlot(timeZone),
        calendar: isoCalendarId,
        branding: ZonedDateTimeBranding,
      })
    },

    plainDateTime(
      calendar: CalendarSlot,
      timeZone: TimeZoneSlot = getCurrentTimeZoneId(),
    ): PlainDateTime {
      return createPlainDateTime({
        ...getCurrentIsoDateTime(createSimpleTimeZoneOps(refineTimeZoneSlot(timeZone))),
        calendar: refineCalendarSlot(calendar),
        branding: PlainDateTimeBranding,
      })
    },

    plainDateTimeISO(
      timeZone: TimeZoneSlot = getCurrentTimeZoneId(),
    ): PlainDateTime {
      return createPlainDateTime({
        ...getCurrentIsoDateTime(createSimpleTimeZoneOps(refineTimeZoneSlot(timeZone))),
        calendar: isoCalendarId,
        branding: PlainDateTimeBranding,
      })
    },

    plainDate(
      calendar: CalendarSlot,
      timeZone: TimeZoneSlot = getCurrentTimeZoneId(),
    ): PlainDate {
      return createPlainDate({
        ...getCurrentIsoDate(createSimpleTimeZoneOps(refineTimeZoneSlot(timeZone))),
        calendar: refineCalendarSlot(calendar),
        branding: PlainDateBranding,
      })
    },

    plainDateISO(
      timeZone: TimeZoneSlot = getCurrentTimeZoneId(),
    ): PlainDate {
      return createPlainDate({
        ...getCurrentIsoDate(createSimpleTimeZoneOps(refineTimeZoneSlot(timeZone))),
        calendar: isoCalendarId,
        branding: PlainDateBranding,
      })
    },

    plainTimeISO(
      timeZone: TimeZoneSlot = getCurrentTimeZoneId(),
    ): PlainTime {
      return createPlainTime({
        ...getCurrentIsoTime(createSimpleTimeZoneOps(refineTimeZoneSlot(timeZone))),
        branding: PlainTimeBranding,
      })
    },
  }),
})
