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
import {
  type InternalCalendar,
  getInternalCalendarId,
  isoCalendar,
} from '../internal/externalCalendar'
import { timeFieldNamesAsc } from '../internal/fieldNames'
import { CalendarDateFields } from '../internal/fieldTypes'
import {
  computeIsoDayOfWeek,
  computeIsoWeekFields,
} from '../internal/isoCalendarMath'
import {
  getEpochMicro,
  getEpochMilli,
  getEpochNano,
  getEpochSec,
} from '../internal/slots'
import { zipPropsGenerator } from '../internal/utils'

// For PlainDate/etc
// -----------------------------------------------------------------------------

const day = (slots: CalendarDateFields & { calendar: InternalCalendar }) =>
  computeCalendarDateFields(slots.calendar, slots).day

const monthCode = (
  slots: CalendarDateFields & { calendar: InternalCalendar },
) => computeCalendarMonthCode(slots.calendar, slots)

const yearMonthFieldGetters = {
  era(slots: any) {
    return computeCalendarEraFields(slots.calendar, slots).era
  },
  eraYear(slots: any) {
    return computeCalendarEraFields(slots.calendar, slots).eraYear
  },
  year(slots: any) {
    return computeCalendarDateFields(slots.calendar, slots).year
  },
  monthCode,
  month(slots: any) {
    return computeCalendarDateFields(slots.calendar, slots).month
  },
}

export const dateFieldGetters = {
  ...yearMonthFieldGetters,
  day,
}

export const monthDayFieldGetters = {
  monthCode,
  day,
}

const yearMonthStatsGetters = {
  daysInMonth(slots: any) {
    return computeCalendarDaysInMonth(slots.calendar, slots)
  },
  daysInYear(slots: any) {
    return computeCalendarDaysInYear(slots.calendar, slots)
  },
  inLeapYear(slots: any) {
    return computeCalendarInLeapYear(slots.calendar, slots)
  },
  monthsInYear(slots: any) {
    return computeCalendarMonthsInYear(slots.calendar, slots)
  },
}

const dateOnlyStatsGetters = {
  weekOfYear(slots: any) {
    return slots.calendar === isoCalendar
      ? computeIsoWeekFields(slots).weekOfYear
      : undefined
  },
  dayOfWeek: computeIsoDayOfWeek,
  dayOfYear(slots: any) {
    return computeCalendarDayOfYear(slots.calendar, slots)
  },
  yearOfWeek(slots: any) {
    return slots.calendar === isoCalendar
      ? computeIsoWeekFields(slots).yearOfWeek
      : undefined
  },
  daysInWeek() {
    return 7
  },
}

const dateStatsGetters = { ...yearMonthStatsGetters, ...dateOnlyStatsGetters }

export const dateGetters = { ...dateFieldGetters, ...dateStatsGetters }
export const yearMonthGetters = {
  ...yearMonthFieldGetters,
  ...yearMonthStatsGetters,
}
export const calendarIdGetters = {
  calendarId(slots: any): string {
    return getInternalCalendarId(slots.calendar)
  },
}

const createSlotGetter = (propName: string) => (slots: any) => slots[propName]

export const durationFieldGetters = zipPropsGenerator(
  durationFieldNamesAsc,
  createSlotGetter,
)

export const timeGetters = zipPropsGenerator(
  timeFieldNamesAsc,
  createSlotGetter,
)

export const epochGetters = {
  epochSeconds: getEpochSec,
  epochMilliseconds: getEpochMilli,
  epochMicroseconds: getEpochMicro,
  epochNanoseconds: getEpochNano,
}
