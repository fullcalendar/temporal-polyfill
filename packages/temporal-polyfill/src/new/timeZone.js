import { queryTimeZoneImpl } from '../timeZoneImpl/timeZoneImplQuery'
import { Calendar } from './calendar'
import { queryCalendarOps } from './calendarOps'
import { createTemporalClass, internalIdGetters, returnId } from './class'
import { createComplexBagRefiner } from './convert'
import { createInstant, toInstantEpochNanoseconds } from './instant'
import { formatOffsetNanoseconds } from './isoFormat'
import { stringToTimeZoneId } from './isoParse'
import { toDisambiguation } from './options'
import { createPlainDateTime, toPlainDateTimeInternals } from './plainDateTime'
import { getSingleInstantFor, zonedEpochNanoToIso } from './timeZoneOps'
import { noop } from './util'

export const timeZoneVitalMethods = {
  getPossibleInstantsFor(impl, plainDateTimeArg) {
    return impl.getPossibleInstantsFor(toPlainDateTimeInternals(plainDateTimeArg))
      .map(createInstant)
  },

  getOffsetNanosecondsFor: getImplOffsetNanosecondsFor,
}

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
    ...timeZoneVitalMethods,

    getOffsetStringFor(impl, instantArg) {
      return formatOffsetNanoseconds(getImplOffsetNanosecondsFor(impl, instantArg))
    },

    getPlainDateTimeFor(impl, instantArg, calendarArg) {
      const epochNanoseconds = toInstantEpochNanoseconds(instantArg)

      return createPlainDateTime({
        calendar: queryCalendarOps(calendarArg),
        ...zonedEpochNanoToIso(impl, epochNanoseconds),
      })
    },

    getInstantFor(impl, plainDateTimeArg, options) {
      return getSingleInstantFor(
        impl,
        toPlainDateTimeInternals(plainDateTimeArg),
        toDisambiguation(options), // TODO: method w/ whole options object
      )
    },

    getNextTransition: getImplTransition.bind(undefined, 1),

    getPreviousTransition: getImplTransition.bind(undefined, -1),

    toString: returnId,
  },
)

function getImplOffsetNanosecondsFor(impl, instantArg) {
  return impl.getOffsetNanosecondsFor(toInstantEpochNanoseconds(instantArg))
}

function getImplTransition(direction, impl, instantArg) {
  const epochNano = impl.getTransition(toInstantEpochNanoseconds(instantArg), direction)
  return epochNano ? createInstant(epochNano) : null
}
