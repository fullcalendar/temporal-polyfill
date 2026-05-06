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
import {
  dateGetterFieldNames,
  monthDayGetterFieldNames,
  timeFieldNamesAsc,
  yearMonthGetterFieldNames,
} from '../internal/fieldNames'
import { computeIsoDayOfWeek, computeIsoWeekFields } from '../internal/isoMath'
import { DurationSlots, getEpochMilli, getEpochNano } from '../internal/slots'
import { mapPropNames } from '../internal/utils'

// For PlainDate/etc
// -----------------------------------------------------------------------------

const calendarGetterQueries = {
  era: (slots: any) => {
    return computeCalendarEraFields(slots.calendar, slots).era
  },
  eraYear: (slots: any) => {
    return computeCalendarEraFields(slots.calendar, slots).eraYear
  },
  year: (slots: any) => {
    return computeCalendarDateFields(slots.calendar, slots).year
  },
  month: (slots: any) => {
    return computeCalendarDateFields(slots.calendar, slots).month
  },
  day: (slots: any) => {
    return computeCalendarDateFields(slots.calendar, slots).day
  },
  monthCode: (slots: any) => computeCalendarMonthCode(slots.calendar, slots),
  inLeapYear: (slots: any) => computeCalendarInLeapYear(slots.calendar, slots),
  monthsInYear: (slots: any) =>
    computeCalendarMonthsInYear(slots.calendar, slots),
  daysInMonth: (slots: any) =>
    computeCalendarDaysInMonth(slots.calendar, slots),
  daysInYear: (slots: any) => computeCalendarDaysInYear(slots.calendar, slots),
  dayOfWeek: computeIsoDayOfWeek,
  daysInWeek: () => 7,
  dayOfYear: (slots: any) => computeCalendarDayOfYear(slots.calendar, slots),
  weekOfYear: (slots: any) =>
    slots.calendar === isoCalendar
      ? computeIsoWeekFields(slots).weekOfYear
      : undefined,
  yearOfWeek: (slots: any) =>
    slots.calendar === isoCalendar
      ? computeIsoWeekFields(slots).yearOfWeek
      : undefined,
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
