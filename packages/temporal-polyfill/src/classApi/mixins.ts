import {
  computeCalendarDateFields,
  computeCalendarDayOfYear,
  computeCalendarDaysInMonth,
  computeCalendarDaysInYear,
  computeCalendarEraFields,
  computeCalendarInLeapYear,
  computeCalendarMonthCode,
  computeCalendarMonthsInYear,
} from '../internal/calendarDerived'
import { durationFieldNamesAsc } from '../internal/durationFields'
import * as errorMessages from '../internal/errorMessages'
import {
  getInternalCalendarId,
  isoCalendar,
} from '../internal/externalCalendar'
import { timeFieldNamesAsc } from '../internal/fieldNames'
import {
  computeIsoDayOfWeek,
  computeIsoWeekFields,
} from '../internal/isoCalendarMath'
import { DurationSlots, getEpochMilli, getEpochNano } from '../internal/slots'
import { mapPropNames } from '../internal/utils'

// For PlainDate/etc
// -----------------------------------------------------------------------------

type CalendarGetterQuery = (slots: any) => any

const era = (slots: any) => {
  return computeCalendarEraFields(slots.calendar, slots).era
}
const eraYear = (slots: any) => {
  return computeCalendarEraFields(slots.calendar, slots).eraYear
}
const year = (slots: any) => {
  return computeCalendarDateFields(slots.calendar, slots).year
}
const month = (slots: any) => {
  return computeCalendarDateFields(slots.calendar, slots).month
}
const day = (slots: any) => {
  return computeCalendarDateFields(slots.calendar, slots).day
}
const monthCode = (slots: any) =>
  computeCalendarMonthCode(slots.calendar, slots)
const daysInMonth = (slots: any) =>
  computeCalendarDaysInMonth(slots.calendar, slots)
const daysInYear = (slots: any) =>
  computeCalendarDaysInYear(slots.calendar, slots)
const inLeapYear = (slots: any) =>
  computeCalendarInLeapYear(slots.calendar, slots)
const monthsInYear = (slots: any) =>
  computeCalendarMonthsInYear(slots.calendar, slots)
const weekOfYear = (slots: any) =>
  slots.calendar === isoCalendar
    ? computeIsoWeekFields(slots).weekOfYear
    : undefined
const dayOfWeek = computeIsoDayOfWeek
const dayOfYear = (slots: any) =>
  computeCalendarDayOfYear(slots.calendar, slots)
const yearOfWeek = (slots: any) =>
  slots.calendar === isoCalendar
    ? computeIsoWeekFields(slots).yearOfWeek
    : undefined
const daysInWeek = () => 7

// Keep these query maps scoped to the Temporal classes that need them. A single
// master lookup object would make every getter implementation reachable through
// dynamic property access, which works against package consumers' tree-shaking.
const yearMonthGetterQueries = {
  era,
  eraYear,
  year,
  daysInMonth,
  daysInYear,
  inLeapYear,
  monthsInYear,
  monthCode,
  month,
}

const monthDayGetterQueries = {
  monthCode,
  day,
}

const dateGetterQueries = {
  ...yearMonthGetterQueries,
  day,
  weekOfYear,
  dayOfWeek,
  dayOfYear,
  yearOfWeek,
  daysInWeek,
}

function createCalendarGetters<Q extends Record<string, CalendarGetterQuery>>(
  queries: Q,
): {
  [P in keyof Q]: () => any
} {
  const methods = {} as any

  for (const methodName in queries) {
    const getter = queries[methodName]
    methods[methodName] = function (this: any, slots: any) {
      return getter(slots)
    }
  }

  return methods
}

export const dateGetters = createCalendarGetters(dateGetterQueries)
export const yearMonthGetters = createCalendarGetters(yearMonthGetterQueries)
export const monthDayGetters = createCalendarGetters(monthDayGetterQueries)
export const calendarIdGetters = {
  calendarId(slots: any): string {
    return getInternalCalendarId(slots.calendar)
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
