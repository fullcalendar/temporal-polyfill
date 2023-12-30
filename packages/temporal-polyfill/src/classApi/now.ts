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
import { getCurrentEpochNanoseconds, getCurrentIsoDateTime, getCurrentTimeZoneId } from '../internal/current'
import { InstantBranding, PlainDateBranding, PlainDateTimeBranding, PlainTimeBranding, ZonedDateTimeBranding, createInstantX, createPlainDateTimeX, createPlainDateX, createPlainTimeX, createZonedDateTimeX } from '../internal/slots'

export const Now = Object.defineProperties({}, {
  ...createTemporalNameDescriptors('Now'),
  ...createPropDescriptors({

    timeZoneId: getCurrentTimeZoneId,

    instant(): Instant {
      return createInstant(
        createInstantX(
          getCurrentEpochNanoseconds(),
        ),
      )
    },

    zonedDateTime(
      calendar: CalendarSlot,
      timeZone: TimeZoneSlot = getCurrentTimeZoneId(),
    ): ZonedDateTime {
      return createZonedDateTime(
        createZonedDateTimeX(
          getCurrentEpochNanoseconds(),
          refineTimeZoneSlot(timeZone),
          refineCalendarSlot(calendar),
        )
      )
    },

    zonedDateTimeISO(
      timeZone: TimeZoneSlot = getCurrentTimeZoneId(),
    ): ZonedDateTime {
      return createZonedDateTime(
        createZonedDateTimeX(
          getCurrentEpochNanoseconds(),
          refineTimeZoneSlot(timeZone),
          isoCalendarId,
        )
      )
    },

    plainDateTime(
      calendar: CalendarSlot,
      timeZone: TimeZoneSlot = getCurrentTimeZoneId(),
    ): PlainDateTime {
      return createPlainDateTime(
        createPlainDateTimeX(
          getCurrentIsoDateTime(createSimpleTimeZoneOps(refineTimeZoneSlot(timeZone))),
          refineCalendarSlot(calendar),
        )
      )
    },

    plainDateTimeISO(
      timeZone: TimeZoneSlot = getCurrentTimeZoneId(),
    ): PlainDateTime {
      return createPlainDateTime(
        createPlainDateTimeX(
          getCurrentIsoDateTime(createSimpleTimeZoneOps(refineTimeZoneSlot(timeZone))),
          isoCalendarId,
        )
      )
    },

    plainDate(
      calendar: CalendarSlot,
      timeZone: TimeZoneSlot = getCurrentTimeZoneId(),
    ): PlainDate {
      return createPlainDate(
        createPlainDateX(
          getCurrentIsoDateTime(createSimpleTimeZoneOps(refineTimeZoneSlot(timeZone))),
          refineCalendarSlot(calendar),
        )
      )
    },

    plainDateISO(
      timeZone: TimeZoneSlot = getCurrentTimeZoneId(),
    ): PlainDate {
      return createPlainDate(
        createPlainDateX(
          getCurrentIsoDateTime(createSimpleTimeZoneOps(refineTimeZoneSlot(timeZone))),
          isoCalendarId,
        )
      )
    },

    plainTimeISO(
      timeZone: TimeZoneSlot = getCurrentTimeZoneId(),
    ): PlainTime {
      return createPlainTime(
        createPlainTimeX(
          getCurrentIsoDateTime(createSimpleTimeZoneOps(refineTimeZoneSlot(timeZone)))
        )
      )
    },
  }),
})
