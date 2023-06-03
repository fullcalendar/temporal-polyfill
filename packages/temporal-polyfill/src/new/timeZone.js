import { queryTimeZoneImpl } from '../timeZoneImpl/timeZoneImplQuery'
import { createComplexBagRefiner } from './bag'
import { Calendar } from './calendar'
import { queryCalendarOps } from './calendarOps'
import { createTemporalClass, internalIdGetters, returnId } from './class'
import { createInstant, toInstantEpochNanoseconds } from './instant'
import { formatOffsetNanoseconds } from './isoFormat'
import { stringToTimeZoneId } from './isoParse'
import { toDisambiguation } from './options'
import { createPlainDateTime, toPlainDateTimeInternals } from './plainDateTime'
import { getSingleInstantFor, zonedEpochNanoToIso } from './timeZoneOps'
import { noop } from './util'

export const [TimeZone, createTimeZone] = createTemporalClass(
  'TimeZone',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructorToInternals
  queryTimeZoneImpl,

  // internalsConversionMap
  {},

  // bagToInternals
  createComplexBagRefiner('timeZone', Calendar),

  // stringToInternals
  (str) => queryTimeZoneImpl(stringToTimeZoneId(str)),

  // handleUnusedOptions
  noop,

  // Getters
  // -----------------------------------------------------------------------------------------------

  internalIdGetters,

  // Methods
  // -----------------------------------------------------------------------------------------------

  {
    getOffsetStringFor(impl, instantArg) {
      return formatOffsetNanoseconds(
        impl.getOffsetNanosecondsFor(toInstantEpochNanoseconds(instantArg)),
      )
    },

    getPlainDateTimeFor(impl, instantArg, calendarArg) {
      const epochNanoseconds = toInstantEpochNanoseconds(instantArg)

      return createPlainDateTime({
        ...zonedEpochNanoToIso(impl, epochNanoseconds),
        calendar: queryCalendarOps(calendarArg),
      })
    },

    getInstantFor(impl, plainDateTimeArg, options) {
      return getSingleInstantFor(
        impl,
        toPlainDateTimeInternals(plainDateTimeArg),
        toDisambiguation(options),
      )
    },

    getPossibleInstantsFor(impl, plainDateTimeArg) {
      return impl.getPossibleInstantsFor(toPlainDateTimeInternals(plainDateTimeArg))
        .map(createInstant)
    },

    getOffsetNanosecondsFor(impl, instantArg) {
      return impl.getOffsetNanosecondsFor(toInstantEpochNanoseconds(instantArg))
    },

    getNextTransition(impl, instantArg) {
      return impl.getTransition(toInstantEpochNanoseconds(instantArg), 1)
    },

    getPreviousTransition(impl, instantArg) {
      return impl.getTransition(toInstantEpochNanoseconds(instantArg), -1)
    },

    toString: returnId,
  },
)
