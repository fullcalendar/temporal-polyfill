import { bindArgs, modFloor } from '../internal/utils'
import { createArithmeticCalendar } from './utils/arithmeticCalendar'
import {
  epochMilliToJulianDay,
  julianDayToGregory,
} from './utils/gregoryJulianDay'
import {
  type IntlScrapedCalendarData,
  computeIntlDaysInMonth,
  computeIntlDaysInYear,
  computeIntlEpochMilli,
  createIntlScrapedCalendarData,
} from './utils/intlScrapedCalendar'

// Adapted from Adobe's @internationalized/date Islamic calendar implementation
// and ICU-style arithmetic calendar rules.

const civilIslamicEpoch = 1948440
const astronomicalIslamicEpoch = 1948439
const umalquraYearStart = 1300
const umalquraYearEnd = 1600
const umalquraStartDays = 460322
const umalquraEndDays = 566987

// Parallel to month codes M01-M12, stored as Umm al-Qura / Hijri calendar
// years where that month has a day 30.
const umalquraPlainMonthDay30ReferenceYears = [
  1392, 1390, 1391, 1392, 1391, 1392, 1389, 1392, 1392, 1390, 1391, 1390,
]

export function createIslamicCivilCalendar() {
  return createIslamicCalendar(
    bindArgs(julianDayToIslamic, civilIslamicEpoch),
    bindArgs(islamicToJulianDay, civilIslamicEpoch),
  )
}

export function createIslamicTabularCalendar() {
  return createIslamicCalendar(
    bindArgs(julianDayToIslamic, astronomicalIslamicEpoch),
    bindArgs(islamicToJulianDay, astronomicalIslamicEpoch),
  )
}

export function createIslamicUmmAlQuraCalendar(canonicalId: string) {
  const intlUmalquraData = createIntlScrapedCalendarData(canonicalId)

  return createIslamicCalendar(
    bindArgs(julianDayToUmalqura, intlUmalquraData),
    bindArgs(umalquraToJulianDay, intlUmalquraData),
    intlUmalquraData,
  )
}

function createIslamicCalendar(
  fromJulianDay: (julianDay: number) => {
    year: number
    month: number
    day: number
  },
  toJulianDay: (year: number, month: number, day: number) => number,
  // Truthiness doubles as the Umm al-Qura mode flag; civil/tabular calendars
  // leave this unset and use arithmetic month lengths throughout.
  intlUmalquraData?: IntlScrapedCalendarData,
) {
  return createArithmeticCalendar({
    eraOrigins: {
      'bh': -1,
      'ah': 0,
    },
    fromJulianDay,
    toJulianDay,
    computeDaysInMonth(year, month) {
      return intlUmalquraData && isUmalquraYear(year)
        ? computeIntlDaysInMonth(intlUmalquraData, year, month)
        : islamicDaysInMonth(year, month)
    },
    computeDaysInYear(year) {
      return intlUmalquraData && isUmalquraYear(year)
        ? computeIntlDaysInYear(intlUmalquraData, year)
        : islamicIsLeapYear(year)
          ? 355
          : 354
    },
    computeMonthsInYear() {
      return 12
    },
    computeInLeapYear(year) {
      return this.computeDaysInYear(year) > 354
    },
    computeYearMonthFieldsForMonthDay(monthCodeNumber, isLeapMonth, day) {
      // Umm al-Qura is observational. test262 pins each 30-day PlainMonthDay
      // reference to a year where that month actually had 30 days.
      const umalquraReferenceYear =
        intlUmalquraData &&
        !isLeapMonth &&
        day === 30 &&
        umalquraPlainMonthDay30ReferenceYears[monthCodeNumber - 1]

      return intlUmalquraData && umalquraReferenceYear
        ? { year: umalquraReferenceYear, month: monthCodeNumber }
        : undefined
    },
    computeEraFields({ year }) {
      return year < 1
        ? { era: 'bh', eraYear: 1 - year }
        : { era: 'ah', eraYear: year }
    },
  })
}

function islamicToJulianDay(
  epoch: number,
  year: number,
  month: number,
  day: number,
): number {
  return (
    day +
    Math.ceil(29.5 * (month - 1)) +
    (year - 1) * 354 +
    Math.floor((3 + 11 * year) / 30) +
    epoch -
    1
  )
}

function julianDayToIslamic(epoch: number, julianDay: number) {
  const year = Math.floor((30 * (julianDay - epoch) + 10646) / 10631)
  const month = Math.min(
    12,
    Math.ceil(
      (julianDay - (29 + islamicToJulianDay(epoch, year, 1, 1))) / 29.5,
    ) + 1,
  )
  const day = julianDay - islamicToJulianDay(epoch, year, month, 1) + 1
  return { year, month, day }
}

function islamicIsLeapYear(year: number): boolean {
  return modFloor(14 + 11 * year, 30) < 11
}

function islamicDaysInMonth(year: number, month: number) {
  return 29 + (month % 2) + (month === 12 && islamicIsLeapYear(year) ? 1 : 0)
}

function isUmalquraYear(year: number) {
  return year >= umalquraYearStart && year <= umalquraYearEnd
}

function julianDayToUmalqura(
  intlUmalquraData: IntlScrapedCalendarData,
  julianDay: number,
) {
  const days = julianDay - civilIslamicEpoch
  if (days < umalquraStartDays || days >= umalquraEndDays) {
    return julianDayToIslamic(civilIslamicEpoch, julianDay)
  }

  const { year, month, day } = intlUmalquraData.queryFields(
    julianDayToGregory(julianDay),
  )
  return { year, month, day }
}

function umalquraToJulianDay(
  intlUmalquraData: IntlScrapedCalendarData,
  year: number,
  month: number,
  day: number,
): number {
  return isUmalquraYear(year)
    ? epochMilliToJulianDay(
        computeIntlEpochMilli(intlUmalquraData, year, month, day),
      )
    : islamicToJulianDay(civilIslamicEpoch, year, month, day)
}
