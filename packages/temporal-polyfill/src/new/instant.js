import { isoCalendarId } from './calendarConfig'
import { queryCalendarOps } from './calendarOps'
import { toObject } from './cast'
import { diffEpochNanoseconds } from './diff'
import { toDurationInternals } from './duration'
import { negateDurationFields } from './durationFields'
import {
  formatCalendar,
  formatIsoDateTimeFields,
  formatOffsetNanoseconds,
  formatTimeZone,
} from './format'
import { neverValueOf } from './internalClass'
import { noop } from './lang'
import { compareLargeInts, createLargeInt, toLargeInt } from './largeInt'
import { moveEpochNanoseconds } from './move'
import {
  epochGetters,
  nanosecondsInMicrosecond,
  nanosecondsInMillisecond,
  nanosecondsInSecond,
  regulateEpochNanoseconds,
} from './nanoseconds'
import { roundEpochNanoseconds } from './round'
import { createTemporalClass } from './temporalClass'
import { queryTimeZoneOps, utcTimeZoneId } from './timeZoneOps'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'

export const [
  Instant,
  createInstant,
  toInstantEpochNanoseconds,
] = createTemporalClass(
  'Instant',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructorToInternals
  (epochNanoseconds) => {
    return regulateEpochNanoseconds(toLargeInt(epochNanoseconds))
  },

  // massageOtherInternals
  (arg, argInternals) => {
    if (arg instanceof ZonedDateTime) {
      return argInternals.epochNanoseconds
    }
  },

  // bagToInternals
  noop,

  // stringToInternals
  stringToEpochNanoseconds,

  // handleUnusedOptions
  noop,

  // Getters
  // -----------------------------------------------------------------------------------------------

  epochGetters,

  // Methods
  // -----------------------------------------------------------------------------------------------

  {
    toZonedDateTimeISO(epochNanoseconds, timeZoneArg) {
      createZonedDateTime({
        epochNanoseconds,
        timeZone: queryTimeZoneOps(timeZoneArg),
        calendar: isoCalendarId,
      })
    },

    toZonedDateTime(epochNanoseconds, options) {
      const refinedObj = toObject(options)

      return createZonedDateTime({
        epochNanoseconds,
        timeZone: queryTimeZoneOps(refinedObj.timeZone),
        calendar: queryCalendarOps(refinedObj.calendar),
      })
    },

    add(epochNanoseconds, durationArg) {
      return createInstant(
        moveEpochNanoseconds(
          epochNanoseconds,
          toDurationInternals(durationArg),
        ),
      )
    },

    subtract(epochNanoseconds, durationArg) {
      return createInstant(
        moveEpochNanoseconds(
          epochNanoseconds,
          negateDurationFields(toDurationInternals(durationArg)),
        ),
      )
    },

    until(epochNanoseconds, otherArg, options) {
      return diffEpochNanoseconds(
        epochNanoseconds,
        toInstantEpochNanoseconds(otherArg),
        options, // TODO: must be given better options???
      )
    },

    since(epochNanoseconds, otherArg, options) {
      return diffEpochNanoseconds(
        toInstantEpochNanoseconds(otherArg),
        epochNanoseconds,
        options, // TODO: reverse rounding option
      )
    },

    round(epochNanoseconds, options) {
      return createInstant(roundEpochNanoseconds(epochNanoseconds, options))
    },

    equals(epochNanoseconds, otherArg) {
      return !compareLargeInts(
        epochNanoseconds,
        toInstantEpochNanoseconds(otherArg),
      )
    },

    toString(epochNanoseconds, options) { // has rounding options too
      const refinedOptions = toObject(options) // TODO: make optional
      // ^important for destructuring options because used once for rounding, second for formatting

      const calendar = queryCalendarOps(refinedOptions.calendar || isoCalendarId)
      const timeZone = queryTimeZoneOps(refinedOptions.timeZone || utcTimeZoneId)

      epochNanoseconds = roundEpochNanoseconds(epochNanoseconds, refinedOptions)
      const offsetNanoseconds = timeZone.getOffsetNanosecondsFor(epochNanoseconds)
      const isoFields = epochNanosecondsToIso(epochNanoseconds.add(offsetNanoseconds))

      return formatIsoDateTimeFields(isoFields, refinedOptions) +
        formatOffsetNanoseconds(offsetNanoseconds) +
        formatTimeZone(timeZone, options) +
        formatCalendar(calendar, options)
    },

    toLocaleString(epochNanoseconds, locales, options) {
      return ''
    },

    valueOf: neverValueOf,
  },

  // Static
  // -----------------------------------------------------------------------------------------------

  {
    fromEpochSeconds(epochSeconds) {
      return createInstant(createLargeInt(epochSeconds).mult(nanosecondsInSecond))
    },

    fromEpochMilliseconds(epochMilliseconds) {
      return createInstant(createLargeInt(epochMilliseconds).mult(nanosecondsInMillisecond))
    },

    fromEpochMicroseconds(epochMicroseconds) {
      return createInstant(toLargeInt(epochMicroseconds).mult(nanosecondsInMicrosecond))
    },

    fromEpochNanoseconds(epochNanoseconds) {
      return createInstant(toLargeInt(epochNanoseconds))
    },
  },
)

function stringToEpochNanoseconds(str) {
  // TODO
}

function epochNanosecondsToIso() {
}
