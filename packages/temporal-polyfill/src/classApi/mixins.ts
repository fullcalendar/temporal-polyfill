import {
  queryNativeDateParts,
  queryNativeDay,
  queryNativeDayOfYear,
  queryNativeDaysInMonth,
  queryNativeDaysInYear,
  queryNativeEraParts,
  queryNativeInLeapYear,
  queryNativeMonthCode,
  queryNativeMonthsInYear,
  queryNativeWeekOfYear,
  queryNativeYearOfWeek,
} from '../internal/calendarNativeQuery'
import { durationFieldNamesAsc } from '../internal/durationFields'
import * as errorMessages from '../internal/errorMessages'
import { timeFieldNamesAsc } from '../internal/fields'
import { isoTimeFieldNamesAsc } from '../internal/isoFields'
import { computeIsoDayOfWeek, computeIsoDaysInWeek } from '../internal/isoMath'
import { DurationSlots, getEpochMilli, getEpochNano } from '../internal/slots'
import { mapPropNames } from '../internal/utils'
import {
  dateRefiners,
  dayOnlyRefiners,
  monthOnlyRefiners,
  yearMonthOnlyRefiners,
} from './calendarRefiners'

// For PlainDate/etc
// -----------------------------------------------------------------------------

const calendarGetterQueries = {
  era: (slots: any) => queryNativeEraParts(slots.calendar, slots)[0],
  eraYear: (slots: any) => queryNativeEraParts(slots.calendar, slots)[1],
  year: (slots: any) => queryNativeDateParts(slots.calendar, slots)[0],
  month: (slots: any) => queryNativeDateParts(slots.calendar, slots)[1],
  day: (slots: any) => queryNativeDay(slots.calendar, slots),
  monthCode: (slots: any) => queryNativeMonthCode(slots.calendar, slots),
  inLeapYear: (slots: any) => queryNativeInLeapYear(slots.calendar, slots),
  monthsInYear: (slots: any) => queryNativeMonthsInYear(slots.calendar, slots),
  daysInMonth: (slots: any) => queryNativeDaysInMonth(slots.calendar, slots),
  daysInYear: (slots: any) => queryNativeDaysInYear(slots.calendar, slots),
  dayOfWeek: computeIsoDayOfWeek,
  daysInWeek: computeIsoDaysInWeek,
  dayOfYear: (slots: any) => queryNativeDayOfYear(slots.calendar, slots),
  weekOfYear: (slots: any) => queryNativeWeekOfYear(slots.calendar, slots),
  yearOfWeek: (slots: any) => queryNativeYearOfWeek(slots.calendar, slots),
}

function createCalendarGetters<M>(methodNameMap: M): {
  [K in keyof M]: () => any
} {
  const methods = {} as any

  for (const methodName in methodNameMap) {
    const getter =
      calendarGetterQueries[methodName as keyof typeof calendarGetterQueries]
    methods[methodName] = function (this: any, slots: any) {
      return getter(slots)
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
  epochMilliseconds: getEpochMilli,
  epochNanoseconds: getEpochNano,
}

// Misc
// -----------------------------------------------------------------------------

export function neverValueOf() {
  throw new TypeError(errorMessages.forbiddenValueOf)
}
