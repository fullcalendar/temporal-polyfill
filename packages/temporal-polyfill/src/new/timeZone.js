import { queryTimeZoneImpl } from '../timeZoneImpl/timeZoneImplQuery'
import { Calendar } from './calendar'
import { queryCalendarOps } from './calendarOps'
import { createComplexBagRefiner } from './convert'
import { formatOffsetNanoseconds } from './format'
import { createInstant, toInstantEpochNanoseconds } from './instant'
import { internalIdGetters, returnId } from './internalClass'
import { identityFunc, noop } from './lang'
import { mapProps } from './obj'
import { toDisambiguation } from './options'
import { stringToTimeZoneId } from './parse'
import { createPlainDateTime, toPlainDateTimeInternals } from './plainDateTime'
import { createTemporalClass } from './temporalClass'
import { getBestInstantFor } from './timeZoneOps'

export const [TimeZone, createTimeZone] = createTemporalClass(
  'TimeZone',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructorToInternals
  queryTimeZoneImpl,

  // massageOtherInternals
  noop,

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
      return getBestInstantFor(
        impl,
        toPlainDateTimeInternals(plainDateTimeArg),
        toDisambiguation(options),
      )
    },

    getPossibleInstantsFor(impl, plainDateTimeArg) {
      return impl.getPossibleInstantsFor(toPlainDateTimeInternals(plainDateTimeArg))
        .map(createInstant)
    },

    ...mapProps({
      getPreviousTransition: createInstant,
      getNextTransition: createInstant,
      getOffsetNanosecondsFor: identityFunc,
    }, (transformRes, methodName) => {
      return (impl, instantArg) => {
        return transformRes(impl[methodName](toInstantEpochNanoseconds(instantArg)))
      }
    }),

    toString: returnId,
  },
)

// TimeZone Conversions
// -------------------------------------------------------------------------------------------------

function epochNanosecondsToIso(epochNanoseconds, timeZone) {

}
