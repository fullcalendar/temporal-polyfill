import { isoArgsToEpochMilli } from '../internal/epochMath'
import { milliInDay } from '../internal/units'
import { constrainToRange, memoize } from '../internal/utils'
import {
  type IntlCalendarOverrideConfig,
  type IntlYearDataForOverride,
  createIntlCalendarWithOverrides,
} from './utils/intlCalendarWithOverrides'

export const getChineseDangiCalendar = memoize(createChineseDangiCalendar)

type FirstMonthStartCorrection = [knownBadEpochMilli: number, dayOffset: number]

// test262's Chinese year-length data implies two one-day new-year boundary
// disagreements with the ICU4C data bundled in Node 22. Keep this table tiny
// until a broader ICU4X-sourced data set is available.
const chineseFirstMonthStartCorrections: Record<
  number,
  FirstMonthStartCorrection
> = {
  2027: [isoArgsToEpochMilli(2027, 2, 7)!, -1],
  2030: [isoArgsToEpochMilli(2030, 2, 2)!, 1],
}

const chineseLeapMonthOverrides: Record<number, number> = {
  // ICU's Chinese calendar data in Node 22 labels 1987 as having a leap M07
  // (`Mo7bis`), while Temporal/test262 follows ICU4X data where the inserted
  // slot is M06L. Return the concrete slot index for M06L.
  1987: 7,
}

// PlainMonthDay stores a canonical reference date, not the user-supplied year.
// For Chinese/Dangi leap months, Temporal uses a modern reference table rather
// than blindly accepting every historical Intl result. A value of 0 means that
// monthCode has no accepted PlainMonthDay leap-month reference row; 29 means
// that days 1-29 are accepted as leap month-days, but day 30 constrains to the
// corresponding common month. Month codes omitted from this table are accepted
// according to normal calendar lookup.
const plainMonthDayLeapMonthMaxDays: Record<number, number> = {
  1: 0,
  2: 29,
  8: 29,
  9: 29,
  10: 29,
  11: 29,
  12: 0,
}

function createChineseDangiCalendar(normCalendarId: string) {
  return createIntlCalendarWithOverrides(
    normCalendarId,
    getChineseDangiOverrideConfig(normCalendarId),
  )
}

function getChineseDangiOverrideConfig(
  normCalendarId: string,
): IntlCalendarOverrideConfig {
  return normCalendarId === 'chinese'
    ? chineseOverrideConfig
    : commonOverrideConfig
}

function constrainChinesePlainMonthDay(
  monthCodeNumber: number,
  isLeapMonth: boolean,
  day: number,
): number {
  const maxDay =
    isLeapMonth &&
    (monthCodeNumber === 1 ||
      monthCodeNumber === 9 ||
      monthCodeNumber === 10 ||
      monthCodeNumber === 11 ||
      monthCodeNumber === 12)
      ? 29
      : 30

  return constrainToRange(day, 1, maxDay)
}

function getChineseDangiMonthDaySearchStartYear(
  monthCodeNumber: number,
  isLeapMonth: boolean,
  day: number,
): number {
  if (isLeapMonth) {
    switch (monthCodeNumber) {
      case 1:
        // ICU4C has no M01L day-30 year; this is a 29-day leap month year.
        return 1651
      case 2:
        return day < 30 ? 1947 : 1765
      case 3:
        return day < 30 ? 1966 : 1955
      case 4:
        return day < 30 ? 1963 : 1944
      case 5:
        return day < 30 ? 1971 : 1952
      case 6:
        return day < 30 ? 1960 : 1941
      case 7:
        return day < 30 ? 1968 : 1938
      case 8:
        return day < 30 ? 1957 : 1718
      case 9:
        return 2014
      case 10:
        return 1984
      case 11:
        return day < 29 ? 2033 : 2034
      case 12:
        // ICU4C has no M12L day-30 year; this is a 29-day leap month year.
        return 1890
    }
  }
  return 1972
}

const commonOverrideConfig: IntlCalendarOverrideConfig = {
  leapMonthMeta: 13,
  plainMonthDayLeapMonthMaxDays,
  // When a Chinese/Dangi PlainMonthDay leap month-day falls outside the
  // accepted leap reference table, Temporal constrains through the
  // corresponding common month. Common lunisolar months top out at 30 days.
  plainMonthDayCommonMonthMaxDay: 30,
  getMonthDaySearchStartYear: getChineseDangiMonthDaySearchStartYear,
}

const chineseOnlyOverrideConfig: Partial<IntlCalendarOverrideConfig> = {
  constrainPlainMonthDay: constrainChinesePlainMonthDay,
  hasYearDataOverrideCandidate(year) {
    return hasChineseYearDataOverrideCandidate(year)
  },
  applyYearDataOverrides(year, scrapedYearData) {
    return applyChineseYearDataOverrides(year, scrapedYearData)
  },
  queryLeapMonthOverride(year) {
    return queryChineseLeapMonthOverride(year)
  },
}

const chineseOverrideConfig: IntlCalendarOverrideConfig = {
  ...commonOverrideConfig,
  ...chineseOnlyOverrideConfig,
}

function hasChineseYearDataOverrideCandidate(year: number): boolean {
  return chineseFirstMonthStartCorrections[year] !== undefined
}

function applyChineseYearDataOverrides(
  year: number,
  scrapedYearData: IntlYearDataForOverride,
): IntlYearDataForOverride {
  const firstMonthStartCorrection = chineseFirstMonthStartCorrections[year]

  if (
    firstMonthStartCorrection !== undefined &&
    scrapedYearData.monthEpochMillis[0] === firstMonthStartCorrection[0]
  ) {
    const monthEpochMillis = scrapedYearData.monthEpochMillis.slice()

    // Only the new-year boundary is known to disagree. Preserve the host's
    // month labels and later month starts so leap-month detection stays tied to
    // the same bounded ICU data that was scraped for the rest of the year.
    monthEpochMillis[0] += firstMonthStartCorrection[1] * milliInDay

    return {
      monthEpochMillis,
      monthStrings: scrapedYearData.monthStrings.slice(),
    }
  }

  return scrapedYearData
}

function queryChineseLeapMonthOverride(year: number): number | undefined {
  return chineseLeapMonthOverrides[year]
}
