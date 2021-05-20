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
