import { CompareResult } from '../public/types'

// local essentials

export interface LocalYearFields {
  year: number
}

export interface LocalYearMonthFields extends LocalYearFields {
  month: number
}

export interface LocalDateFields extends LocalYearMonthFields {
  day: number
}

export interface LocalMonthDayFields {
  monthCode: string
  day: number
}

export interface LocalTimeFields {
  hour: number
  minute: number
  second: number
  millisecond: number
  microsecond: number
  nanosecond: number
}

export type LocalDateTimeFields = LocalDateFields & LocalTimeFields

// input

export interface InputDateFields {
  era: string
  eraYear: number
  year: number
  month: number
  monthCode: string
  day: number
}

// iso

export interface ISOYearFields {
  isoYear: number
}

export interface ISOYearMonthFields extends ISOYearFields {
  isoMonth: number
}

export interface ISODateFields extends ISOYearMonthFields {
  isoDay: number
}

export interface ISOTimeFieldsMilli { // with milllisecond precision
  isoHour: number
  isoMinute: number
  isoSecond: number
  isoMillisecond: number
}

export interface ISOTimeFields extends ISOTimeFieldsMilli { // with nanosecond precision
  isoMicrosecond: number
  isoNanosecond: number
}

export type ISODateTimeFields = ISODateFields & ISOTimeFields
export type ISODateTimeFieldsMilli = ISODateFields & ISOTimeFieldsMilli

// duration

// prefer this over unsigned
export interface UnsignedDurationFields {
  years: number
  months: number
  weeks: number
  days: number
  hours: number
  minutes: number
  seconds: number
  milliseconds: number
  microseconds: number
  nanoseconds: number
}

export interface DurationFields extends UnsignedDurationFields {
  sign: CompareResult
}
