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
        const timeZone = queryTimeZone(refineTimeZoneArg(timeZoneArg))
        return createZonedDateTime(
          // Omitting calendar constructs ISO-calendar slots.
          createZonedDateTimeSlots(getCurrentEpochNano(), timeZone),
        )
      },

      plainDateTimeISO(
        timeZoneArg: TimeZoneArg = getCurrentTimeZoneId(),
      ): PlainDateTime {
        const isoDateTime = getCurrentIsoDateTime(
          queryTimeZone(refineTimeZoneArg(timeZoneArg)),
        )
        return createPlainDateTime(
          // Omitting calendar constructs ISO-calendar slots.
          createPlainDateTimeSlots(isoDateTime),
        )
      },

      plainDateISO(
        timeZoneArg: TimeZoneArg = getCurrentTimeZoneId(),
      ): PlainDate {
        const isoDateTime = getCurrentIsoDateTime(
          queryTimeZone(refineTimeZoneArg(timeZoneArg)),
        )
        // Omitting calendar constructs ISO-calendar slots.
        return createPlainDate(createPlainDateSlots(isoDateTime))
      },

      plainTimeISO(
        timeZoneArg: TimeZoneArg = getCurrentTimeZoneId(),
      ): PlainTime {
        const isoDateTime = getCurrentIsoDateTime(
          queryTimeZone(refineTimeZoneArg(timeZoneArg)),
        )
        return createPlainTime(createPlainTimeSlots(isoDateTime))
      },
    }),
  },
)
