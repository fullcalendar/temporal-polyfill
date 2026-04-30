import {
  getCurrentEpochNano,
  getCurrentIsoDateTime,
  getCurrentTimeZoneId,
} from '../internal/current'
import { isoCalendarId } from '../internal/intlCalendarConfig'
import {
  createInstantSlots,
  createPlainDateSlots,
  createPlainDateTimeSlots,
  createPlainTimeSlots,
  createZonedDateTimeSlots,
} from '../internal/slots'
import { queryTimeZone } from '../internal/timeZoneImpl'
import {
  createPropDescriptors,
  createStringTagDescriptors,
} from '../internal/utils'
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

      plainDateTimeISO(
        timeZoneArg: TimeZoneArg = getCurrentTimeZoneId(),
      ): PlainDateTime {
        return createPlainDateTime(
          createPlainDateTimeSlots(
            getCurrentIsoDateTime(
              queryTimeZone(refineTimeZoneArg(timeZoneArg)),
            ),
            isoCalendarId,
          ),
        )
      },

      plainDateISO(
        timeZoneArg: TimeZoneArg = getCurrentTimeZoneId(),
      ): PlainDate {
        return createPlainDate(
          createPlainDateSlots(
            getCurrentIsoDateTime(
              queryTimeZone(refineTimeZoneArg(timeZoneArg)),
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
              queryTimeZone(refineTimeZoneArg(timeZoneArg)),
            ),
          ),
        )
      },
    }),
  },
)
