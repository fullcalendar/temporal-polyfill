import {
  diffEpochMilliDays,
  isoDateToEpochMilli,
  isoPartsToEpochDays,
} from '../../internal/epochMath'
import { type CalendarDateFields } from '../../internal/fieldTypes'
import {
  RawDateTimeFormat,
  formatEpochMilliToPartsRecord,
} from '../../internal/intlFormatUtils'
import { isoEpochOriginYear } from '../../internal/isoCalendarMath'
import { maxMilli } from '../../internal/temporalConstants'
import { utcTimeZoneId } from '../../internal/timeZoneConfig'
import { milliInUtcDay } from '../../internal/units'
import { memoize, throwRangeError } from '../../internal/utils'

export interface IntlDateFields {
  year: number
  month: number
  day: number
}

export interface IntlYearData {
  monthEpochMillis: number[]
}

export type IntlYearDataCache = (year: number) => IntlYearData

export interface IntlScrapedCalendarData {
  queryFields: (isoDate: CalendarDateFields) => IntlDateFields
  queryYearData: IntlYearDataCache
}

// -----------------------------------------------------------------------------

export function createIntlScrapedCalendarData(
  normCalendarId: string,
): IntlScrapedCalendarData {
  // Offset math needs midnight as 00:00, not h24's 24:00.
  const intlFormat = new RawDateTimeFormat('en-u-hc-h23', {
    calendar: normCalendarId,
    timeZone: utcTimeZoneId,
    era: 'short', // 'narrow' is too terse for japanese months
    year: 'numeric',
    month: 'short', // easier to identify monthCodes
    day: 'numeric',
  })

  function rawEpochMilliToIntlFields(epochMilli: number) {
    const intlParts = formatEpochMilliToPartsRecord(intlFormat, epochMilli)
    return parseIntlDateFields(intlParts)
  }

  const queryYearData = createIntlYearDataCache(rawEpochMilliToIntlFields)
  const queryFields = createIntlFieldCache(
    rawEpochMilliToIntlFields,
    queryYearData,
  )

  return { queryFields, queryYearData }
}

// Caches
// -----------------------------------------------------------------------------

function createIntlFieldCache(
  epochMilliToIntlFields: (epochMilli: number) => IntlDateFields,
  queryYearData: IntlYearDataCache,
) {
  // Key by the internal ISO-date field object, not by caller text. This sits
  // above queryYearData: repeated property access can skip the full Intl scrape,
  // while year data remains the shared source for month-boundary lookups.
  return memoize((isoDate: CalendarDateFields) => {
    const epochMilli = isoDateToEpochMilli(isoDate)
    const intlFields = epochMilliToIntlFields(epochMilli)
    return {
      ...intlFields,
      month: computeIntlMonthIndex(queryYearData, intlFields.year, epochMilli),
    }
  }, WeakMap)
}

function createIntlYearDataCache(
  epochMilliToIntlFields: (epochMilli: number) => IntlDateFields,
): IntlYearDataCache {
  // Per-normalized-calendar cache, keyed only by numeric calendar year. This is
  // the expensive Intl-derived year-shape table used by both directions.
  const yearAtEpoch = epochMilliToIntlFields(0).year
  const yearCorrection = yearAtEpoch - isoEpochOriginYear

  function buildYear(year: number) {
    let epochMilli = isoPartsToEpochDays(year - yearCorrection) * milliInUtcDay
    let intlFields: IntlDateFields
    let iterations = 0
    const millisReversed: number[] = []

    // move beyond current year
    do {
      epochMilli += 400 * milliInUtcDay
    } while ((intlFields = epochMilliToIntlFields(epochMilli)).year <= year)

    do {
      // move to start-of-month
      epochMilli += (1 - intlFields.day) * milliInUtcDay

      // Yet-to-be-created hybrid calendar systems (such as one that bridges
      // from Julian-to-Gregorian) could theoretically skip days in a month,
      // making that day # of the last day != # days in the month. This would
      // break our algorithm by moving epochMilli before the start-of-month.
      // Supporting that would also require changes in computeIntlEpochMilli,
      // so it is intentionally left outside this implementation.

      // only record the epochMilli if current year
      if (intlFields.year === year) {
        millisReversed.push(epochMilli)
      }

      // move to last day of previous month
      epochMilli -= milliInUtcDay

      if (
        // Safeguard to avoid infinite loop when Intl.DateTimeFormat gives
        // unexpected results. Some calendars drift farther from the naive
        // ISO-year guess than ISO or Gregorian do, so give Intl-backed
        // calendars more room before treating the result as invalid.
        ++iterations > 500 ||
        // If any part of a calendar's year underflows epochMilli,
        // give up
        epochMilli < -maxMilli
      ) {
        throwRangeError()
      }
    } while ((intlFields = epochMilliToIntlFields(epochMilli)).year >= year)

    return {
      monthEpochMillis: millisReversed.reverse(),
    }
  }

  return memoize(buildYear)
}

// DateTimeFormat Utils
// -----------------------------------------------------------------------------

function parseIntlDateFields(
  intlParts: Record<string, string>,
): IntlDateFields {
  return {
    year: parseInt(intlParts.relatedYear || intlParts.year),
    month: 0,
    day: parseInt(intlParts.day),
  }
}

// Intl-Calendar methods
// -----------------------------------------------------------------------------

export function computeIntlEpochMilli(
  intlData: IntlScrapedCalendarData,
  year: number,
  month = 1,
  day = 1,
): number {
  return (
    intlData.queryYearData(year).monthEpochMillis[month - 1] +
    (day - 1) * milliInUtcDay
  )
}

export function computeIntlDaysInYear(
  intlData: IntlScrapedCalendarData,
  year: number,
): number {
  const milli = computeIntlEpochMilli(intlData, year)
  const milliNext = computeIntlEpochMilli(intlData, year + 1)
  return diffEpochMilliDays(milli, milliNext)
}

export function computeIntlDaysInMonth(
  intlData: IntlScrapedCalendarData,
  year: number,
  month: number,
): number {
  const { monthEpochMillis } = intlData.queryYearData(year)
  let nextMonth = month + 1
  let nextMonthEpochMilli = monthEpochMillis

  if (nextMonth > monthEpochMillis.length) {
    nextMonth = 1
    nextMonthEpochMilli = intlData.queryYearData(year + 1).monthEpochMillis
  }

  return diffEpochMilliDays(
    monthEpochMillis[month - 1],
    nextMonthEpochMilli[nextMonth - 1],
  )
}

// -----------------------------------------------------------------------------

function computeIntlMonthIndex(
  queryYearData: IntlYearDataCache,
  year: number,
  epochMilli: number,
): number {
  const { monthEpochMillis } = queryYearData(year)

  for (let i = monthEpochMillis.length - 1; i >= 0; i--) {
    if (epochMilli >= monthEpochMillis[i]) {
      return i + 1
    }
  }

  throwRangeError()
}
