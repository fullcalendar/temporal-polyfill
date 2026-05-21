import { type ExoticCalendar } from '../internal/calendarSlot'
import { isoArgsToEpochMilli, isoDateToEpochMilli } from '../internal/epochMath'
import {
  type CalendarDateFields,
  type CalendarEraFields,
} from '../internal/fieldTypes'
import {
  addIsoMonths,
  computeGregoryEraFields,
  computeIsoDaysInMonth,
  computeIsoDaysInYear,
  computeIsoFieldsFromParts,
  computeIsoInLeapYear,
  computeIsoMonthCodeParts,
  computeIsoYearMonthFieldsForMonthDay,
  diffIsoMonthSlots,
  isoEpochFirstLeapYear,
  isoMonthsInYear,
} from '../internal/isoCalendarMath'
import { memoize } from '../internal/utils'
import {
  eraOriginsByCalendarId,
  eraRemapsByCalendarId,
  isoYearOffsetsByCalendarId,
} from './exoticCalendarData'
import { getIntlCalendar } from './intlCalendar'

// Gregory-aligned calendars share ISO month/day math and derive their year from
// a fixed offset, so they avoid Intl for the bulk of their work. The one
// exception is `japanese` era labeling on/after 1873-01-01: Temporal exposes
// the modern era names (meiji/taisho/showa/heisei/reiwa) via Intl rather than
// a hand-maintained table, so we delegate to getIntlCalendar('japanese') for
// that narrow case. `buddhist` and `roc` have no Intl dependency.

const gregoryAlignedCalendarIds: Record<string, true> = {
  'buddhist': true,
  'roc': true,
  'japanese': true,
}

const primaryJapaneseEraMilli = isoArgsToEpochMilli(1873, 1, 1)!

export function isGregoryAlignedCalendarId(normCalendarId: string): boolean {
  return Boolean(gregoryAlignedCalendarIds[normCalendarId])
}

export const getGregoryAlignedCalendar = memoize(createGregoryAlignedCalendar)

function createGregoryAlignedCalendar(normCalendarId: string): ExoticCalendar {
  const isoYearOffset = isoYearOffsetsByCalendarId[normCalendarId] || 0

  function calendarYearToIsoYear(year: number) {
    return year - isoYearOffset
  }

  function isoYearToCalendarYear(year: number) {
    return year + isoYearOffset
  }

  return {
    id: normCalendarId,
    eraOrigins: eraOriginsByCalendarId[normCalendarId],
    eraRemaps: eraRemapsByCalendarId[normCalendarId],
    monthDayReferenceYear: isoEpochFirstLeapYear + isoYearOffset,
    removeEraFieldsOnMonthDayReplace: normCalendarId === 'japanese',
    computeDateFields(isoDate) {
      return {
        ...isoDate,
        year: isoYearToCalendarYear(isoDate.year),
      }
    },
    computeIsoFieldsFromParts(year, month, day) {
      return computeIsoFieldsFromParts(calendarYearToIsoYear(year), month, day)
    },
    computeEpochMilli(year, month, day) {
      return isoArgsToEpochMilli(calendarYearToIsoYear(year), month, day)!
    },
    computeMonthCodeParts(_year, month) {
      return computeIsoMonthCodeParts(month)
    },
    computeYearMonthFieldsForMonthDay(monthCodeNumber, isLeapMonth) {
      const yearMonth = computeIsoYearMonthFieldsForMonthDay(
        monthCodeNumber,
        isLeapMonth,
      )
      return (
        yearMonth && {
          year: isoYearToCalendarYear(yearMonth.year),
          month: yearMonth.month,
        }
      )
    },
    computeInLeapYear(year) {
      return computeIsoInLeapYear(calendarYearToIsoYear(year))
    },
    computeMonthsInYear() {
      return isoMonthsInYear
    },
    computeDaysInMonth(year, month) {
      return computeIsoDaysInMonth(calendarYearToIsoYear(year), month)
    },
    computeDaysInYear(year) {
      return computeIsoDaysInYear(calendarYearToIsoYear(year))
    },
    computeLeapMonth() {
      return undefined
    },
    computeEraFields(isoDate) {
      return computeGregoryAlignedEraFields(normCalendarId, isoDate)
    },
    addMonths(year, month, monthDelta) {
      const yearMonth = addIsoMonths(
        calendarYearToIsoYear(year),
        month,
        monthDelta,
      )
      return {
        year: isoYearToCalendarYear(yearMonth.year),
        month: yearMonth.month,
      }
    },
    diffMonthSlots(year0, month0, year1, month1) {
      return diffIsoMonthSlots(
        calendarYearToIsoYear(year0),
        month0,
        calendarYearToIsoYear(year1),
        month1,
      )
    },
    isConstrainedFinalIntercalaryMonthDiff() {
      return false
    },
  }
}

function computeGregoryAlignedEraFields(
  normCalendarId: string,
  isoDate: CalendarDateFields,
): CalendarEraFields {
  const year = isoDate.year + (isoYearOffsetsByCalendarId[normCalendarId] || 0)

  if (normCalendarId === 'buddhist') {
    return { era: 'be', eraYear: year }
  }

  if (normCalendarId === 'roc') {
    return year < 1
      ? { era: 'broc', eraYear: 1 - year }
      : { era: 'roc', eraYear: year }
  }

  if (normCalendarId === 'japanese') {
    const epochMilli = isoDateToEpochMilli(isoDate)!

    // Temporal's Japanese era round-tripping follows the Gregorian-aligned era
    // model used by test262; dates before 1873 stay on CE/BCE instead of
    // exposing ICU's historical Japanese era labels.
    return epochMilli < primaryJapaneseEraMilli
      ? computeGregoryEraFields(isoDate)
      : getIntlCalendar('japanese').computeEraFields(isoDate)
  }

  return {}
}
