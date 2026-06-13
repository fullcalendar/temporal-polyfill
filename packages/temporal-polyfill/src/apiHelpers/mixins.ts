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
import { DurationFields } from '../internal/durationFields'
import { CalendarDateFields, TimeFields } from '../internal/fieldTypes'
import { computeIsoDayOfWeek } from '../internal/isoCalendarMath'

type CalendarDateSlots = CalendarDateFields & { calendar: CalendarImpl }

/*
These accessors are the stored calendar date fields. defineTemporalClass owns
the receiver-to-slots lookup, so the maps only describe slot-to-value reads.
*/
export const calendarFieldGetters = {
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

/*
These fields are derived from the ISO date and calendar. Keeping them separate
lets record-style APIs reuse only the fields they actually expose as
properties.
*/
export const calendarDerivedGetters = {
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

/*
The same clock fields appear on PlainTime and PlainDateTime. Keeping them here
keeps their public field accessors in one shared map.
*/
export const timeGetters = {
  hour(slots: TimeFields): number {
    return slots.hour
  },

  minute(slots: TimeFields): number {
    return slots.minute
  },

  second(slots: TimeFields): number {
    return slots.second
  },

  millisecond(slots: TimeFields): number {
    return slots.millisecond
  },

  microsecond(slots: TimeFields): number {
    return slots.microsecond
  },

  nanosecond(slots: TimeFields): number {
    return slots.nanosecond
  },
} as const

// Duration exposes its stored fields directly.
export const durationGetters = {
  years(slots: DurationFields): number {
    return slots.years
  },

  months(slots: DurationFields): number {
    return slots.months
  },

  weeks(slots: DurationFields): number {
    return slots.weeks
  },

  days(slots: DurationFields): number {
    return slots.days
  },

  hours(slots: DurationFields): number {
    return slots.hours
  },

  minutes(slots: DurationFields): number {
    return slots.minutes
  },

  seconds(slots: DurationFields): number {
    return slots.seconds
  },

  milliseconds(slots: DurationFields): number {
    return slots.milliseconds
  },

  microseconds(slots: DurationFields): number {
    return slots.microseconds
  },

  nanoseconds(slots: DurationFields): number {
    return slots.nanoseconds
  },
} as const
