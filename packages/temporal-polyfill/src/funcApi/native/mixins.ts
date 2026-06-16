import type { DurationFields } from '../../internal/durationFields'
import type {
  DateFields,
  DateStats,
  MonthDayFields,
  TimeFields,
  YearMonthFields,
  YearMonthStats,
} from '../../internal/fieldTypes'

export const durationGetters = {
  nanoseconds(slots: DurationFields): number {
    return slots.nanoseconds
  },

  microseconds(slots: DurationFields): number {
    return slots.microseconds
  },

  milliseconds(slots: DurationFields): number {
    return slots.milliseconds
  },

  seconds(slots: DurationFields): number {
    return slots.seconds
  },

  minutes(slots: DurationFields): number {
    return slots.minutes
  },

  hours(slots: DurationFields): number {
    return slots.hours
  },

  days(slots: DurationFields): number {
    return slots.days
  },

  weeks(slots: DurationFields): number {
    return slots.weeks
  },

  months(slots: DurationFields): number {
    return slots.months
  },

  years(slots: DurationFields): number {
    return slots.years
  },
} as const

export const timeGetters = {
  nanosecond(slots: TimeFields): number {
    return slots.nanosecond
  },

  microsecond(slots: TimeFields): number {
    return slots.microsecond
  },

  millisecond(slots: TimeFields): number {
    return slots.millisecond
  },

  second(slots: TimeFields): number {
    return slots.second
  },

  minute(slots: TimeFields): number {
    return slots.minute
  },

  hour(slots: TimeFields): number {
    return slots.hour
  },
} as const

export const yearMonthFieldGetters = {
  era(slots: YearMonthFields): string | undefined {
    return slots.era
  },

  eraYear(slots: YearMonthFields): number | undefined {
    return slots.eraYear
  },

  year(slots: YearMonthFields): number {
    return slots.year
  },

  month(slots: YearMonthFields): number {
    return slots.month
  },

  monthCode(slots: YearMonthFields): string {
    return slots.monthCode
  },
} as const

export const dateFieldGetters = {
  era(slots: DateFields): string | undefined {
    return slots.era
  },

  eraYear(slots: DateFields): number | undefined {
    return slots.eraYear
  },

  year(slots: DateFields): number {
    return slots.year
  },

  month(slots: DateFields): number {
    return slots.month
  },

  monthCode(slots: DateFields): string {
    return slots.monthCode
  },

  day(slots: DateFields): number {
    return slots.day
  },
} as const

export const monthDayFieldGetters = {
  month(slots: MonthDayFields): number {
    return slots.month
  },

  monthCode(slots: MonthDayFields): string {
    return slots.monthCode
  },

  day(slots: MonthDayFields): number {
    return slots.day
  },
} as const

export const monthCodeDayFieldGetters = {
  monthCode(slots: Pick<MonthDayFields, 'monthCode' | 'day'>): string {
    return slots.monthCode
  },

  day(slots: Pick<MonthDayFields, 'monthCode' | 'day'>): number {
    return slots.day
  },
} as const

export const yearMonthDerivedGetters = {
  daysInMonth(slots: YearMonthStats): number {
    return slots.daysInMonth
  },

  daysInYear(slots: YearMonthStats): number {
    return slots.daysInYear
  },

  monthsInYear(slots: YearMonthStats): number {
    return slots.monthsInYear
  },

  inLeapYear(slots: YearMonthStats): boolean {
    return slots.inLeapYear
  },
} as const

export const dateDerivedGetters = {
  dayOfWeek(slots: DateStats): number {
    return slots.dayOfWeek
  },

  dayOfYear(slots: DateStats): number {
    return slots.dayOfYear
  },

  weekOfYear(slots: DateStats): number | undefined {
    return slots.weekOfYear
  },

  yearOfWeek(slots: DateStats): number | undefined {
    return slots.yearOfWeek
  },

  daysInWeek(slots: DateStats): number {
    return slots.daysInWeek
  },

  daysInMonth(slots: DateStats): number {
    return slots.daysInMonth
  },

  daysInYear(slots: DateStats): number {
    return slots.daysInYear
  },

  monthsInYear(slots: DateStats): number {
    return slots.monthsInYear
  },

  inLeapYear(slots: DateStats): boolean {
    return slots.inLeapYear
  },
} as const
