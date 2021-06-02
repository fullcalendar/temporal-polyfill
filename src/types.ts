import { Calendar } from './calendar'

export type CalendarType =
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

export type TimeZoneType = 'utc' | 'local' | string

export type LocaleType = 'en-US'

export type PlainDateType = {
  isoYear: number
  isoMonth: number
  isoDay: number
}
export type PlainTimeType = {
  isoHour: number
  isoMinute: number
  isoSecond: number
  isoMillisecond: number
}
export type PlainDateTimeType = PlainDateType &
  PlainTimeType & { calendar?: Calendar | CalendarType }
export type PlainDateTimeLikeType = Partial<PlainDateTimeType>

export type DurationType = {
  years: number
  months: number
  weeks: number
  days: number
  hours: number
  minutes: number
  seconds: number
  milliseconds: number
}
export type DurationLikeType = Partial<DurationType>
export type DurationUnitType = keyof DurationType

export type RoundModeType = 'halfExpand' | 'ceil' | 'trunc' | 'floor'
export type RoundOptionsType = {
  smallestUnit: DurationUnitType
  largestUnit: DurationUnitType
  roundingIncrement: number
  roundingMode: RoundModeType
}
export type RoundOptionsLikeType = Partial<RoundOptionsType>

export type AssignmentOptionsType = { overflow: 'constrain' | 'reject' }
export type AssignmentOptionsLikeType = Partial<AssignmentOptionsType>

export type CompareReturnType = -1 | 0 | 1

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
