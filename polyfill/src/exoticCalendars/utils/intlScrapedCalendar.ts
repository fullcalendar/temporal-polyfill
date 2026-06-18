import { type ExoticCalendarWithoutId } from '../../internal/calendarImpl'
import {
  type MonthCodeParts,
  monthCodeNumberToMonth,
  monthToMonthCodeNumber,
} from '../../internal/calendarMonthCode'
import {
  diffEpochMilliDays,
  epochMilliToIsoDateTime,
  isoArgsToEpochDays,
  isoDateToEpochMilli,
} from '../../internal/epochMath'
import * as errorMessages from '../../internal/errorMessages'
import {
  type CalendarDateFields,
  type CalendarEraFields,
  type CalendarYearMonthFields,
} from '../../internal/fieldTypes'
import {
  RawDateTimeFormat,
  formatEpochMilliToPartsRecord,
} from '../../internal/intlFormatUtils'
import {
  isoEpochFirstLeapYear,
  isoEpochOriginYear,
  isoMonthsInYear,
} from '../../internal/isoCalendarMath'
import { maxMilli } from '../../internal/temporalConstants'
import { utcTimeZoneId } from '../../internal/timeZoneConfig'
import { milliInUtcDay } from '../../internal/units'
import {
  bindArgs,
  compareNumbers,
  memoize,
  throwRangeError,
} from '../../internal/utils'

export interface IntlDateFields {
  era: string | undefined
  eraYear: number | undefined
  year: number
  month: number
  monthString: string
  day: number
}

export interface IntlYearData {
  monthEpochMillis: number[]
  // Keep the ordered month labels exactly as Intl produced them. Some
  // calendars repeat the same label for common/leap months, so collapsing to a
  // string->index map loses the leap-month position entirely.
  monthStrings: string[]
}

export type IntlYearDataCache = (year: number) => IntlYearData

export interface IntlScrapedCalendarConfig {
  leapMonthMeta?: number
  monthDayLeapMonthMaxDays?: Record<number, number>
  monthDayCommonMonthMaxDay?: number
  getMonthDaySearchStartYear?(
    monthCodeNumber: number,
    isLeapMonth: boolean,
    day: number,
  ): number
}

export interface IntlScrapedCalendarData {
  queryFields: (isoDate: CalendarDateFields) => IntlDateFields
  queryYearData: IntlYearDataCache
}

// -----------------------------------------------------------------------------

export function createIntlScrapedCalendar(
  normCalendarId: string,
  config: IntlScrapedCalendarConfig,
): ExoticCalendarWithoutId {
  const intlData = createIntlScrapedCalendarData(normCalendarId)

  return {
    leapMonthMeta: config.leapMonthMeta,
    monthDayLeapMonthMaxDays: config.monthDayLeapMonthMaxDays,
    monthDayCommonMonthMaxDay: config.monthDayCommonMonthMaxDay,
    computeDateFields: intlData.queryFields,
    computeIsoFieldsFromParts: bindArgs(
      computeIsoFieldsFromIntlParts,
      intlData,
    ),
    computeEpochMilli: bindArgs(computeIntlEpochMilli, intlData),
    computeMonthCodeParts: bindArgs(
      computeIntlMonthCodeParts,
      intlData,
      config.leapMonthMeta,
    ),
    computeYearMonthFieldsForMonthDay: bindArgs(
      computeIntlYearMonthFieldsForMonthDay,
      intlData,
      config.leapMonthMeta,
      config.getMonthDaySearchStartYear,
    ),
    computeInLeapYear: bindArgs(
      computeIntlInLeapYear,
      intlData,
      config.leapMonthMeta,
    ),
    computeMonthsInYear: bindArgs(computeIntlMonthsInYear, intlData),
    computeDaysInMonth: bindArgs(computeIntlDaysInMonth, intlData),
    computeDaysInYear: bindArgs(computeIntlDaysInYear, intlData),
    computeLeapMonth: bindArgs(
      computeIntlLeapMonth,
      intlData,
      config.leapMonthMeta,
    ),
    computeEraFields: bindArgs(computeIntlEraFields, intlData),
    addMonths: bindArgs(addIntlMonths, intlData),
    diffMonthSlots: bindArgs(diffIntlMonthSlots, intlData),
  }
}

export function createIntlScrapedCalendarData(
  normCalendarId: string,
): IntlScrapedCalendarData {
  const intlFormat = createCalendarIntlFormat(normCalendarId)

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
  return memoize((isoDateFields: CalendarDateFields) => {
    const epochMilli = isoDateToEpochMilli(isoDateFields)
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
    let epochMilli = isoArgsToEpochDays(year - yearCorrection) * milliInUtcDay
    let intlFields: IntlDateFields
    let iterations = 0
    const millisReversed: number[] = []
    const monthStringsReversed: string[] = []

    // move beyond current year
    do {
      epochMilli += 400 * milliInUtcDay
    } while ((intlFields = epochMilliToIntlFields(epochMilli)).year <= year)

    do {
      // move to start-of-month
      epochMilli += (1 - intlFields.day) * milliInUtcDay

      // Yet-to-be-created hybrid calendar systems (such as one that bridges
      // from Julian-to-Gregorian) could theoretically skips days in a month,
      // making that day # of the last day != # days in the month:
      // https://github.com/tc39/proposal-temporal/issues/1315#issuecomment-781264909
      //
      // This would break our algorithm as epochMilli would be moved *before*
      // the start-of-month. The code below nudges the day back in bounds.
      //
      // if (epochMilli < 0) {
      //   while (
      //     epochMilliToIntlFields(epochMilli).monthString !==
      //     intlFields.monthString
      //   ) {
      //     epochMilli += milliInUtcDay
      //   }
      // }
      //
      // However, other parts of the code (like computeIntlEpochMilli) would
      // somehow need to be adjusted too. Not worth it.

      // only record the epochMilli if current year
      if (intlFields.year === year) {
        millisReversed.push(epochMilli)
        monthStringsReversed.push(intlFields.monthString)
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
      monthStrings: monthStringsReversed.reverse(),
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
    ...parseIntlYear(intlParts),
    month: 0,
    monthString: intlParts.month,
    day: parseInt(intlParts.day),
  }
}

function parseIntlYear(intlParts: Record<string, string>): {
  era: string | undefined
  eraYear: number | undefined
  year: number
} {
  return {
    era: undefined,
    eraYear: undefined,
    year: parseInt(intlParts.relatedYear || intlParts.year),
  }
}

function createCalendarIntlFormat(normCalendarId: string): Intl.DateTimeFormat {
  // Offset math needs midnight as 00:00, not h24's 24:00.
  return new RawDateTimeFormat('en-u-hc-h23', {
    calendar: normCalendarId,
    timeZone: utcTimeZoneId,
    era: 'short', // 'narrow' is too terse for japanese months
    year: 'numeric',
    month: 'short', // easier to identify monthCodes
    day: 'numeric',
  })
}

// Intl-Calendar methods
// -----------------------------------------------------------------------------

function computeIsoFieldsFromIntlParts(
  intlData: IntlScrapedCalendarData,
  year: number,
  month?: number,
  day?: number,
): CalendarDateFields {
  return epochMilliToIsoDateTime(
    computeIntlEpochMilli(intlData, year, month, day),
  )
}

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

function computeIntlMonthCodeParts(
  intlData: IntlScrapedCalendarData,
  leapMonthMeta: IntlScrapedCalendarConfig['leapMonthMeta'],
  year: number,
  month: number,
): MonthCodeParts {
  const leapMonth = computeIntlLeapMonth(intlData, leapMonthMeta, year)
  const monthCodeNumber = monthToMonthCodeNumber(month, leapMonth)
  const isLeapMonth = leapMonth === month
  return [monthCodeNumber, isLeapMonth]
}

function computeIntlLeapMonth(
  intlData: IntlScrapedCalendarData,
  leapMonthMeta: IntlScrapedCalendarConfig['leapMonthMeta'],
  year: number,
): number | undefined {
  if (leapMonthMeta === undefined) {
    return undefined
  }

  const currentMonthStrings = intlData.queryYearData(year).monthStrings
  if (currentMonthStrings.length <= 12) {
    return undefined
  }

  // Negative metadata means the leap slot is fixed whenever a leap month exists.
  if (leapMonthMeta < 0) {
    return -leapMonthMeta
  }

  // Some calendars expose the leap month as a repeated adjacent month label.
  // Preserve the second occurrence as the actual leap-month slot.
  for (let i = 1; i < currentMonthStrings.length; i++) {
    if (currentMonthStrings[i] === currentMonthStrings[i - 1]) {
      return i + 1
    }
  }

  // Some ICU builds label leap months explicitly (`Mo2bis`) instead of
  // reusing the common-month label. Treat those marked labels as the leap
  // month slot directly.
  for (let i = 0; i < currentMonthStrings.length; i++) {
    if (/bis$/i.test(currentMonthStrings[i])) {
      return i + 1
    }
  }

  // Older/newer ICU data sometimes encodes leap months with distinct labels
  // like `Mo2bis` instead of repeating the common month label. Fall back to
  // the previous-year diff heuristic in that case.
  const prevMonthStrings = intlData.queryYearData(year - 1).monthStrings
  for (let i = 0; i < currentMonthStrings.length; i++) {
    if (currentMonthStrings[i] !== prevMonthStrings[i]) {
      return i + 1
    }
  }
}

function computeIntlInLeapYear(
  intlData: IntlScrapedCalendarData,
  leapMonthMeta: IntlScrapedCalendarConfig['leapMonthMeta'],
  year: number,
): boolean {
  if (leapMonthMeta !== undefined) {
    return computeIntlMonthsInYear(intlData, year) > 12
  }

  const daysInYear = computeIntlDaysInYear(intlData, year)
  return (
    daysInYear > computeIntlDaysInYear(intlData, year - 1) ||
    daysInYear > computeIntlDaysInYear(intlData, year + 1)
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

function computeIntlMonthsInYear(
  intlData: IntlScrapedCalendarData,
  year: number,
): number {
  return intlData.queryYearData(year).monthEpochMillis.length
}

function computeIntlEraFields(
  intlData: IntlScrapedCalendarData,
  isoDate: CalendarDateFields,
): CalendarEraFields {
  const intlFields = intlData.queryFields(isoDate)
  return { era: intlFields.era, eraYear: intlFields.eraYear }
}

function computeIntlYearMonthFieldsForMonthDay(
  intlData: IntlScrapedCalendarData,
  leapMonthMeta: IntlScrapedCalendarConfig['leapMonthMeta'],
  getMonthDaySearchStartYear: IntlScrapedCalendarConfig['getMonthDaySearchStartYear'],
  monthCodeNumber: number,
  isLeapMonth: boolean,
  day: number,
): CalendarYearMonthFields | undefined {
  const startIsoYear =
    getMonthDaySearchStartYear?.(monthCodeNumber, isLeapMonth, day) ||
    isoEpochFirstLeapYear

  const startCalendarDateFields = intlData.queryFields({
    year: startIsoYear,
    month: isoMonthsInYear,
    day: 31,
  })
  let {
    year: startYear,
    month: startMonth,
    day: startDay,
  } = startCalendarDateFields
  const startYearLeapMonth = computeIntlLeapMonth(
    intlData,
    leapMonthMeta,
    startYear,
  )
  const startMonthCodeNumber = monthToMonthCodeNumber(
    startMonth,
    startYearLeapMonth,
  )
  const startMonthIsLeap = startMonth === startYearLeapMonth

  // If startYear doesn't span isoEpochFirstLeapYear, walk backwards
  // TODO: smaller way to do this with epochMilli comparison?
  if (
    (compareNumbers(monthCodeNumber, startMonthCodeNumber) ||
      compareNumbers(Number(isLeapMonth), Number(startMonthIsLeap)) ||
      compareNumbers(day, startDay)) === 1
  ) {
    startYear--
  }

  // Walk backwards until finding a year with monthCode/day
  // TODO: reference implementation says only go 20 years back.
  for (let yearMove = 0; yearMove < 100; yearMove++) {
    const tryYear = startYear - yearMove
    const tryLeapMonth = computeIntlLeapMonth(intlData, leapMonthMeta, tryYear)
    const tryMonth = monthCodeNumberToMonth(
      monthCodeNumber,
      isLeapMonth,
      tryLeapMonth,
    )
    const tryMonthIsLeap = tryMonth === tryLeapMonth

    if (
      isLeapMonth === tryMonthIsLeap &&
      day <= computeIntlDaysInMonth(intlData, tryYear, tryMonth)
    ) {
      return { year: tryYear, month: tryMonth }
    }
  }
}

function addIntlMonths(
  intlData: IntlScrapedCalendarData,
  year: number,
  month: number,
  monthDelta: number,
): CalendarYearMonthFields {
  if (monthDelta) {
    month += monthDelta

    if (!Number.isSafeInteger(month)) {
      throwRangeError(errorMessages.outOfBoundsDate)
    }

    if (monthDelta < 0) {
      while (month < 1) {
        month += computeIntlMonthsInYear(intlData, --year)
      }
    } else {
      let monthsInYear: number
      while (month > (monthsInYear = computeIntlMonthsInYear(intlData, year))) {
        month -= monthsInYear
        year++
      }
    }
  }

  return { year, month }
}

function diffIntlMonthSlots(
  intlData: IntlScrapedCalendarData,
  year0: number,
  month0: number,
  year1: number,
  month1: number,
): number {
  const cmp = compareNumbers(year0, year1) || compareNumbers(month0, month1)

  if (!cmp) {
    return 0
  }

  if (year0 === year1) {
    return month1 - month0
  }

  if (cmp < 0) {
    let months = computeIntlMonthsInYear(intlData, year0) - month0 + month1
    for (let year = year0 + 1; year < year1; year++) {
      months += computeIntlMonthsInYear(intlData, year)
    }
    return months
  }

  return -diffIntlMonthSlots(intlData, year1, month1, year0, month0)
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
