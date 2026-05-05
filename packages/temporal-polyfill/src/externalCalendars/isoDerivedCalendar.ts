import type { ExternalCalendar } from '../internal/externalCalendar'
import type {
  CalendarDateFields,
  CalendarEraFields,
} from '../internal/fieldTypes'
import { japaneseCalendarId } from '../internal/intlCalendarConfig'
import {
  addIsoMonths,
  computeGregoryEraFields,
  computeIsoDateFields,
  computeIsoDaysInMonth,
  computeIsoDaysInYear,
  computeIsoFieldsFromParts,
  computeIsoInLeapYear,
  computeIsoMonthCodeParts,
  computeIsoYearMonthFieldsForMonthDay,
  diffIsoMonthSlots,
  isoEpochFirstLeapYear,
  isoMonthsInYear,
} from '../internal/isoMath'
import { isoArgsToEpochMilli, isoDateToEpochMilli } from '../internal/timeMath'
import { memoize } from '../internal/utils'
import { getIntlCalendar } from './intlCalendar'
import {
  eraOriginsByCalendarId,
  eraRemapsByCalendarId,
  isoYearOffsetsByCalendarId,
} from './intlCalendarData'

const isoDerivedCalendarIds: Record<string, true> = {
  'buddhist': true,
  'roc': true,
  [japaneseCalendarId]: true,
}

const primaryJapaneseEraMilli = isoArgsToEpochMilli(1873, 1, 1)!

export function isIsoDerivedCalendarId(id: string): boolean {
  return Boolean(isoDerivedCalendarIds[id])
}

export const getIsoDerivedCalendar = memoize(createIsoDerivedCalendar)

function createIsoDerivedCalendar(id: string): ExternalCalendar {
  const isoYearOffset = isoYearOffsetsByCalendarId[id] || 0

  function calendarYearToIsoYear(year: number) {
    return year - isoYearOffset
  }

  function isoYearToCalendarYear(year: number) {
    return year + isoYearOffset
  }

  return {
    id,
    eraOrigins: eraOriginsByCalendarId[id],
    eraRemaps: eraRemapsByCalendarId[id],
    monthDayReferenceYear: isoEpochFirstLeapYear + isoYearOffset,
    computeDateFields(isoDate) {
      const dateFields = computeIsoDateFields(isoDate)
      return {
        ...dateFields,
        year: isoYearToCalendarYear(dateFields.year),
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
      return computeIsoDerivedEraFields(id, isoDate)
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

function computeIsoDerivedEraFields(
  calendarId: string,
  isoDate: CalendarDateFields,
): CalendarEraFields {
  const year = isoDate.year + (isoYearOffsetsByCalendarId[calendarId] || 0)

  if (calendarId === 'buddhist') {
    return { era: 'be', eraYear: year }
  }

  if (calendarId === 'roc') {
    return year < 1
      ? { era: 'broc', eraYear: 1 - year }
      : { era: 'roc', eraYear: year }
  }

  if (calendarId === japaneseCalendarId) {
    const epochMilli = isoDateToEpochMilli(isoDate)!

    // Temporal's Japanese era round-tripping follows the Gregorian-aligned era
    // model used by test262; dates before 1873 stay on CE/BCE instead of
    // exposing ICU's historical Japanese era labels.
    return epochMilli < primaryJapaneseEraMilli
      ? computeGregoryEraFields(isoDate)
      : getIntlCalendar(japaneseCalendarId).computeEraFields(isoDate)
  }

  return {}
}
