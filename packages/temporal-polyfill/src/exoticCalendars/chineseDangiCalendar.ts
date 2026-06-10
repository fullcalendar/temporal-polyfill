import {
  type IntlScrapedCalendarConfig,
  createIntlScrapedCalendar,
} from './utils/intlScrapedCalendar'

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

const commonScrapedCalendarConfig: IntlScrapedCalendarConfig = {
  leapMonthMeta: 13,
  plainMonthDayLeapMonthMaxDays,
  // When a Chinese/Dangi PlainMonthDay leap month-day falls outside the
  // accepted leap reference table, Temporal constrains through the
  // corresponding common month. Common lunisolar months top out at 30 days.
  plainMonthDayCommonMonthMaxDay: 30,
  getMonthDaySearchStartYear: getChineseDangiMonthDaySearchStartYear,
}

export function createChineseDangiCalendar(canonicalId: string) {
  return createIntlScrapedCalendar(canonicalId, commonScrapedCalendarConfig)
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
