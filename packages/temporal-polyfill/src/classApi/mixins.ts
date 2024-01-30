import { createNativeStandardOps } from '../internal/calendarNativeQuery'
import {
  DurationFields,
  durationFieldNamesAsc,
} from '../internal/durationFields'
import * as errorMessages from '../internal/errorMessages'
import { timeFieldNamesAsc } from '../internal/fields'
import { IsoDateFields, isoTimeFieldNamesAsc } from '../internal/isoFields'
import {
  PlainDateBranding,
  PlainMonthDayBranding,
  PlainYearMonthBranding,
  createPlainDateSlots,
  getEpochMicroseconds,
  getEpochMilliseconds,
  getEpochNanoseconds,
  getEpochSeconds,
  getId,
} from '../internal/slots'
import { Callable, mapPropNames, mapProps } from '../internal/utils'
import { Calendar, CalendarProtocol } from './calendar'
import {
  dateOnlyRefiners,
  dateRefiners,
  dayOnlyRefiners,
  monthOnlyRefiners,
  yearMonthOnlyRefiners,
} from './calendarRefiners'
import { createPlainDate, toPlainDateSlots } from './plainDate'
import { CalendarSlot, getSlots } from './slotClass'

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
  (propName: keyof DurationFields) => {
    return function (this: any, slots: any) {
      return slots[propName]
    }
  },
  durationFieldNamesAsc,
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
  epochSeconds: getEpochSeconds,
  epochMilliseconds: getEpochMilliseconds,
  epochMicroseconds: getEpochMicroseconds,
  epochNanoseconds: getEpochNanoseconds,
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
