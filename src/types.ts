export type CalendarType = 'iso8601' | 'gregory'

export type TimeZoneType = 'utc' | 'local'

export type LocaleType = 'en-US'

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

export type RoundType = {
  smallestUnit: DurationUnitType
  largestUnit: DurationUnitType
  roundingIncrement: number
  roundingMode: 'halfExpand' | 'ceil' | 'trunc' | 'floor'
}
export type RoundLikeType = Partial<RoundType>

export type CompareReturnType = -1 | 0 | 1

export enum UNIT_INCREMENT {
  SECOND = 1000,
  MINUTE = 60,
  HOUR = 60,
  DAY = 24,
  WEEK = 7,
  MONTH = 4.34524, // There's problems with using a static number for something thats constantly different
  YEAR = 12,
}

export enum MS_FROM {
  SECOND = UNIT_INCREMENT.SECOND,
  MINUTE = SECOND * UNIT_INCREMENT.MINUTE,
  HOUR = MINUTE * UNIT_INCREMENT.HOUR,
  DAY = HOUR * UNIT_INCREMENT.DAY,
  WEEK = DAY * UNIT_INCREMENT.WEEK,
}
