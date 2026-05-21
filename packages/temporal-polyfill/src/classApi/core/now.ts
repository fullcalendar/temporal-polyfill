import {
  getCurrentEpochNano,
  getCurrentIsoDateTime,
  getCurrentTimeZoneId,
} from '../../internal/current'
import {
  createDateSlots,
  createDateTimeSlots,
  createEpochNanoSlots,
  createTimeSlots,
  createZonedEpochNanoSlots,
} from '../../internal/slots'
import { queryTimeZone } from '../../internal/timeZoneImpl'
import {
  createPropDescriptors,
  createStringTagDescriptors,
} from '../../internal/utils'
import { TimeZoneArg, refineTimeZoneArg } from '../timeZoneArg'
import { Instant, createInstant } from './instant'
import { PlainDate, createPlainDate } from './plainDate'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { PlainTime, createPlainTime } from './plainTime'
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
        return createInstant(createEpochNanoSlots(getCurrentEpochNano()))
      },

      zonedDateTimeISO(
        timeZoneArg: TimeZoneArg = getCurrentTimeZoneId(),
      ): ZonedDateTime {
        const timeZone = queryTimeZone(refineTimeZoneArg(timeZoneArg))
        return createZonedDateTime(
          // Omitting calendar constructs ISO-calendar slots.
          createZonedEpochNanoSlots(getCurrentEpochNano(), timeZone),
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
          createDateTimeSlots(isoDateTime),
        )
      },

      plainDateISO(
        timeZoneArg: TimeZoneArg = getCurrentTimeZoneId(),
      ): PlainDate {
        const isoDateTime = getCurrentIsoDateTime(
          queryTimeZone(refineTimeZoneArg(timeZoneArg)),
        )
        // Omitting calendar constructs ISO-calendar slots.
        return createPlainDate(createDateSlots(isoDateTime))
      },

      plainTimeISO(
        timeZoneArg: TimeZoneArg = getCurrentTimeZoneId(),
      ): PlainTime {
        const isoDateTime = getCurrentIsoDateTime(
          queryTimeZone(refineTimeZoneArg(timeZoneArg)),
        )
        return createPlainTime(createTimeSlots(isoDateTime))
      },
    }),
  },
)
