import { Calendar } from './calendar'

export type CalendarId =
  | 'buddhist'
  | 'chinese'
  | 'coptic'
  | 'ethiopia'
  | 'ethiopic'
  | 'gregory'
  | 'hebrew'
  | 'indian'
  | 'islamic'
  | 'iso8601'
  | 'japanese'
  | 'persian'
  | 'roc'

export type TimeZoneId = 'utc' | 'local' | string

export type LocaleId = 'en-US'

export type PlainDate = {
  isoYear: number
  isoMonth: number
  isoDay: number
}
export type PlainTime = {
  isoHour: number
  isoMinute: number
  isoSecond: number
  isoMillisecond: number
}
export type PlainDateTimeFields = PlainDate &
  PlainTime & { calendar?: Calendar | CalendarId }
export type PlainDateTimeLike = Partial<PlainDateTimeFields>

export type DurationFields = {
  years: number
  months: number
  weeks: number
  days: number
  hours: number
  minutes: number
  seconds: number
  milliseconds: number
}
export type DurationLike = Partial<DurationFields>
export type DurationUnit = keyof DurationFields

export type RoundMode = 'halfExpand' | 'ceil' | 'trunc' | 'floor'
export type RoundOptions = {
  smallestUnit: DurationUnit | 'auto'
  largestUnit: DurationUnit | 'auto'
  roundingIncrement: number
  roundingMode: RoundMode
}
export type RoundOptionsLike = Partial<RoundOptions>

export type AssignmentOptions = { overflow: 'constrain' | 'reject' }
export type AssignmentOptionsLike = Partial<AssignmentOptions>

export type CompareReturn = -1 | 0 | 1

export enum UNIT_INCREMENT {
  MILLISECOND = 1,
  SECOND = 1000,
  MINUTE = 60,
  HOUR = 60,
  DAY = 24,
  WEEK = 7,
  /** @deprecated This increment should not be used, it should instead defer to a calendar */
  MONTH = 4.34524,
  /** @deprecated This increment should not be used, it should instead defer to a calendar */
  YEAR = 12,
}

/** Constructs a type with specified properties set to required and the rest as optional */
export type Part<A, B extends keyof A> = Required<Pick<A, B>> & Partial<A>
