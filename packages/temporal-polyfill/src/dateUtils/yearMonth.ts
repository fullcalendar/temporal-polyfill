import { PlainYearMonth } from '../public/plainYearMonth'
import { CompareResult, DateISOFields } from '../public/types'
import { compareValues } from '../utils/math'
import { isoFieldsToEpochNano } from './isoMath'

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

export function createYearMonth(isoFields: DateISOFields): PlainYearMonth {
  return new PlainYearMonth(
    isoFields.isoYear,
    isoFields.isoMonth,
    isoFields.calendar,
    isoFields.isoDay,
  )
}

export function comparePlainYearMonths(a: PlainYearMonth, b: PlainYearMonth): CompareResult {
  return compareValues(
    isoFieldsToEpochNano(a.getISOFields()),
    isoFieldsToEpochNano(b.getISOFields()),
  ) || compareValues(a.calendar.id, b.calendar.id)
}
