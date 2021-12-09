import { OVERFLOW_CONSTRAIN } from '../argParse/overflowHandling'
import { CalendarImpl } from '../calendarImpl/calendarImpl'
import { Duration } from '../public/duration'
import { compareValues } from '../utils/math'
import { addWholeMonths, addWholeYears } from './add'
import { DateEssentials, compareDateFields } from './date'
import { diffDaysMilli } from './isoMath'
import { compareMonthDayFields } from './monthDay'
import { MONTH, UnitInt, WEEK, YEAR } from './units'

export function diffDateFields(
  d0: DateEssentials,
  d1: DateEssentials,
  calendarImpl: CalendarImpl,
  largestUnit: UnitInt,
): Duration {
  let years = 0; let months = 0; let weeks = 0; let days = 0

  switch (largestUnit) {
    case YEAR:
      years = wholeYearsUntil(d0, d1)
      d0 = addWholeYears(d0, years, calendarImpl, OVERFLOW_CONSTRAIN)
      // fallthrough
    case MONTH:
      months = wholeMonthsUntil(d0, d1, calendarImpl)
      d0 = addWholeMonths(d0, months, calendarImpl, OVERFLOW_CONSTRAIN)
  }

  days = diffDaysMilli(
    calendarImpl.epochMilliseconds(d0.year, d0.month, d0.day),
    calendarImpl.epochMilliseconds(d1.year, d1.month, d1.day),
  )

  if (largestUnit === WEEK) {
    weeks = Math.trunc(days / 7)
    days %= 7
  }

  return new Duration(years, months, weeks, days)
}

function wholeYearsUntil(d0: DateEssentials, d1: DateEssentials): number {
  const sign = compareDateFields(d1, d0) || 1
  const monthSign = compareMonthDayFields(d1, d0) || 1

  return d1.year - d0.year - (
    monthSign !== sign
      ? 1 * sign
      : 0
  )
}

function wholeMonthsUntil(
  d0: DateEssentials,
  d1: DateEssentials,
  calendarImpl: CalendarImpl,
): number {
  let monthsToAdd = 0
  const sign = compareDateFields(d1, d0) || 1

  if (sign) {
    // move ahead by whole years
    let { year } = d0
    while (year !== d1.year) {
      monthsToAdd += calendarImpl.monthsInYear(year) * sign
      year += sign
    }

    // add remaining months (or subtract overshot months)
    monthsToAdd += d1.month - d0.month

    // correct when we overshoot the day-of-month
    const daySign = compareValues(d1.day, d0.day) || 1
    if (daySign === -sign) {
      monthsToAdd -= sign
    }
  }
  return monthsToAdd
}
