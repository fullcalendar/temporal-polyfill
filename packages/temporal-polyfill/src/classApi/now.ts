import { isoCalendarId } from '../internal/calendarConfig'
import {
  getCurrentEpochNano,
  getCurrentIsoDateTime,
  getCurrentTimeZoneId,
} from '../internal/current'
import {
  createInstantSlots,
  createPlainDateSlots,
  createPlainDateTimeSlots,
  createPlainTimeSlots,
  createZonedDateTimeSlots,
} from '../internal/slots'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import {
  createPropDescriptors,
  createStringTagDescriptors,
} from '../internal/utils'
import { CalendarArg, refineCalendarArg } from './calendarArg'
import { Instant, createInstant } from './instant'
import { PlainDate, createPlainDate } from './plainDate'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { PlainTime, createPlainTime } from './plainTime'
import { TimeZoneArg, refineTimeZoneArg } from './timeZoneArg'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'

export const Now = Object.defineProperties(
  {},
  {
    ...createStringTagDescriptors('Temporal.Now'),
    ...createPropDescriptors({
      timeZoneId() {
        return getCurrentTimeZoneId() // we call separately to return function.name
      },

      instant(): Instant {
        return createInstant(createInstantSlots(getCurrentEpochNano()))
      },

      zonedDateTime(
        calendarArg: CalendarArg,
        timeZoneArg: TimeZoneArg = getCurrentTimeZoneId(),
      ): ZonedDateTime {
        return createZonedDateTime(
          createZonedDateTimeSlots(
            getCurrentEpochNano(),
            refineTimeZoneArg(timeZoneArg),
            refineCalendarArg(calendarArg),
          ),
        )
      },

      zonedDateTimeISO(
        timeZoneArg: TimeZoneArg = getCurrentTimeZoneId(),
      ): ZonedDateTime {
        return createZonedDateTime(
          createZonedDateTimeSlots(
            getCurrentEpochNano(),
            refineTimeZoneArg(timeZoneArg),
            isoCalendarId,
          ),
        )
      },

      plainDateTime(
        calendarArg: CalendarArg,
        timeZoneArg: TimeZoneArg = getCurrentTimeZoneId(),
      ): PlainDateTime {
        return createPlainDateTime(
          createPlainDateTimeSlots(
            getCurrentIsoDateTime(
              queryNativeTimeZone(refineTimeZoneArg(timeZoneArg)),
            ),
            refineCalendarArg(calendarArg),
          ),
        )
      },

      plainDateTimeISO(
        timeZoneArg: TimeZoneArg = getCurrentTimeZoneId(),
      ): PlainDateTime {
        return createPlainDateTime(
          createPlainDateTimeSlots(
            getCurrentIsoDateTime(
              queryNativeTimeZone(refineTimeZoneArg(timeZoneArg)),
            ),
            isoCalendarId,
          ),
        )
      },

      plainDate(
        calendarArg: CalendarArg,
        timeZoneArg: TimeZoneArg = getCurrentTimeZoneId(),
      ): PlainDate {
        return createPlainDate(
          createPlainDateSlots(
            getCurrentIsoDateTime(
              queryNativeTimeZone(refineTimeZoneArg(timeZoneArg)),
            ),
            refineCalendarArg(calendarArg),
          ),
        )
      },

      plainDateISO(
        timeZoneArg: TimeZoneArg = getCurrentTimeZoneId(),
      ): PlainDate {
        return createPlainDate(
          createPlainDateSlots(
            getCurrentIsoDateTime(
              queryNativeTimeZone(refineTimeZoneArg(timeZoneArg)),
            ),
            isoCalendarId,
          ),
        )
      },

      plainTimeISO(
        timeZoneArg: TimeZoneArg = getCurrentTimeZoneId(),
      ): PlainTime {
        return createPlainTime(
          createPlainTimeSlots(
            getCurrentIsoDateTime(
              queryNativeTimeZone(refineTimeZoneArg(timeZoneArg)),
            ),
          ),
        )
      },
    }),
  },
)
