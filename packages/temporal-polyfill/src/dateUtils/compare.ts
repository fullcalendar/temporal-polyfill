import { Instant } from '../public/instant'
import { PlainDate } from '../public/plainDate'
import { PlainDateTime } from '../public/plainDateTime'
import { PlainMonthDay } from '../public/plainMonthDay'
import { PlainTime } from '../public/plainTime'
import { PlainYearMonth } from '../public/plainYearMonth'
import { CompareResult } from '../public/types'
import { compareValues } from '../utils/math'
import { isoFieldsToEpochNano, timeFieldsToNano } from './isoMath'
import { DateEssentials } from './types-private'

export function compareDateTimes(a: PlainDateTime, b: PlainDateTime): CompareResult {
  return compareValues(
    isoFieldsToEpochNano(a.getISOFields()),
    isoFieldsToEpochNano(b.getISOFields()),
  ) || compareValues(a.calendar.id, b.calendar.id)
}

export function compareDates(a: PlainDate, b: PlainDate): CompareResult {
  return compareValues(
    isoFieldsToEpochNano(a.getISOFields()),
    isoFieldsToEpochNano(b.getISOFields()),
  ) || compareValues(a.calendar.id, b.calendar.id)
}

export function comparePlainYearMonths(a: PlainYearMonth, b: PlainYearMonth): CompareResult {
  return compareValues(
    isoFieldsToEpochNano(a.getISOFields()),
    isoFieldsToEpochNano(b.getISOFields()),
  ) || compareValues(a.calendar.id, b.calendar.id)
}

export function compareDateFields(d0: DateEssentials, d1: DateEssentials): CompareResult {
  return compareValues(d0.year, d1.year) ||
    compareMonthDayFields(d0, d1)
}

export function compareTimes(t0: PlainTime, t1: PlainTime): CompareResult {
  return compareValues(timeFieldsToNano(t0), timeFieldsToNano(t1))
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

export function compareInstants(a: Instant, b: Instant): CompareResult {
  return compareValues(a.epochNanoseconds, b.epochNanoseconds)
}
