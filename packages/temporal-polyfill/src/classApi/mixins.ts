import { EpochSlots, PlainDateBranding, PlainMonthDayBranding, PlainYearMonthBranding, createPlainDateSlots, getId } from '../internal/slots'
import { dayTimeNanoToBigInt } from '../internal/dayTimeNano'
import { DurationFields, durationFieldNamesAsc } from '../internal/durationFields'
import { IsoDateFields, isoTimeFieldNamesAsc } from '../internal/calendarIsoFields'
import { epochNanoToMicro, epochNanoToMilli, epochNanoToSec } from '../internal/epochAndTime'
import { Callable, mapPropNames, mapProps } from '../internal/utils'
import { createPlainDate, toPlainDateSlots } from './plainDate'
import { getSlots } from './slotsForClasses'
import { timeFieldNamesAsc } from '../internal/calendarFields'
import { yearMonthOnlyRefiners, dateOnlyRefiners, monthOnlyRefiners, dayOnlyRefiners, dateRefiners } from './calendarRefiners'
import { CalendarSlot } from './slotsForClasses'
import { createNativeStandardOps } from '../internal/calendarNativeQuery'
import * as errorMessages from '../internal/errorMessages'
import { Calendar, CalendarProtocol } from './calendar'

// For Calendar
// -------------------------------------------------------------------------------------------------
// Always assumes underlying Native calendar `ops`

function createCalendarFieldMethods<M>(methodNameMap: M, alsoAccept: string[]): {
  [K in keyof M]: (dateArg: any) => any
} {
  const methods = {} as any

  for (const methodName in methodNameMap) {
    methods[methodName] = function(this: any, { native }: any, dateArg: any) {
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

export const calendarFieldMethods = {
  ...createCalendarFieldMethods(yearMonthOnlyRefiners, [PlainYearMonthBranding]),
  ...createCalendarFieldMethods(dateOnlyRefiners, []),
  ...createCalendarFieldMethods(monthOnlyRefiners, [PlainYearMonthBranding, PlainMonthDayBranding]),
  ...createCalendarFieldMethods(dayOnlyRefiners, [PlainMonthDayBranding]),
}

// For PlainDate/etc
// -------------------------------------------------------------------------------------------------
// Assumes general calendar (native/adapter)

function createCalendarGetters<M>(methodNameMap: M): {
  [K in keyof M]: () => any
} {
  const methods = {} as any

  for (const methodName in methodNameMap) {
    methods[methodName] = function(this: any, slots: any) {
      const { calendar } = slots
      const simpleOps = createSimpleOps(calendar) as any
      return simpleOps[methodName](slots)
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
    return getId(slots.calendar)
  },
}

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
          createPlainDate(
            createPlainDateSlots(isoFields, calendarProtocol),
          )
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

export const durationGetters = mapPropNames((propName: keyof DurationFields) => {
  return function (this: any, slots: any) {
    return slots[propName]
  }
}, durationFieldNamesAsc)

// Time
// -------------------------------------------------------------------------------------------------

export const timeGetters = mapPropNames((name, i) => {
  return function (this: any, slots: any) {
    return (slots)[isoTimeFieldNamesAsc[i]]
  }
}, timeFieldNamesAsc)

// Epoch
// -------------------------------------------------------------------------------------------------

export function getEpochSeconds(slots: EpochSlots) {
  return epochNanoToSec(slots.epochNanoseconds)
}

export function getEpochMilliseconds(slots: EpochSlots) {
  return epochNanoToMilli(slots.epochNanoseconds)
}

export function getEpochMicroseconds(slots: EpochSlots) {
  return epochNanoToMicro(slots.epochNanoseconds)
}

export function getEpochNanoseconds(slots: EpochSlots) {
  return dayTimeNanoToBigInt(slots.epochNanoseconds)
}

export const epochGetters = {
  epochSeconds: getEpochSeconds,
  epochMilliseconds: getEpochMilliseconds,
  epochMicroseconds: getEpochMicroseconds,
  epochNanoseconds: getEpochNanoseconds,
}

// Misc
// -------------------------------------------------------------------------------------------------

export function neverValueOf() {
  throw new TypeError(errorMessages.forbiddenValueOf)
}

export function getCalendarFromSlots({ calendar }: { calendar: CalendarSlot }): Calendar {
  return typeof calendar === 'string'
    ? new Calendar(calendar)
    : calendar
}