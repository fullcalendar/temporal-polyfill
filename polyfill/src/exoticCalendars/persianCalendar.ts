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

// The 33-year rule makes 78 years from 1502 to 2987 AP leap years, but the
// astronomical calendar on the 52.5° E meridian makes the following year a
// leap year instead. ICU4X (and so native Temporal in V8) corrects exactly
// these years; see NON_LEAP_CORRECTION in
// https://github.com/unicode-org/icu4x/blob/main/utils/calendrical_calculations/src/persian.rs
// The 78 years form six runs, 33 years apart. Each pair is [firstYear, count].
const persianNonLeapCorrections = [
  1502, 1, 1601, 43, 2059, 1, 2158, 26, 2748, 2, 2847, 5,
]

export function createPersianCalendar() {
  return createArithmeticCalendar({
    eraOrigins: persianEraOrigins,
    fromJulianDay(julianDay) {
      const daysSinceEpoch = julianDay - persianEpoch
      let year = 1 + Math.floor((33 * daysSinceEpoch + 3) / 12053)
      let dayOfYear = daysSinceEpoch - persianDaysBeforeYear(year)

      // A corrected year has 365 days, so the day the 33-year rule calls its
      // 366th day is the first day of the next year
      if (dayOfYear === 365 && persianIsNonLeapCorrection(year)) {
        year++
        dayOfYear = 0
      }

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
        persianDaysBeforeYear(year) +
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

/*
A corrected year gives its leap day to the year after it. The result reaches
inLeapYear, and the build turns literal true and false into 1 and 0, so it is
converted with Boolean().
*/
function persianIsLeapYear(year: number): boolean {
  return Boolean(
    !persianIsNonLeapCorrection(year) &&
      (persianIsNonLeapCorrection(year - 1) ||
        modFloor(25 * year + 11, 33) < 8),
  )
}

/*
Days from the epoch to 1 Farvardin of the given year. A corrected year is one
day shorter than the 33-year rule says, so the year after it starts a day early.
*/
function persianDaysBeforeYear(year: number): number {
  return (
    365 * (year - 1) +
    Math.floor((8 * year + 21) / 33) -
    Number(persianIsNonLeapCorrection(year - 1))
  )
}

function persianIsNonLeapCorrection(year: number): boolean {
  for (let i = 0; i < persianNonLeapCorrections.length; i += 2) {
    const yearsAfterFirst = year - persianNonLeapCorrections[i]
    if (
      yearsAfterFirst >= 0 &&
      yearsAfterFirst % 33 === 0 &&
      yearsAfterFirst / 33 < persianNonLeapCorrections[i + 1]
    ) {
      return true
    }
  }
  return false
}
