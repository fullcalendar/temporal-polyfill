import { queryTimeZoneImpl } from '../timeZoneImpl/timeZoneImplQuery'
import { Calendar } from './calendar'
import { createComplexBagRefiner } from './convert'
import { formatOffsetNanoseconds } from './format'
import { toInstantEpochNanoseconds } from './instant'
import { stringToTimeZoneId } from './parse'
import { createTemporalClass } from './temporalClass'
import { instantToOffsetNanoseconds } from './timeZoneProtocol'

export const [TimeZone] = createTemporalClass(
  'TimeZone',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructor to internals
  (id) => {
    return queryTimeZoneImpl(id)
  },
  {},
  createComplexBagRefiner('timeZone', Calendar),
  stringToTimeZoneId,
  undefined,

  // Getters
  // -----------------------------------------------------------------------------------------------

  {
    id(impl) {
      return impl.id
    },
  },

  // Methods
  // -----------------------------------------------------------------------------------------------

  {
    getOffsetStringFor(impl, instantArg) {
      return formatOffsetNanoseconds(
        // TODO: figure out timeZoneProtocol
        instantToOffsetNanoseconds(
          this,
          toInstantEpochNanoseconds(instantArg),
        ),
      )
    },

    getOffsetNanosecondsFor(impl, instantArg) {
      // TODO
    },

    getPlainDateTimeFor(impl, instantArg, calendarArg) {
      // TODO
    },

    getInstantFor(impl, dateTimeArg, options) {
      // TODO
    },

    getPossibleInstantsFor(impl, dateTimeArg) {
      // TODO
    },

    getPreviousTransition(impl, instantArg) {
      // TODO
    },

    getNextTransition(impl, instantArg) {
      // TODO
    },

    toString(impl) {
      return impl.id
    },
  },
)
