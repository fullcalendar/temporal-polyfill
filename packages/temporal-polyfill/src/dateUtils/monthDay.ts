import { CompareResult, DateISOFields, MonthDayLikeFields } from '../args'
import { PlainMonthDay } from '../plainMonthDay'
import { compareValues } from '../utils/math'
import { DateEssentials } from './date'

export type MonthDayFields = {
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

export function overrideMonthDayFields(
  overrides: Partial<MonthDayFields>,
  base: MonthDayEssentials,
): MonthDayLikeFields {
  const merged = { day: overrides.day ?? base.day } as MonthDayFields

  if (overrides.monthCode != null) {
    merged.monthCode = overrides.monthCode
  } else if (overrides.month != null) {
    merged.month = overrides.month
    merged.year = overrides.year! // will cause a planned runtime error if not defined
  } else {
    merged.monthCode = base.monthCode
  }

  return merged
}

export function monthDaysEqual(a: PlainMonthDay, b: PlainMonthDay): boolean {
  return a.monthCode === b.monthCode &&
    a.day === b.day &&
    a.calendar.id === b.calendar.id
}

// unlike other utils, operated with *DateEssentials* fields
export function compareMonthDayFields(d0: DateEssentials, d1: DateEssentials): CompareResult {
  return compareValues(d0.month, d1.month) ||
    compareValues(d0.day, d1.day)
}
