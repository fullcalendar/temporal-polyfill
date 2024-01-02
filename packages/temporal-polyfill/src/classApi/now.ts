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
import { createInstantSlots, createPlainDateTimeSlots, createPlainDateSlots, createPlainTimeSlots, createZonedDateTimeSlots } from '../internal/slots'

export const Now = Object.defineProperties({}, {
  ...createTemporalNameDescriptors('Now'),
  ...createPropDescriptors({

    timeZoneId() { // can't be anonymous because of .name
      return getCurrentTimeZoneId()
    },

    instant(): Instant {
      return createInstant(
        createInstantSlots(
          getCurrentEpochNanoseconds(),
        ),
      )
    },

    zonedDateTime(
      calendar: CalendarSlot,
      timeZone: TimeZoneSlot = getCurrentTimeZoneId(),
    ): ZonedDateTime {
      return createZonedDateTime(
        createZonedDateTimeSlots(
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
        createZonedDateTimeSlots(
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
        createPlainDateTimeSlots(
          getCurrentIsoDateTime(createSimpleTimeZoneOps(refineTimeZoneSlot(timeZone))),
          refineCalendarSlot(calendar),
        )
      )
    },

    plainDateTimeISO(
      timeZone: TimeZoneSlot = getCurrentTimeZoneId(),
    ): PlainDateTime {
      return createPlainDateTime(
        createPlainDateTimeSlots(
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
        createPlainDateSlots(
          getCurrentIsoDateTime(createSimpleTimeZoneOps(refineTimeZoneSlot(timeZone))),
          refineCalendarSlot(calendar),
        )
      )
    },

    plainDateISO(
      timeZone: TimeZoneSlot = getCurrentTimeZoneId(),
    ): PlainDate {
      return createPlainDate(
        createPlainDateSlots(
          getCurrentIsoDateTime(createSimpleTimeZoneOps(refineTimeZoneSlot(timeZone))),
          isoCalendarId,
        )
      )
    },

    plainTimeISO(
      timeZone: TimeZoneSlot = getCurrentTimeZoneId(),
    ): PlainTime {
      return createPlainTime(
        createPlainTimeSlots(
          getCurrentIsoDateTime(createSimpleTimeZoneOps(refineTimeZoneSlot(timeZone)))
        )
      )
    },
  }),
})
