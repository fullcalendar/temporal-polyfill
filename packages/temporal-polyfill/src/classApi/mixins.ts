import {
  queryCalendarDateFields,
  queryCalendarDay,
  queryCalendarDayOfYear,
  queryCalendarDaysInMonth,
  queryCalendarDaysInYear,
  queryCalendarEraFields,
  queryCalendarInLeapYear,
  queryCalendarMonthCode,
  queryCalendarMonthsInYear,
  queryCalendarWeekOfYear,
  queryCalendarYearOfWeek,
} from '../internal/calendarQuery'
import { durationFieldNamesAsc } from '../internal/durationFields'
import * as errorMessages from '../internal/errorMessages'
import { timeFieldNamesAsc } from '../internal/fieldNames'
import { computeIsoDayOfWeek } from '../internal/isoMath'
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
  era: (slots: any) => queryCalendarEraFields(slots.calendar, slots).era,
  eraYear: (slots: any) =>
    queryCalendarEraFields(slots.calendar, slots).eraYear,
  year: (slots: any) => queryCalendarDateFields(slots.calendar, slots).year,
  month: (slots: any) => queryCalendarDateFields(slots.calendar, slots).month,
  day: (slots: any) => queryCalendarDay(slots.calendar, slots),
  monthCode: (slots: any) => queryCalendarMonthCode(slots.calendar, slots),
  inLeapYear: (slots: any) => queryCalendarInLeapYear(slots.calendar, slots),
  monthsInYear: (slots: any) =>
    queryCalendarMonthsInYear(slots.calendar, slots),
  daysInMonth: (slots: any) => queryCalendarDaysInMonth(slots.calendar, slots),
  daysInYear: (slots: any) => queryCalendarDaysInYear(slots.calendar, slots),
  dayOfWeek: computeIsoDayOfWeek,
  daysInWeek: () => 7,
  dayOfYear: (slots: any) => queryCalendarDayOfYear(slots.calendar, slots),
  weekOfYear: (slots: any) => queryCalendarWeekOfYear(slots.calendar, slots),
  yearOfWeek: (slots: any) => queryCalendarYearOfWeek(slots.calendar, slots),
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
    return slots[timeFieldNamesAsc[i]]
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
