import { getCommonCalendar } from '../argParse/calendar'
import { DiffConfig } from '../argParse/diffOptions'
import { OverflowHandlingInt } from '../argParse/overflowHandling'
import { constrainInt } from '../argParse/refine'
import { unitNames } from '../argParse/unitStr'
import { CalendarImpl } from '../calendarImpl/calendarImpl'
import { isoCalendarImpl } from '../calendarImpl/isoCalendarImpl'
import { Duration } from '../public/duration'
import { PlainDate } from '../public/plainDate'
import { CompareResult, DateISOFields, DateUnit } from '../public/types'
import { compareValues } from '../utils/math'
import { addWholeDays } from './add'
import { isoFieldsToEpochNano } from './isoMath'
import { compareMonthDayFields } from './monthDay'
import { roundBalancedDuration } from './rounding'
import { YearMonthEssentials, YearMonthFields } from './yearMonth'

export type DateISOEssentials = { isoYear: number, isoMonth: number, isoDay: number }
export type DateEssentials = YearMonthEssentials & { day: number }
export type DateFields = YearMonthFields & { day: number }

export function createDate(isoFields: DateISOFields): PlainDate {
  return new PlainDate(
    isoFields.isoYear,
    isoFields.isoMonth,
    isoFields.isoDay,
    isoFields.calendar,
  )
}

export function constrainDateFields( // also ensures numbers
  year: number,
  month: number,
  day: number,
  calendarImpl: CalendarImpl,
  overflow: OverflowHandlingInt,
): [number, number, number] {
  year = Number(year) // not using constrainValue, which converts to a number
  month = constrainInt(month, 1, calendarImpl.monthsInYear(year), overflow)
  day = constrainInt(day, 1, calendarImpl.daysInMonth(year, month), overflow)

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

export function diffDates( // why not in diff.ts?
  d0: PlainDate,
  d1: PlainDate,
  diffConfig: DiffConfig,
  flip?: boolean,
): Duration {
  const calendar = getCommonCalendar(d0, d1)
  const balancedDuration = calendar.dateUntil(d0, d1, {
    largestUnit: unitNames[diffConfig.largestUnit] as DateUnit,
  })
  return roundBalancedDuration(balancedDuration, diffConfig, d0, d1, flip)
}
