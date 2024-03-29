import { createNativeStandardOps } from '../internal/calendarNativeQuery'
import { durationFieldNamesAsc } from '../internal/durationFields'
import * as errorMessages from '../internal/errorMessages'
import { timeFieldNamesAsc } from '../internal/fields'
import { IsoDateFields, isoTimeFieldNamesAsc } from '../internal/isoFields'
import {
  DurationSlots,
  PlainDateBranding,
  PlainMonthDayBranding,
  PlainYearMonthBranding,
  createPlainDateSlots,
  getEpochMicro,
  getEpochMilli,
  getEpochNano,
  getEpochSec,
  getId,
} from '../internal/slots'
import {
  Callable,
  bindArgs,
  excludePropsByName,
  mapPropNames,
  mapProps,
} from '../internal/utils'
import { Calendar, CalendarProtocol, CalendarSlot } from './calendar'
import {
  dateOnlyRefiners,
  dateRefiners,
  dayOnlyRefiners,
  monthOnlyRefiners,
  yearMonthOnlyRefiners,
} from './calendarRefiners'
import { createPlainDate, toPlainDateSlots } from './plainDate'
import { getSlots } from './slotClass'

// For Calendar
// -----------------------------------------------------------------------------
// Always assumes underlying Native calendar `ops`

function createCalendarFieldMethods<M>(
  methodNameMap: M,
  alsoAccept: string[],
): {
  [K in keyof M]: (dateArg: any) => any
} {
  const methods = {} as any

  for (const methodName in methodNameMap) {
    methods[methodName] = function (this: any, { native }: any, dateArg: any) {
      const argSlots = (getSlots(dateArg) || {}) as any
      const { branding } = argSlots
      const refinedSlots =
        branding === PlainDateBranding || alsoAccept.includes(branding)
          ? argSlots
          : toPlainDateSlots(dateArg)

      return (native as any)[methodName](refinedSlots)
    }
  }

  return methods
}

export const calendarFieldMethods = {
  ...createCalendarFieldMethods(yearMonthOnlyRefiners, [
    PlainYearMonthBranding,
  ]),
  ...createCalendarFieldMethods(dateOnlyRefiners, []),
  ...createCalendarFieldMethods(monthOnlyRefiners, [
    PlainYearMonthBranding,
    PlainMonthDayBranding,
  ]),
  ...createCalendarFieldMethods(dayOnlyRefiners, [PlainMonthDayBranding]),
}

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
// -----------------------------------------------------------------------------

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
          createPlainDate(createPlainDateSlots(isoFields, calendarProtocol)),
        ),
      )
    }
  },
  dateRefiners as Record<string, Callable>,
) as AdapterSimpleOps

function createAdapterSimpleOps(
  calendarProtocol: CalendarProtocol,
): AdapterSimpleOps {
  return Object.assign(Object.create(adapterSimpleOps), {
    calendarProtocol,
  } as AdapterSimpleState)
}

function createSimpleOps(calendarSlot: CalendarSlot): AdapterSimpleOps {
  if (typeof calendarSlot === 'string') {
    return createNativeStandardOps(calendarSlot) // has everything
  }
  return createAdapterSimpleOps(calendarSlot)
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

export function createCalendarFromSlots({
  calendar,
}: { calendar: CalendarSlot }): Calendar {
  return typeof calendar === 'string' ? new Calendar(calendar) : calendar
}

// for getISOFields
export const removeBranding = bindArgs(
  excludePropsByName,
  new Set([/*@__KEY__*/ 'branding']),
)
