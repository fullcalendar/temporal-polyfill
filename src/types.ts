export type CalendarType = 'iso8601' | 'gregory'

export type TimeZoneType = 'utc' | 'local'

export type LocaleType = 'en-US'

export type ExpandedDateTimeType = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  millisecond: number
}
export type ExpandedDateTimeUnitType = keyof ExpandedDateTimeType

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

// TODO: Currently unused, might be useful for durations later down the line
export enum MS_FROM {
  SECOND = 1000,
  MINUTE = SECOND * 60,
  HOUR = MINUTE * 60,
  DAY = HOUR * 24,
  WEEK = DAY * 7,
}
