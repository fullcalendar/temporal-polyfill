import { isoCalendarId, toCalendarSlot } from './calendarAdapter'
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
import { createTemporalClass, neverValueOf } from './temporalClass'
import {
  instantToOffsetNanoseconds,
  instantToPlainDateTimeInternals,
  toTimeZoneSlot,
} from './timeZoneProtocol'
import { createZonedDateTime } from './zonedDateTime'

export const [
  Instant,
  createInstant,
  toInstantEpochNanoseconds,
] = createTemporalClass(
  'Instant',

  // Creation
  // -----------------------------------------------------------------------------------------------

  (epochNanoseconds) => {
    return regulateEpochNanoseconds(toLargeInt(epochNanoseconds))
  },
  {
    ZonedDateTime: (internals) => internals.epochNanoseconds,
  },
  undefined, // bagToInternals
  stringToEpochNanoseconds,
  undefined, // parseOptions

  // Getters
  // -----------------------------------------------------------------------------------------------

  epochGetters,

  // Methods
  // -----------------------------------------------------------------------------------------------

  {
    toZonedDateTimeISO(epochNanoseconds, timeZoneArg) {
      createZonedDateTime({
        epochNanoseconds,
        timeZone: toTimeZoneSlot(timeZoneArg),
        calendar: isoCalendarId,
      })
    },

    toZonedDateTime(epochNanoseconds, options) {
      const refinedObj = toObject(options)

      return createZonedDateTime({
        epochNanoseconds,
        timeZone: toTimeZoneSlot(refinedObj.timeZone),
        calendar: toCalendarSlot(refinedObj.calendar),
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

      const calendar = refinedOptions.calendar !== undefined
        ? toCalendarSlot(refinedOptions.calendar)
        : isoCalendarId

      const timeZone = refinedOptions.timeZone !== undefined
        ? toTimeZoneSlot(refinedOptions.timeZone)
        : 'UTC'

      epochNanoseconds = roundEpochNanoseconds(epochNanoseconds, refinedOptions)
      const instant = createInstant(epochNanoseconds)
      const offsetNanoseconds = instantToOffsetNanoseconds(timeZone, instant)
      const isoFields = instantToPlainDateTimeInternals(timeZone, calendar, instant)

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
