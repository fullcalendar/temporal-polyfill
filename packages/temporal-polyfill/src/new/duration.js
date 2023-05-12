import { bagToDurationFields } from './convert'
import {
  absolutizeDurationFields,
  durationFieldGetters,
  negateDurationFields,
  refineDurationFields,
} from './durationFields'
import { neverValueOf } from './internalClass'
import { noop } from './lang'
import { stringToDurationFields } from './parse'
import { createTemporalClass } from './temporalClass'

export const [
  Duration,
  createDuration,
  toDurationInternals,
] = createTemporalClass(
  'Duration',

  // Creation
  // -----------------------------------------------------------------------------------------------

  // constructorToInternals
  (
    years = 0,
    months = 0,
    weeks = 0,
    days = 0,
    hours = 0,
    minutes = 0,
    seconds = 0,
    milliseconds = 0,
    microseconds = 0,
    nanoseconds = 0,
  ) => {
    return refineDurationFields({
      years,
      months,
      weeks,
      days,
      hours,
      minutes,
      seconds,
      milliseconds,
      microseconds,
      nanoseconds,
    })
  },

  // massageOtherInternals
  noop,

  // bagToInternals
  bagToDurationFields,

  // stringToInternals
  stringToDurationFields,

  // handleUnusedOptions
  noop,

  // Getters
  // -----------------------------------------------------------------------------------------------

  {
    ...durationFieldGetters,

    blank(internals) {
      return !internals.sign
    },
  },

  // Methods
  // -----------------------------------------------------------------------------------------------

  {
    with(someDurationFields) {
      // TODO
      // TODO: will need to recompute sign!!!
    },

    add(internals, options) {
      // TODO
    },

    subtract(internals, options) {
      // TODO
    },

    negated(internals) {
      return createDuration(negateDurationFields(internals))
    },

    abs(internals) {
      return createDuration(absolutizeDurationFields(internals))
    },

    round(internals, options) {
      // TODO
    },

    total(internals, unit) {
      // TODO
    },

    valueOf: neverValueOf,
  },

  // Static
  // -----------------------------------------------------------------------------------------------

  {
    compare(durationArg0, durationArg1) {
      // TODO
    },
  },
)
