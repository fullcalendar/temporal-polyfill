import { BrandingSlots, DurationBranding, DurationSlots, EpochSlots, PlainDateBranding, PlainDateTimeBranding, PlainMonthDayBranding, PlainYearMonthBranding } from '../internal/slots'
import { dayTimeNanoToBigInt } from '../internal/dayTimeNano'
import { DurationFields, durationFieldNamesAsc } from '../internal/durationFields'
import { IsoDateFields, IsoTimeFields, isoTimeFieldDefaults, isoTimeFieldNamesAsc } from '../internal/calendarIsoFields'
import { epochNanoToMicro, epochNanoToMilli, epochNanoToSec } from '../internal/epochAndTime'
import { Callable, identityFunc, mapPropNames, mapProps } from '../internal/utils'
import { getCalendarSlots } from './calendar'
import { createPlainDate, toPlainDateSlots } from './plainDate'
import { getSlots, getSpecificSlots } from './slotsForClasses'
import { timeFieldNamesAsc } from '../internal/calendarFields'
import { yearMonthOnlyRefiners, dateOnlyRefiners, monthOnlyRefiners, dayOnlyRefiners, dateRefiners } from './calendarRefiners'
import { CalendarProtocol } from './calendarProtocol'
import { CalendarSlot } from './slotsForClasses'
import { createNativeStandardOps } from '../internal/calendarNativeQuery'

// For Calendar
// -------------------------------------------------------------------------------------------------
// Always assumes underlying Native calendar `ops`

function createCalendarMethods<M>(methodNameMap: M, alsoAccept: string[]): {
  [K in keyof M]: (dateArg: any) => any
} {
  const methods = {} as any

  for (const methodName in methodNameMap) {
    methods[methodName] = function(this: any, dateArg: any) {
      const { native } = getCalendarSlots(this)
      const argSlots = (getSlots(dateArg) || {}) as any
      const { branding } = argSlots
      const refinedSlots = branding === PlainDateBranding || alsoAccept.includes(branding)
        ? argSlots
        : toPlainDateSlots(dateArg)

      return (native as any)[methodName](refinedSlots)
    }
  }

  return methods
}

export const calendarMethods = {
  ...createCalendarMethods(yearMonthOnlyRefiners, [PlainYearMonthBranding]),
  ...createCalendarMethods(dateOnlyRefiners, []),
  ...createCalendarMethods(monthOnlyRefiners, [PlainYearMonthBranding, PlainMonthDayBranding]),
  ...createCalendarMethods(dayOnlyRefiners, [PlainMonthDayBranding]),
}

// For PlainDate/etc
// -------------------------------------------------------------------------------------------------
// Assumes general calendar (native/adapter)

/*
Made external for ZonedDateTime
*/
export function createCalendarGetters<M>(
  branding: string,
  methodNameMap: M,
  slotsToIsoFields: ((slots: any) => IsoTimeFields) = identityFunc as any,
): {
  [K in keyof M]: () => any
} {
  const methods = {} as any

  for (const methodName in methodNameMap) {
    methods[methodName] = function(this: any) {
      const slots = getSpecificSlots(branding, this) as any
      const { calendar } = slots
      const simpleOps = createSimpleOps(calendar) as any
      const isoFields = slotsToIsoFields(slots)

      return simpleOps[methodName](isoFields)
    }
  }

  return methods
}

export const dateTimeCalendarGetters = createCalendarGetters(PlainDateTimeBranding, dateRefiners) // hack
export const dateCalendarGetters = createCalendarGetters(PlainDateBranding, dateRefiners)
export const yearMonthGetters = createCalendarGetters(PlainYearMonthBranding, {
  ...yearMonthOnlyRefiners,
  ...monthOnlyRefiners,
})
export const monthDayGetters = createCalendarGetters(PlainMonthDayBranding, {
  ...monthOnlyRefiners,
  ...dayOnlyRefiners,
})

// Calendar "Simple" Ops
// -------------------------------------------------------------------------------------------------

interface AdapterSimpleState {
  calendarProtocol: CalendarProtocol
}

type AdapterSimpleOps = {
  [K in keyof typeof dateRefiners]: (isoFields: IsoDateFields) => any
}

const adapterSimpleOps = mapProps(
  (refiner, methodName) => {
    return function (this: AdapterSimpleState, isoFields: IsoDateFields) {
      const { calendarProtocol } = this
      return refiner(
        (calendarProtocol as any)[methodName](
          createPlainDate({
            ...isoFields,
            ...isoTimeFieldDefaults, // yuck
            calendar: calendarProtocol,
            branding: PlainDateBranding,
          })
        )
      )
    }
  },
  dateRefiners as Record<string, Callable>
) as AdapterSimpleOps

function createAdapterSimpleOps(
  calendarProtocol: CalendarProtocol
): AdapterSimpleOps {
  return Object.assign(
    Object.create(adapterSimpleOps),
    { calendarProtocol } as AdapterSimpleState
  )
}

function createSimpleOps(calendarSlot: CalendarSlot): AdapterSimpleOps {
  if (typeof calendarSlot === 'string') {
    return createNativeStandardOps(calendarSlot) // has everything
  }
  return createAdapterSimpleOps(calendarSlot)
}


// Duration
// -------------------------------------------------------------------------------------------------

export const durationGettersMethods = mapPropNames((propName: keyof DurationFields) => {
  return function (this: any) {
    const slots = getSpecificSlots(DurationBranding, this) as DurationSlots
    return slots[propName]
  }
}, durationFieldNamesAsc)

// Time
// -------------------------------------------------------------------------------------------------

export function createTimeGetterMethods(
  branding: string,
  slotsToIsoFields: ((slots: any) => IsoTimeFields) = identityFunc,
) {
  return mapPropNames((name, i) => {
    return function (this: any) {
      const slots = getSpecificSlots(branding, this) as (BrandingSlots & IsoTimeFields)
      const isoFields = slotsToIsoFields(slots)
      return isoFields[isoTimeFieldNamesAsc[i]]
    }
  }, timeFieldNamesAsc)
}

// Epoch
// -------------------------------------------------------------------------------------------------

export function createEpochGetterMethods(branding: string) {
  return {
    epochSeconds() {
      const slots = getSpecificSlots(branding, this) as (BrandingSlots & EpochSlots)
      return epochNanoToSec(slots.epochNanoseconds)
    },
    epochMilliseconds() {
      const slots = getSpecificSlots(branding, this) as (BrandingSlots & EpochSlots)
      return epochNanoToMilli(slots.epochNanoseconds)
    },
    epochMicroseconds() {
      const slots = getSpecificSlots(branding, this) as (BrandingSlots & EpochSlots)
      return epochNanoToMicro(slots.epochNanoseconds)
    },
    epochNanoseconds() {
      const slots = getSpecificSlots(branding, this) as (BrandingSlots & EpochSlots)
      return dayTimeNanoToBigInt(slots.epochNanoseconds)
    },
  }
}

// Misc
// -------------------------------------------------------------------------------------------------

export function neverValueOf() {
  throw new TypeError('Cannot convert object using valueOf')
}
