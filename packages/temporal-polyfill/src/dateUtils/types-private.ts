import { TimeZone } from '../public/timeZone'
import { DateTimeISOFields } from '../public/types'

export interface YearMonthEssentials {
  year: number
  month: number
}

export interface YearMonthFields {
  era: string | undefined
  eraYear: number | undefined
  year: number
  month: number
  monthCode: string
}

export type DateISOEssentials = { isoYear: number, isoMonth: number, isoDay: number }
export type DateEssentials = YearMonthEssentials & { day: number }
export type DateFields = YearMonthFields & { day: number }

export type DateTimeISOMilli = DateISOEssentials & TimeISOMilli
export type DateTimeISOEssentials = DateISOEssentials & TimeISOEssentials
export type DateTimeFields = DateFields & TimeFields

export interface TimeISOMilli {
  isoHour: number
  isoMinute: number
  isoSecond: number
  isoMillisecond: number
}

export interface TimeISOEssentials extends TimeISOMilli {
  isoMicrosecond: number
  isoNanosecond: number
}

export interface TimeFields {
  hour: number
  minute: number
  second: number
  millisecond: number
  microsecond: number
  nanosecond: number
}

export type MonthDayFields = {
  era: string
  eraYear: number
  year: number
  month: number
  monthCode: string
  day: number
}

export type MonthDayEssentials = {
  monthCode: string
  day: number
}

export type ZonedDateTimeISOEssentials = DateTimeISOFields & { // essentials for creation
  timeZone: TimeZone
  offset?: number | undefined
  Z?: boolean | undefined // whether ISO8601 specified with 'Z' as offset indicator
}
export type ZonedDateTimeFields = DateTimeFields & { offset: string }
