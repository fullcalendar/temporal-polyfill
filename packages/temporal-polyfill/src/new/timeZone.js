import { queryTimeZoneImpl } from '../timeZoneImpl/timeZoneImplQuery'
import { Calendar } from './calendar'
import { queryCalendarOps } from './calendarOps'
import { createComplexBagRefiner } from './convert'
import { formatOffsetNanoseconds } from './format'
import { createInstant, toInstantEpochNanoseconds } from './instant'
import { internalIdGetters, returnId } from './internalClass'
import { noop } from './lang'
import { toDisambiguation } from './options'
import { stringToTimeZoneId } from './parse'
import { createPlainDateTime, toPlainDateTimeInternals } from './plainDateTime'
import { createTemporalClass } from './temporalClass'
import { getSingleInstantFor } from './timeZoneOps'

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
      const offsetNanoseconds = impl.getOffsetNanosecondsFor(impl, epochNanoseconds)

      return createPlainDateTime({
        ...epochNanosecondsToIso(epochNanoseconds.add(offsetNanoseconds)),
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

// TimeZone Conversions
// -------------------------------------------------------------------------------------------------

function epochNanosecondsToIso(epochNanoseconds, timeZone) {

}
