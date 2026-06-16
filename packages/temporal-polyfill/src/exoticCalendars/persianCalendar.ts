import { modFloor } from '../internal/utils'
import { createArithmeticCalendar } from './utils/arithmeticCalendar'

// Adapted from Adobe's @internationalized/date Persian calendar implementation
// and ICU-style arithmetic calendar rules.
// https://github.com/adobe/react-spectrum/blob/main/packages/@internationalized/date/src/calendars/PersianCalendar.ts

const persianEpoch = 1948320
const persianEraOrigins = {
  'ap': 0,
}
const persianMonthStarts = [
  0, 31, 62, 93, 124, 155, 186, 216, 246, 276, 306, 336,
]

export function createPersianCalendar() {
  return createArithmeticCalendar({
    eraOrigins: persianEraOrigins,
    fromJulianDay(julianDay) {
      const daysSinceEpoch = julianDay - persianEpoch
      const year = 1 + Math.floor((33 * daysSinceEpoch + 3) / 12053)
      const farvardin1 = 365 * (year - 1) + Math.floor((8 * year + 21) / 33)
      const dayOfYear = daysSinceEpoch - farvardin1
      const month =
        dayOfYear < 216
          ? Math.floor(dayOfYear / 31)
          : Math.floor((dayOfYear - 6) / 30)
      const day = dayOfYear - persianMonthStarts[month] + 1
      return { year, month: month + 1, day }
    },
    toJulianDay(year, month, day) {
      return (
        persianEpoch -
        1 +
        365 * (year - 1) +
        Math.floor((8 * year + 21) / 33) +
        persianMonthStarts[month - 1] +
        day
      )
    },
    computeDaysInMonth(year, month) {
      return month <= 6
        ? 31
        : month <= 11
          ? 30
          : persianIsLeapYear(year)
            ? 30
            : 29
    },
    computeDaysInYear(year) {
      return persianIsLeapYear(year) ? 366 : 365
    },
    computeMonthsInYear() {
      return 12
    },
    computeInLeapYear: persianIsLeapYear,
    computeEraFields({ year }) {
      return { era: 'ap', eraYear: year }
    },
  })
}

function persianIsLeapYear(year: number): boolean {
  return modFloor(25 * year + 11, 33) < 8
}
