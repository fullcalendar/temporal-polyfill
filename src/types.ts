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
export enum UNIT_INCREMENT {
  SECOND = 1000,
  MINUTE = 60,
  HOUR = 60,
  DAY = 24,
  WEEK = 7,
  // MONTH = ???
  YEAR = 12,
}

export enum MS_FROM {
  SECOND = UNIT_INCREMENT.SECOND,
  MINUTE = SECOND * UNIT_INCREMENT.MINUTE,
  HOUR = MINUTE * UNIT_INCREMENT.HOUR,
  DAY = HOUR * UNIT_INCREMENT.DAY,
  WEEK = DAY * UNIT_INCREMENT.WEEK,
}
