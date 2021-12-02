import { PlainYearMonth } from '../public/plainYearMonth'
import { CompareResult, DateISOFields, YearMonthLike } from '../public/types'
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

export function overrideYearMonthFields(
  overrides: Partial<YearMonthFields>,
  base: YearMonthFields,
): YearMonthLike {
  const merged = {} as YearMonthFields
  let anyYear = false
  let anyMonth = false

  if (overrides.era != null || overrides.eraYear != null) {
    merged.era = overrides.era
    merged.eraYear = overrides.eraYear
    anyYear = true
  }
  if (overrides.year != null) {
    merged.year = overrides.year
    anyYear = true
  }
  if (!anyYear) {
    merged.year = base.year
  }

  if (overrides.month != null) {
    merged.month = overrides.month
    anyMonth = true
  }
  if (overrides.monthCode != null) {
    merged.monthCode = overrides.monthCode
    anyMonth = true
  }
  if (!anyMonth) {
    merged.month = base.month
  }

  return merged
}

export function comparePlainYearMonths(a: PlainYearMonth, b: PlainYearMonth): CompareResult {
  return compareValues(
    isoFieldsToEpochNano(a.getISOFields()),
    isoFieldsToEpochNano(b.getISOFields()),
  ) || compareValues(a.calendar.id, b.calendar.id)
}
