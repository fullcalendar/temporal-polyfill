// Fields
// -----------------------------------------------------------------------------

export interface EraYearFields {
  era: string
  eraYear: number
}

export type YearFields = Partial<EraYearFields> & { year: number }

export interface MonthFields {
  monthCode: string
  month: number
}

export interface DayFields {
  day: number
}

export type YearMonthFields = YearFields & MonthFields
export type DateFields = YearMonthFields & DayFields
export type MonthDayFields = MonthFields & DayFields

export interface TimeFields {
  hour: number
  microsecond: number
  millisecond: number
  minute: number
  nanosecond: number
  second: number
}

export type DateTimeFields = DateFields & TimeFields

// Split-Format
export type EraYearOrYear = EraYearFields | { year: number }

// Stats
// -----------------------------------------------------------------------------

export interface YearStats {
  daysInYear: number
  inLeapYear: boolean
  monthsInYear: number
}

export interface YearMonthStats extends YearStats {
  daysInMonth: number
}

export interface DateStats extends YearMonthStats {
  dayOfWeek: number
  dayOfYear: number
  weekOfYear: number
  yearOfWeek: number
  daysInWeek: number
}

// Object-like
// -----------------------------------------------------------------------------

export type DateLikeObject = Partial<DateFields> & { calendar?: string }
export type DateTimeLikeObject = Partial<DateTimeFields> & {
  calendar?: string
}
export type ZonedDateTimeLikeObject = DateTimeLikeObject & {
  timeZone: string
  offset?: string
}
// after dateFieldRefiners does its thing
export type ZonedDateTimeRefinedObject = DateTimeLikeObject & {
  timeZone: string
  offset?: number
}
export type YearMonthLikeObject = Partial<YearMonthFields> & {
  calendar?: string
}
export type MonthDayLikeObject = Partial<MonthDayFields> & { calendar?: string }

// Misc. Poor names.
// -----------------------------------------------------------------------------

export interface CalendarDateFields {
  day: number
  month: number
  year: number
}

export interface CalendarEraFields {
  era?: string
  eraYear?: number
}

export interface CalendarYearMonthFields {
  month: number
  year: number
}

export interface CalendarWeekFields {
  weekOfYear?: number
  weeksInYear?: number
  yearOfWeek?: number
}
