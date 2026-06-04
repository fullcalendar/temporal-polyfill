import { modFloor } from '../internal/utils'
import { createArithmeticCalendar } from './utils/arithmeticCalendar'

// Adapted from Adobe's @internationalized/date Hebrew calendar implementation
// and ICU-style arithmetic calendar rules.

const hebrewEpoch = 347997
const hebrewEraOrigins = {
  'am': 0,
}

// Hebrew date calculations use hours and parts (halakim). One part is 1/1080
// of an hour; these constants also provide a compact approximation for locating
// the Hebrew year that contains a Julian day.
const hourParts = 1080
const dayParts = 24 * hourParts
const monthDays = 29
const monthFract = 12 * hourParts + 793
const monthParts = monthDays * dayParts + monthFract

export function createHebrewCalendar() {
  return createArithmeticCalendar({
    id: 'hebrew',
    eraOrigins: hebrewEraOrigins,
    leapMonthMeta: -6,
    fromJulianDay(julianDay) {
      const day = julianDay - hebrewEpoch
      const months = (day * dayParts) / monthParts
      let year = Math.floor((19 * months + 234) / 235) + 1
      let yearStart = hebrewStartOfYear(year)
      let dayOfYear = Math.floor(day - yearStart)

      while (dayOfYear < 1) {
        year--
        yearStart = hebrewStartOfYear(year)
        dayOfYear = Math.floor(day - yearStart)
      }

      let month = 1
      let monthStart = 0
      while (monthStart < dayOfYear) {
        monthStart += hebrewDaysInMonth(year, month)
        month++
      }

      month--
      monthStart -= hebrewDaysInMonth(year, month)

      return { year, month, day: dayOfYear - monthStart }
    },
    toJulianDay(year, month, day) {
      let julianDay = hebrewStartOfYear(year)
      for (let i = 1; i < month; i++) {
        julianDay += hebrewDaysInMonth(year, i)
      }
      return julianDay + day + hebrewEpoch
    },
    computeDaysInMonth: hebrewDaysInMonth,
    computeDaysInYear: hebrewDaysInYear,
    computeMonthsInYear(year) {
      return hebrewIsLeapYear(year) ? 13 : 12
    },
    computeInLeapYear: hebrewIsLeapYear,
    computeLeapMonth(year) {
      return hebrewIsLeapYear(year) ? 6 : undefined
    },
    computeMonthCodeParts(year, month) {
      if (hebrewIsLeapYear(year) && month === 6) {
        return [5, true]
      }
      return [month - (hebrewIsLeapYear(year) && month > 6 ? 1 : 0), false]
    },
    computeYearMonthFieldsForMonthDay(monthCodeNumber, isLeapMonth, day) {
      // test262 fixes the Hebrew leap-month PlainMonthDay reference in ISO
      // 1970. Hebrew year 5730 has Adar I as M05L and its day range is 1-30.
      return isLeapMonth && monthCodeNumber === 5 && day <= 30
        ? { year: 5730, month: 6 }
        : undefined
    },
    computeEraFields({ year }) {
      return { era: 'am', eraYear: year }
    },
  })
}

function hebrewIsLeapYear(year: number) {
  return modFloor(year * 7 + 1, 19) < 7
}

function hebrewDelay1(year: number) {
  const months = Math.floor((235 * year - 234) / 19)
  const parts = 12084 + 13753 * months
  let day = months * 29 + Math.floor(parts / 25920)

  if (modFloor(3 * (day + 1), 7) < 3) {
    day += 1
  }

  return day
}

function hebrewDelay2(year: number) {
  const last = hebrewDelay1(year - 1)
  const present = hebrewDelay1(year)
  const next = hebrewDelay1(year + 1)

  if (next - present === 356) {
    return 2
  }

  if (present - last === 382) {
    return 1
  }

  return 0
}

function hebrewStartOfYear(year: number) {
  return hebrewDelay1(year) + hebrewDelay2(year)
}

function hebrewDaysInYear(year: number) {
  return hebrewStartOfYear(year + 1) - hebrewStartOfYear(year)
}

function hebrewYearType(year: number) {
  let yearLength = hebrewDaysInYear(year)

  if (yearLength > 380) {
    yearLength -= 30
  }

  return yearLength === 353 ? 0 : yearLength === 354 ? 1 : 2
}

function hebrewDaysInMonth(year: number, month: number): number {
  const normalizedMonth =
    month >= 6 && !hebrewIsLeapYear(year) ? month + 1 : month

  if (
    normalizedMonth === 4 ||
    normalizedMonth === 7 ||
    normalizedMonth === 9 ||
    normalizedMonth === 11 ||
    normalizedMonth === 13
  ) {
    return 29
  }

  const yearType = hebrewYearType(year)

  if (normalizedMonth === 2) {
    return yearType === 2 ? 30 : 29
  }

  if (normalizedMonth === 3) {
    return yearType === 0 ? 29 : 30
  }

  if (normalizedMonth === 6) {
    return hebrewIsLeapYear(year) ? 30 : 0
  }

  return 30
}
