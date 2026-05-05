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
import { getInternalCalendar } from '../internal/externalCalendar'
import {
  dateGetterFieldNames,
  monthDayGetterFieldNames,
  timeFieldNamesAsc,
  yearMonthGetterFieldNames,
} from '../internal/fieldNames'
import { isoCalendarId } from '../internal/intlCalendarConfig'
import { computeIsoDayOfWeek, computeIsoWeekFields } from '../internal/isoMath'
import { DurationSlots, getEpochMilli, getEpochNano } from '../internal/slots'
import { mapPropNames } from '../internal/utils'

// For PlainDate/etc
// -----------------------------------------------------------------------------

const calendarGetterQueries = {
  era: (slots: any) => {
    const calendar = getInternalCalendar(slots.calendarId)
    return computeCalendarEraFields(calendar, slots).era
  },
  eraYear: (slots: any) => {
    const calendar = getInternalCalendar(slots.calendarId)
    return computeCalendarEraFields(calendar, slots).eraYear
  },
  year: (slots: any) => {
    const calendar = getInternalCalendar(slots.calendarId)
    return computeCalendarDateFields(calendar, slots).year
  },
  month: (slots: any) => {
    const calendar = getInternalCalendar(slots.calendarId)
    return computeCalendarDateFields(calendar, slots).month
  },
  day: (slots: any) => {
    const calendar = getInternalCalendar(slots.calendarId)
    return computeCalendarDateFields(calendar, slots).day
  },
  monthCode: (slots: any) =>
    computeCalendarMonthCode(getInternalCalendar(slots.calendarId), slots),
  inLeapYear: (slots: any) =>
    computeCalendarInLeapYear(getInternalCalendar(slots.calendarId), slots),
  monthsInYear: (slots: any) =>
    computeCalendarMonthsInYear(getInternalCalendar(slots.calendarId), slots),
  daysInMonth: (slots: any) =>
    computeCalendarDaysInMonth(getInternalCalendar(slots.calendarId), slots),
  daysInYear: (slots: any) =>
    computeCalendarDaysInYear(getInternalCalendar(slots.calendarId), slots),
  dayOfWeek: (slots: any) => computeIsoDayOfWeek(slots),
  daysInWeek: () => 7,
  dayOfYear: (slots: any) =>
    computeCalendarDayOfYear(getInternalCalendar(slots.calendarId), slots),
  weekOfYear: (slots: any) =>
    slots.calendarId === isoCalendarId
      ? computeIsoWeekFields(slots).weekOfYear
      : undefined,
  yearOfWeek: (slots: any) =>
    slots.calendarId === isoCalendarId
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
