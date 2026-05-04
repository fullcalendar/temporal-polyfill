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
  dateGetterFieldNamesAsc,
  monthDayGetterFieldNamesAsc,
  timeFieldNamesAsc,
  yearMonthGetterFieldNamesAsc,
} from '../internal/fieldNames'
import { computeIsoDayOfWeek } from '../internal/isoMath'
import { DurationSlots, getEpochMilli, getEpochNano } from '../internal/slots'
import { mapPropNames } from '../internal/utils'

// For PlainDate/etc
// -----------------------------------------------------------------------------

const calendarGetterQueries = {
  era: (slots: any) => queryCalendarEraFields(slots.calendarId, slots).era,
  eraYear: (slots: any) =>
    queryCalendarEraFields(slots.calendarId, slots).eraYear,
  year: (slots: any) => queryCalendarDateFields(slots.calendarId, slots).year,
  month: (slots: any) => queryCalendarDateFields(slots.calendarId, slots).month,
  day: (slots: any) => queryCalendarDay(slots.calendarId, slots),
  monthCode: (slots: any) => queryCalendarMonthCode(slots.calendarId, slots),
  inLeapYear: (slots: any) => queryCalendarInLeapYear(slots.calendarId, slots),
  monthsInYear: (slots: any) =>
    queryCalendarMonthsInYear(slots.calendarId, slots),
  daysInMonth: (slots: any) =>
    queryCalendarDaysInMonth(slots.calendarId, slots),
  daysInYear: (slots: any) => queryCalendarDaysInYear(slots.calendarId, slots),
  dayOfWeek: (slots: any) => computeIsoDayOfWeek(slots),
  daysInWeek: () => 7,
  dayOfYear: (slots: any) => queryCalendarDayOfYear(slots.calendarId, slots),
  weekOfYear: (slots: any) => queryCalendarWeekOfYear(slots.calendarId, slots),
  yearOfWeek: (slots: any) => queryCalendarYearOfWeek(slots.calendarId, slots),
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

export const dateGetters = createCalendarGetters(dateGetterFieldNamesAsc)
export const yearMonthGetters = createCalendarGetters(
  yearMonthGetterFieldNamesAsc,
)
export const monthDayGetters = createCalendarGetters(
  monthDayGetterFieldNamesAsc,
)
export const calendarIdGetters = {
  calendarId(slots: any): string {
    return slots.calendarId // TODO: make smarter getter based on prop-name?
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
