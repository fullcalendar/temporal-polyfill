import {
  computeCalendarDateFields,
  computeCalendarDayOfYear,
  computeCalendarDaysInMonth,
  computeCalendarDaysInYear,
  computeCalendarEraFields,
  computeCalendarInLeapYear,
  computeCalendarMonthCode,
  computeCalendarMonthsInYear,
  computeCalendarWeekOfYear,
  computeCalendarYearOfWeek,
} from '../internal/calendarDerived'
import { CalendarImpl } from '../internal/calendarImpl'
import { CalendarDateFields } from '../internal/fieldTypes'
import { computeIsoDayOfWeek } from '../internal/isoCalendarMath'

// Keep these maps initialized in the same modules as their field-name arrays.
// Building them here from imports can hit bundled circular-init TDZs.
export { durationGetters } from '../internal/durationFields'
export { timeGetters } from '../internal/fieldNames'

type CalendarDateSlots = CalendarDateFields & { calendar: CalendarImpl }

/*
The below mixins are intentionally NOT deduplicated via spreading
gzip liked it better this way
*/

export const yearMonthFieldGetters = {
  era(slots: CalendarDateSlots): string | undefined {
    return computeCalendarEraFields(slots.calendar, slots).era
  },

  eraYear(slots: CalendarDateSlots): number | undefined {
    return computeCalendarEraFields(slots.calendar, slots).eraYear
  },

  year(slots: CalendarDateSlots): number {
    return computeCalendarDateFields(slots.calendar, slots).year
  },

  month(slots: CalendarDateSlots): number {
    return computeCalendarDateFields(slots.calendar, slots).month
  },

  monthCode(slots: CalendarDateSlots): string {
    return computeCalendarMonthCode(slots.calendar, slots)
  },
} as const

export const dateFieldGetters = {
  era(slots: CalendarDateSlots): string | undefined {
    return computeCalendarEraFields(slots.calendar, slots).era
  },

  eraYear(slots: CalendarDateSlots): number | undefined {
    return computeCalendarEraFields(slots.calendar, slots).eraYear
  },

  year(slots: CalendarDateSlots): number {
    return computeCalendarDateFields(slots.calendar, slots).year
  },

  month(slots: CalendarDateSlots): number {
    return computeCalendarDateFields(slots.calendar, slots).month
  },

  monthCode(slots: CalendarDateSlots): string {
    return computeCalendarMonthCode(slots.calendar, slots)
  },

  day(slots: CalendarDateSlots): number {
    return computeCalendarDateFields(slots.calendar, slots).day
  },
} as const

export const monthDayFieldGetters = {
  month(slots: CalendarDateSlots): number {
    return computeCalendarDateFields(slots.calendar, slots).month
  },

  monthCode(slots: CalendarDateSlots): string {
    return computeCalendarMonthCode(slots.calendar, slots)
  },

  day(slots: CalendarDateSlots): number {
    return computeCalendarDateFields(slots.calendar, slots).day
  },
} as const

export const yearMonthDerivedGetters = {
  daysInMonth(slots: CalendarDateSlots): number {
    return computeCalendarDaysInMonth(slots.calendar, slots)
  },

  daysInYear(slots: CalendarDateSlots): number {
    return computeCalendarDaysInYear(slots.calendar, slots)
  },

  monthsInYear(slots: CalendarDateSlots): number {
    return computeCalendarMonthsInYear(slots.calendar, slots)
  },

  inLeapYear(slots: CalendarDateSlots): boolean {
    return computeCalendarInLeapYear(slots.calendar, slots)
  },
} as const

export const dateDerivedGetters = {
  dayOfWeek(slots: CalendarDateSlots): number {
    return computeIsoDayOfWeek(slots)
  },

  dayOfYear(slots: CalendarDateSlots): number {
    return computeCalendarDayOfYear(slots.calendar, slots)
  },

  weekOfYear(slots: CalendarDateSlots): number | undefined {
    return computeCalendarWeekOfYear(slots.calendar, slots)
  },

  yearOfWeek(slots: CalendarDateSlots): number | undefined {
    return computeCalendarYearOfWeek(slots.calendar, slots)
  },

  daysInWeek(): number {
    return 7
  },

  daysInMonth(slots: CalendarDateSlots): number {
    return computeCalendarDaysInMonth(slots.calendar, slots)
  },

  daysInYear(slots: CalendarDateSlots): number {
    return computeCalendarDaysInYear(slots.calendar, slots)
  },

  monthsInYear(slots: CalendarDateSlots): number {
    return computeCalendarMonthsInYear(slots.calendar, slots)
  },

  inLeapYear(slots: CalendarDateSlots): boolean {
    return computeCalendarInLeapYear(slots.calendar, slots)
  },
} as const
