import {
  getCurrentEpochNano,
  getCurrentIsoDateTime,
  getCurrentTimeZoneId,
} from '../internal/current'
import { isoCalendar } from '../internal/externalCalendar'
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
          createZonedDateTimeSlots(
            getCurrentEpochNano(),
            timeZone,
            isoCalendar,
          ),
        )
      },

      plainDateTimeISO(
        timeZoneArg: TimeZoneArg = getCurrentTimeZoneId(),
      ): PlainDateTime {
        const isoDateTime = getCurrentIsoDateTime(
          queryTimeZone(refineTimeZoneArg(timeZoneArg)),
        )
        return createPlainDateTime(
          createPlainDateTimeSlots(isoDateTime, isoCalendar),
        )
      },

      plainDateISO(
        timeZoneArg: TimeZoneArg = getCurrentTimeZoneId(),
      ): PlainDate {
        const isoDateTime = getCurrentIsoDateTime(
          queryTimeZone(refineTimeZoneArg(timeZoneArg)),
        )
        return createPlainDate(createPlainDateSlots(isoDateTime, isoCalendar))
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
