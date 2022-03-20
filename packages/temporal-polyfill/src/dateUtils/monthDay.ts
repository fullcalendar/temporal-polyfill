import { PlainMonthDay } from '../public/plainMonthDay'
import { CompareResult, DateISOFields } from '../public/types'
import { compareValues } from '../utils/math'
import { DateEssentials } from './date'
import { isoFieldsToEpochNano } from './isoMath'

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

export const monthDayFieldMap = {
  era: String,
  eraYear: Number,
  year: Number,
  month: Number,
  monthCode: String,
  day: Number,
}

export function createMonthDay(isoFields: DateISOFields): PlainMonthDay {
  return new PlainMonthDay(
    isoFields.isoMonth,
    isoFields.isoDay,
    isoFields.calendar,
    isoFields.isoYear,
  )
}

export function monthDaysEqual(a: PlainMonthDay, b: PlainMonthDay): boolean {
  return a.calendar.id === b.calendar.id &&
    isoFieldsToEpochNano(a.getISOFields()) === isoFieldsToEpochNano(b.getISOFields())
}

// unlike other utils, operated with *DateEssentials* fields
export function compareMonthDayFields(d0: DateEssentials, d1: DateEssentials): CompareResult {
  return compareValues(d0.month, d1.month) ||
    compareValues(d0.day, d1.day)
}
