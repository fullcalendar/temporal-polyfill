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
export type PlainDateTimeType = PlainDateType & PlainTimeType

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
  MONTH = 4.34524, // FIXME: There's problems with using a static number for something thats constantly different
  YEAR = 12,
}
