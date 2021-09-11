import { CompareResult, DateISOFields, YearMonthLike } from '../args'
import { PlainYearMonth } from '../plainYearMonth'
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

export const yearMonthFieldMap = {
  era: String,
  eraYear: Number,
  year: Number,
  month: Number,
  monthCode: String,
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

  if (overrides.era != null || overrides.eraYear != null) {
    merged.era = overrides.era
    merged.eraYear = overrides.eraYear
  } else if (overrides.year != null) {
    merged.year = overrides.year
  } else {
    merged.year = base.year
  }

  if (overrides.month != null) {
    merged.month = overrides.month
  } else if (overrides.monthCode != null) {
    merged.monthCode = overrides.monthCode
  } else {
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
