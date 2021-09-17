import { getCommonCalendar } from '../argParse/calendar'
import { DiffConfig } from '../argParse/diffOptions'
import { OverflowHandlingInt } from '../argParse/overflowHandling'
import { constrainValue } from '../argParse/refine'
import { unitNames } from '../argParse/units'
import { CalendarImpl } from '../calendarImpl/calendarImpl'
import { CompareResult, DateISOFields, DateLikeFields, DateUnit } from '../public/args'
import { Duration } from '../public/duration'
import { PlainDate } from '../public/plainDate'
import { compareValues } from '../utils/math'
import { addWholeDays } from './add'
import { isoCalendarImpl } from './calendar'
import { isoFieldsToEpochNano } from './isoMath'
import { compareMonthDayFields } from './monthDay'
import { roundBalancedDuration } from './round'
import {
  YearMonthEssentials,
  YearMonthFields,
  overrideYearMonthFields,
  yearMonthFieldMap,
} from './yearMonth'

export type DateISOEssentials = { isoYear: number, isoMonth: number, isoDay: number }
export type DateEssentials = YearMonthEssentials & { day: number }
export type DateFields = YearMonthFields & { day: number }

export const dateFieldMap = {
  ...yearMonthFieldMap,
  day: Number,
}

export function createDate(isoFields: DateISOFields): PlainDate {
  return new PlainDate(
    isoFields.isoYear,
    isoFields.isoMonth,
    isoFields.isoDay,
    isoFields.calendar,
  )
}

export function overrideDateFields(
  overrides: Partial<DateFields>,
  base: DateFields,
): DateLikeFields {
  return {
    ...overrideYearMonthFields(overrides, base),
    day: overrides.day ?? base.day,
  }
}

export function constrainDateFields( // also ensures numbers
  year: number,
  month: number,
  day: number,
  calendarImpl: CalendarImpl,
  overflow: OverflowHandlingInt,
): [number, number, number] {
  year = Number(year)
  month = constrainValue(month, 1, calendarImpl.monthsInYear(year), overflow)
  day = constrainValue(day, 1, calendarImpl.daysInMonth(year, month), overflow)
  return [year, month, day]
}

export function constrainDateISO( // also ensures numbers
  isoFields: DateISOEssentials,
  overflow: OverflowHandlingInt,
): DateISOEssentials {
  const [isoYear, isoMonth, isoDay] = constrainDateFields(
    isoFields.isoYear,
    isoFields.isoMonth,
    isoFields.isoDay,
    isoCalendarImpl,
    overflow,
  )
  return { isoYear, isoMonth, isoDay }
}

export function compareDates(a: PlainDate, b: PlainDate): CompareResult {
  return compareValues(
    isoFieldsToEpochNano(a.getISOFields()),
    isoFieldsToEpochNano(b.getISOFields()),
  ) || compareValues(a.calendar.id, b.calendar.id)
}

export function compareDateFields(d0: DateEssentials, d1: DateEssentials): CompareResult {
  return compareValues(d0.year, d1.year) ||
    compareMonthDayFields(d0, d1)
}

export function addDaysToDate(date: PlainDate, days: number): PlainDate {
  if (days) {
    return createDate(
      addWholeDays(date.getISOFields(), days), // preserves `calendar`
    )
  }
  return date
}

export function diffDates(
  d0: PlainDate,
  d1: PlainDate,
  diffConfig: DiffConfig,
): Duration {
  const calendar = getCommonCalendar(d0, d1)
  const balancedDuration = calendar.dateUntil(d0, d1, {
    largestUnit: unitNames[diffConfig.largestUnit] as DateUnit,
  })
  return roundBalancedDuration(balancedDuration, diffConfig, d0, d1)
}
