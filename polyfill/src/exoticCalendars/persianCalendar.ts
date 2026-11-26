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
// leap year instead. ICU4X (behind native Temporal) corrects exactly these
// years; see NON_LEAP_CORRECTION in
// https://github.com/unicode-org/icu4x/blob/main/utils/calendrical_calculations/src/persian.rs
// ICU4C (behind the host's Intl.DateTimeFormat) has made the same corrections
// since ICU 77, so on those hosts Temporal fields match formatted output too.
// Older ICU4C still uses the plain 33-year rule. ICU4X only checked
// 1178 to 3000 AP against the astronomical calendar, so every other year keeps
// the plain 33-year rule.
//
// The 78 years form six runs, each stepping 33 years (one full cycle of the
// rule). Each pair is [firstYear, count], which is much smaller in the build
// than listing all 78 years:
//   1502                    (1 year)
//   1601, 1634, ..., 2987   (43 years)
//   2059                    (1 year)
//   2158, 2191, ..., 2983   (26 years)
//   2748, 2781              (2 years)
//   2847, 2880, ..., 2979   (5 years)
// persianCalendar.test.ts checks these runs against ICU4X's full list.
const persianNonLeapCorrections = [
  1502, 1, 1601, 43, 2059, 1, 2158, 26, 2748, 2, 2847, 5,
]

export function createPersianCalendar() {
  return createArithmeticCalendar({
    eraOrigins: persianEraOrigins,
    fromJulianDay(julianDay) {
      const daysSinceEpoch = julianDay - persianEpoch
      // The year under the plain 33-year rule. A 33-year cycle has 12053 days
      // (33 * 365 + 8 leap days).
      let year = 1 + Math.floor((33 * daysSinceEpoch + 3) / 12053)

      // The plain rule's guess is never too high, but it is one too low on
      // the first day after a corrected year: the rule calls that day the
      // corrected year's 366th day, while the corrected year has only 365
      if (daysSinceEpoch >= persianDaysBeforeYear(year + 1)) {
        year++
      }

      const dayOfYear = daysSinceEpoch - persianDaysBeforeYear(year)
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
      // Esfand (month 12) takes whatever the year has left after the 336 days
      // of months 1-11: 29 days, or 30 in a leap year
      return month <= 6 ? 31 : month <= 11 ? 30 : persianDaysInYear(year) - 336
    },
    computeDaysInYear: persianDaysInYear,
    computeMonthsInYear() {
      return 12
    },
    // A comparison, so a real boolean even though the build turns literal
    // true and false into 1 and 0
    computeInLeapYear(year) {
      return persianDaysInYear(year) > 365
    },
    computeEraFields({ year }) {
      return { era: 'ap', eraYear: year }
    },
  })
}

/*
Every year length, and so every leap year, comes from persianDaysBeforeYear, so
the corrections only need applying in one place. A corrected year gives its
leap day to the year after it.
*/
function persianDaysInYear(year: number): number {
  return persianDaysBeforeYear(year + 1) - persianDaysBeforeYear(year)
}

/*
Days from the epoch to 1 Farvardin of the given year. The floor term counts the
33-year rule's leap days before the year (8 per 33 years). A corrected year is
one day shorter than the rule says, so the year after it starts a day early.
*/
function persianDaysBeforeYear(year: number): number {
  return (
    365 * (year - 1) +
    Math.floor((8 * year + 21) / 33) -
    Number(persianIsNonLeapCorrection(year - 1))
  )
}

/*
Whether the 33-year rule's leap day for this year moves to the next year. True
for the 78 years in persianNonLeapCorrections: a year is in a run when it is a
whole number of 33-year cycles after the run's first year, and fewer than
`count` cycles.
*/
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
