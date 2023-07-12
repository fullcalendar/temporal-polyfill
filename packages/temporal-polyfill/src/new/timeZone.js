import { queryTimeZoneImpl } from '../timeZoneImpl/timeZoneImplQuery'
import { Calendar } from './calendar'
import { queryCalendarOps } from './calendarOps'
import { createTemporalClass, getObjId, idGetters } from './class'
import { refineComplexBag } from './convert'
import { createInstant, toInstantEpochNano } from './instant'
import { formatOffsetNano } from './isoFormat'
import { parseTimeZoneId } from './isoParse'
import { refineEpochDisambigOptions } from './options'
import { createPlainDateTime, toPlainDateTimeInternals } from './plainDateTime'
import { getSingleInstantFor, zonedEpochNanoToIso } from './timeZoneOps'
import { noop } from './utils'

export const timeZoneProtocolMethods = {
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
  refineComplexBag.bind(undefined, 'timeZone', Calendar),

  // stringToInternals
  (str) => queryTimeZoneImpl(parseTimeZoneId(str)),

  // handleUnusedOptions
  noop,

  // Getters
  // -----------------------------------------------------------------------------------------------

  idGetters,

  // Methods
  // -----------------------------------------------------------------------------------------------

  {
    ...timeZoneProtocolMethods,

    getOffsetStringFor(impl, instantArg) {
      return formatOffsetNano(getImplOffsetNanosecondsFor(impl, instantArg))
    },

    getPlainDateTimeFor(impl, instantArg, calendarArg) {
      const epochNanoseconds = toInstantEpochNano(instantArg)

      return createPlainDateTime({
        calendar: queryCalendarOps(calendarArg),
        ...zonedEpochNanoToIso(impl, epochNanoseconds),
      })
    },

    getInstantFor(impl, plainDateTimeArg, options) {
      return getSingleInstantFor(
        impl,
        toPlainDateTimeInternals(plainDateTimeArg),
        refineEpochDisambigOptions(options),
      )
    },

    getNextTransition: getImplTransition.bind(undefined, 1),

    getPreviousTransition: getImplTransition.bind(undefined, -1),

    toString: getObjId,
  },
)

function getImplOffsetNanosecondsFor(impl, instantArg) {
  return impl.getOffsetNanosecondsFor(toInstantEpochNano(instantArg))
}

function getImplTransition(direction, impl, instantArg) {
  const epochNano = impl.getTransition(toInstantEpochNano(instantArg), direction)
  return epochNano ? createInstant(epochNano) : null
}
