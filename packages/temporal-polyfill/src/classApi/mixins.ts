import { createNativeStandardOps } from '../internal/calendarNativeQuery'
import { durationFieldNamesAsc } from '../internal/durationFields'
import * as errorMessages from '../internal/errorMessages'
import { timeFieldNamesAsc } from '../internal/fields'
import { isoTimeFieldNamesAsc } from '../internal/isoFields'
import {
  DurationSlots,
  getEpochMicro,
  getEpochMilli,
  getEpochNano,
  getEpochSec,
} from '../internal/slots'
import { bindArgs, excludePropsByName, mapPropNames } from '../internal/utils'
import {
  dateRefiners,
  dayOnlyRefiners,
  monthOnlyRefiners,
  yearMonthOnlyRefiners,
} from './calendarRefiners'

// For PlainDate/etc
// -----------------------------------------------------------------------------
// Assumes general calendar (native/adapter)

function createCalendarGetters<M>(methodNameMap: M): {
  [K in keyof M]: () => any
} {
  const methods = {} as any

  for (const methodName in methodNameMap) {
    methods[methodName] = function (this: any, slots: any) {
      const { calendar } = slots

      // NOTE: this is inefficient to recreate each time!!!
      const ops = createNativeStandardOps(calendar) as any
      return ops[methodName](slots)
    }
  }

  return methods
}

export const dateGetters = createCalendarGetters(dateRefiners)
export const yearMonthGetters = createCalendarGetters({
  ...yearMonthOnlyRefiners,
  ...monthOnlyRefiners,
})
export const monthDayGetters = createCalendarGetters({
  ...monthOnlyRefiners,
  ...dayOnlyRefiners,
})
export const calendarIdGetters = {
  calendarId(slots: any): string {
    return slots.calendar
  },
}

// Duration
// -----------------------------------------------------------------------------

export const durationGetters = mapPropNames(
  (propName: keyof DurationSlots) => {
    return function (this: any, slots: any) {
      return slots[propName]
    }
  },
  (durationFieldNamesAsc as (keyof DurationSlots)[]).concat('sign'),
)

// Time
// -----------------------------------------------------------------------------

export const timeGetters = mapPropNames((_name, i) => {
  return function (this: any, slots: any) {
    return slots[isoTimeFieldNamesAsc[i]]
  }
}, timeFieldNamesAsc)

// Epoch
// -----------------------------------------------------------------------------

export const epochGetters = {
  epochSeconds: getEpochSec,
  epochMilliseconds: getEpochMilli,
  epochMicroseconds: getEpochMicro,
  epochNanoseconds: getEpochNano,
}

// Misc
// -----------------------------------------------------------------------------

export function neverValueOf() {
  throw new TypeError(errorMessages.forbiddenValueOf)
}

// for getISOFields
export const removeBranding = bindArgs(
  excludePropsByName,
  new Set([/*@__KEY__*/ 'branding']),
)
