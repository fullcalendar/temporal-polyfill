import { computeIsoInLeapYear } from '../internal/isoCalendarMath'
import { createArithmeticCalendar } from './utils/arithmeticCalendar'
import {
  gregoryToJulianDay,
  julianDayToGregory,
} from './utils/gregoryJulianDay'

// Adapted from Adobe's @internationalized/date Indian calendar implementation
// and ICU-style arithmetic calendar rules.

const indianEraStart = 78
const indianYearStart = 80
const indianEraOrigins = {
  'shaka': 0,
}
const indianEraRemaps = {
  // Some Intl implementations surface the older `saka` label while Temporal
  // test262 expects the canonical `shaka` code.
  'saka': 'shaka',
}

export function createIndianCalendar() {
  return createArithmeticCalendar({
    id: 'indian',
    eraOrigins: indianEraOrigins,
    eraRemaps: indianEraRemaps,
    fromJulianDay(julianDay) {
      const gregory = julianDayToGregory(julianDay)
      let year = gregory.year - indianEraStart
      let dayOfGregorianYear =
        julianDay - gregoryToJulianDay(gregory.year, 1, 1)
      let firstMonthDays: number

      if (dayOfGregorianYear < indianYearStart) {
        year--
        firstMonthDays = computeIsoInLeapYear(gregory.year - 1) ? 31 : 30
        dayOfGregorianYear += firstMonthDays + 31 * 5 + 30 * 3 + 10
      } else {
        firstMonthDays = computeIsoInLeapYear(gregory.year) ? 31 : 30
        dayOfGregorianYear -= indianYearStart
      }

      if (dayOfGregorianYear < firstMonthDays) {
        return { year, month: 1, day: dayOfGregorianYear + 1 }
      }

      let monthDay = dayOfGregorianYear - firstMonthDays
      if (monthDay < 31 * 5) {
        return {
          year,
          month: Math.floor(monthDay / 31) + 2,
          day: (monthDay % 31) + 1,
        }
      }

      monthDay -= 31 * 5
      return {
        year,
        month: Math.floor(monthDay / 30) + 7,
        day: (monthDay % 30) + 1,
      }
    },
    toJulianDay(year, month, day) {
      const gregoryYear = year + indianEraStart
      let firstMonthDays: number
      let julianDay: number
      if (computeIsoInLeapYear(gregoryYear)) {
        firstMonthDays = 31
        julianDay = gregoryToJulianDay(gregoryYear, 3, 21)
      } else {
        firstMonthDays = 30
        julianDay = gregoryToJulianDay(gregoryYear, 3, 22)
      }

      if (month === 1) {
        return julianDay + day - 1
      }

      julianDay += firstMonthDays + Math.min(month - 2, 5) * 31

      if (month >= 8) {
        julianDay += (month - 7) * 30
      }

      return julianDay + day - 1
    },
    computeDaysInMonth(year, month) {
      return month === 1 && computeIsoInLeapYear(year + indianEraStart)
        ? 31
        : month >= 2 && month <= 6
          ? 31
          : 30
    },
    computeDaysInYear(year) {
      return computeIsoInLeapYear(year + indianEraStart) ? 366 : 365
    },
    computeMonthsInYear() {
      return 12
    },
    computeInLeapYear(year) {
      return this.computeDaysInYear(year) > 365
    },
    computeEraFields({ year }) {
      return { era: 'shaka', eraYear: year }
    },
  })
}
