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
import {
  dateGetterFieldNames,
  monthDayGetterFieldNames,
  timeFieldNamesAsc,
  yearMonthGetterFieldNames,
} from '../internal/fieldNames'
import { computeIsoDayOfWeek } from '../internal/isoMath'
import { DurationSlots, getEpochMilli, getEpochNano } from '../internal/slots'
import { mapPropNames } from '../internal/utils'

// For PlainDate/etc
// -----------------------------------------------------------------------------

const calendarGetterQueries = {
  era: (slots: any) =>
    queryCalendarEraFields(slots.calendar, slots.isoDate).era,
  eraYear: (slots: any) =>
    queryCalendarEraFields(slots.calendar, slots.isoDate).eraYear,
  year: (slots: any) =>
    queryCalendarDateFields(slots.calendar, slots.isoDate).year,
  month: (slots: any) =>
    queryCalendarDateFields(slots.calendar, slots.isoDate).month,
  day: (slots: any) => queryCalendarDay(slots.calendar, slots.isoDate),
  monthCode: (slots: any) =>
    queryCalendarMonthCode(slots.calendar, slots.isoDate),
  inLeapYear: (slots: any) =>
    queryCalendarInLeapYear(slots.calendar, slots.isoDate),
  monthsInYear: (slots: any) =>
    queryCalendarMonthsInYear(slots.calendar, slots.isoDate),
  daysInMonth: (slots: any) =>
    queryCalendarDaysInMonth(slots.calendar, slots.isoDate),
  daysInYear: (slots: any) =>
    queryCalendarDaysInYear(slots.calendar, slots.isoDate),
  dayOfWeek: (slots: any) => computeIsoDayOfWeek(slots.isoDate),
  daysInWeek: () => 7,
  dayOfYear: (slots: any) =>
    queryCalendarDayOfYear(slots.calendar, slots.isoDate),
  weekOfYear: (slots: any) =>
    queryCalendarWeekOfYear(slots.calendar, slots.isoDate),
  yearOfWeek: (slots: any) =>
    queryCalendarYearOfWeek(slots.calendar, slots.isoDate),
}

function createCalendarGetters<K extends keyof typeof calendarGetterQueries>(
  methodNames: K[],
): {
  [P in K]: () => any
} {
  const methods = {} as any

  for (let i = 0; i < methodNames.length; i++) {
    const methodName = methodNames[i]
    const getter = calendarGetterQueries[methodName]
    methods[methodName] = function (this: any, slots: any) {
      return getter(slots)
    }
  }

  return methods
}

export const dateGetters = createCalendarGetters(dateGetterFieldNames)
export const yearMonthGetters = createCalendarGetters(yearMonthGetterFieldNames)
export const monthDayGetters = createCalendarGetters(monthDayGetterFieldNames)
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
    return slots.time[timeFieldNamesAsc[i]]
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
