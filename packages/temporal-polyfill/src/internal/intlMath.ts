import {
  defaultEraByCalendarIdBase,
  eraOriginsByCalendarId,
  eraRemapsByCalendarId,
} from './calendarConfig'
import { computeCalendarIdBase } from './calendarId'
import {
  DateParts,
  EraParts,
  MonthCodeParts,
  NativeCalendar,
  YearMonthParts,
  eraYearToYear,
  getCalendarLeapMonthMeta,
  monthCodeNumberToMonth,
  monthToMonthCodeNumber,
} from './calendarNative'
import { diffEpochMilliByDay } from './diff'
import * as errorMessages from './errorMessages'
import { RawDateTimeFormat, hashIntlFormatParts } from './intlFormatUtils'
import { IsoDateFields } from './isoFields'
import {
  isoEpochFirstLeapYear,
  isoEpochOriginYear,
  isoMonthsInYear,
} from './isoMath'
import {
  epochMilliToIso,
  isoArgsToEpochMilli,
  isoToEpochMilli,
  maxMilli,
} from './timeMath'
import { utcTimeZoneId } from './timeZoneConfig'
import { milliInDay } from './units'
import { compareNumbers, memoize } from './utils'

interface IntlDateFields {
  era: string | undefined
  eraYear: number | undefined
  year: number
  monthString: string
  day: number
}

interface IntlYearData {
  monthEpochMillis: number[]
  // Keep the ordered month labels exactly as Intl produced them. Some
  // calendars repeat the same label for common/leap months, so collapsing to a
  // string->index map loses the leap-month position entirely.
  monthStrings: string[]
}

export interface IntlCalendar extends NativeCalendar {
  queryFields: (isoFields: IsoDateFields) => IntlDateFields
  queryYearData: (year: number) => IntlYearData
}

// -----------------------------------------------------------------------------

/*
Expects an already-normalized calendarId
*/
export const queryIntlCalendar = memoize(createIntlCalendar)

function createIntlCalendar(calendarId: string): IntlCalendar {
  const intlFormat = queryCalendarIntlFormat(calendarId)
  const calendarIdBase = computeCalendarIdBase(calendarId)

  function epochMilliToIntlFields(epochMilli: number) {
    const intlParts = hashIntlFormatParts(intlFormat, epochMilli)
    return parseIntlDateFields(intlParts, calendarIdBase)
  }

  return {
    id: calendarId,
    queryFields: createIntlFieldCache(epochMilliToIntlFields),
    queryYearData: createIntlYearDataCache(epochMilliToIntlFields),
  }
}

// Caches
// -----------------------------------------------------------------------------

function createIntlFieldCache(
  epochMilliToIntlFields: (epochMilli: number) => IntlDateFields,
) {
  return memoize((isoDateFields: IsoDateFields) => {
    const epochMilli = isoToEpochMilli(isoDateFields)!
    return epochMilliToIntlFields(epochMilli)
  }, WeakMap)
}

function createIntlYearDataCache(
  epochMilliToIntlFields: (epochMilli: number) => IntlDateFields,
): (year: number) => IntlYearData {
  const yearAtEpoch = epochMilliToIntlFields(0).year
  const yearCorrection = yearAtEpoch - isoEpochOriginYear

  function buildYear(year: number) {
    let epochMilli = isoArgsToEpochMilli(year - yearCorrection)!
    let intlFields: IntlDateFields
    let iterations = 0
    const millisReversed: number[] = []
    const monthStringsReversed: string[] = []

    // move beyond current year
    do {
      epochMilli += 400 * milliInDay
    } while ((intlFields = epochMilliToIntlFields(epochMilli)).year <= year)

    do {
      // move to start-of-month
      epochMilli += (1 - intlFields.day) * milliInDay

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
      //     epochMilli += milliInDay
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
      epochMilli -= milliInDay

      if (
        // Safeguard to avoid infinite loop when Intl.DateTimeFormat gives
        // unespected results
        // Some calendars drift farther from the naive ISO-year guess than ISO
        // or Gregorian do. Keep the guard, but give Intl-backed calendars more
        // room before treating the result as invalid.
        ++iterations > 500 ||
        // If any part of a calendar's year underflows epochMilli,
        // give up
        epochMilli < -maxMilli
      ) {
        throw new RangeError(errorMessages.invalidProtocolResults)
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
  calendarIdBase: string,
): IntlDateFields {
  return {
    ...parseIntlYear(intlParts, calendarIdBase),
    monthString: intlParts.month,
    day: parseInt(intlParts.day),
  }
}

export function parseIntlYear(
  intlParts: Record<string, string>,
  calendarIdBase: string,
): {
  era: string | undefined
  eraYear: number | undefined
  year: number
} {
  let year = parseIntlPartsYear(intlParts)
  let era: string | undefined
  let eraYear: number | undefined
  const eraOrigins = eraOriginsByCalendarId[calendarIdBase]
  const eraRemaps = eraRemapsByCalendarId[calendarIdBase] || {}

  if (eraOrigins !== undefined) {
    if (intlParts.era) {
      era =
        calendarIdBase === 'islamic'
          ? 'ah' // https://github.com/fullcalendar/temporal-polyfill/issues/39
          : intlParts.era
              .normalize('NFD') // 'Shōwa' -> 'Showa'
              .toLowerCase() // 'Before R.O.C.' -> 'before r.o.c.'
              .replace(/[^a-z0-9]/g, '') // 'before r.o.c.' -> 'beforeroc'

      // Firefox 96 introduced a bug where the `'short'` format of the era
      // option mistakenly returns the one-letter (narrow) format instead. The
      // code below handles either the correct or Firefox-buggy format. See
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1752253
      if (era === 'bc' || era === 'b') {
        era = 'bce'
      } else if (era === 'ad' || era === 'a') {
        era = 'ce'
      } else if (era === 'beforeroc') {
        era = 'broc'
      }
    } else {
      // Some Intl implementations omit `era` for single-era calendars. Tests
      // still expect Temporal objects to expose the canonical era code.
      era = defaultEraByCalendarIdBase[calendarIdBase]
    }

    if (era !== undefined) {
      const normalizedEra = eraRemaps[era] || era
      const eraOrigin = eraOrigins[normalizedEra]

      if (eraOrigin !== undefined) {
        era = normalizedEra
        eraYear = year
        year = eraYearToYear(eraYear, eraOrigin)
      }
    }
  }

  return { era, eraYear, year }
}

export function parseIntlPartsYear(intlParts: Record<string, string>): number {
  return parseInt(intlParts.relatedYear || intlParts.year)
}

/**
 * @param id Expects already-normalized
 */
export const queryCalendarIntlFormat = memoize(
  (id: string): Intl.DateTimeFormat =>
    new RawDateTimeFormat('en', {
      calendar: id,
      timeZone: utcTimeZoneId,
      era: 'short', // 'narrow' is too terse for japanese months
      year: 'numeric',
      month: 'short', // easier to identify monthCodes
      day: 'numeric',
      hour12: false,
    }),
)

// Intl-Calendar methods
// -----------------------------------------------------------------------------

export function computeIntlYear(
  intlCalendar: IntlCalendar,
  isoFields: IsoDateFields,
): number {
  return intlCalendar.queryFields(isoFields).year
}

export function computeIntlMonth(
  intlCalendar: IntlCalendar,
  isoFields: IsoDateFields,
): number {
  const { year } = intlCalendar.queryFields(isoFields)
  return computeIntlMonthIndex(intlCalendar, year, isoToEpochMilli(isoFields)!)
}

export function computeIntlDay(
  intlCalendar: IntlCalendar,
  isoFields: IsoDateFields,
): number {
  return intlCalendar.queryFields(isoFields).day
}

export function computeIntlDateParts(
  intlCalendar: IntlCalendar,
  isoFields: IsoDateFields,
): DateParts {
  const { year, day } = intlCalendar.queryFields(isoFields)
  const epochMilli = isoToEpochMilli(isoFields)!
  return [year, computeIntlMonthIndex(intlCalendar, year, epochMilli), day]
}

export function computeIsoFieldsFromIntlParts(
  intlCalendar: IntlCalendar,
  year: number,
  month?: number,
  day?: number,
): IsoDateFields {
  return epochMilliToIso(computeIntlEpochMilli(intlCalendar, year, month, day))
}

export function computeIntlEpochMilli(
  intlCalendar: IntlCalendar,
  year: number,
  month = 1,
  day = 1,
): number {
  return (
    intlCalendar.queryYearData(year).monthEpochMillis[month - 1] +
    (day - 1) * milliInDay
  )
}

export function computeIntlMonthCodeParts(
  intlCalendar: IntlCalendar,
  year: number,
  month: number,
): MonthCodeParts {
  const leapMonth = computeIntlLeapMonth(intlCalendar, year)
  const monthCodeNumber = monthToMonthCodeNumber(month, leapMonth)
  const isLeapMonth = leapMonth === month
  return [monthCodeNumber, isLeapMonth]
}

export function computeIntlLeapMonth(
  intlCalendar: IntlCalendar,
  year: number,
): number | undefined {
  const leapMonthMeta = getCalendarLeapMonthMeta(intlCalendar)
  if (leapMonthMeta === undefined) {
    return undefined
  }

  const currentMonthStrings = queryMonthStrings(intlCalendar, year)
  if (currentMonthStrings.length <= 12) {
    return undefined
  }

  // Hebrew-style calendars have a fixed leap month position whenever a leap
  // month exists in that year, so no string probing is needed.
  if (leapMonthMeta < 0) {
    return -leapMonthMeta
  }

  // Chinese/Dangi expose the leap month as a repeated adjacent month label.
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
  const prevMonthStrings = queryMonthStrings(intlCalendar, year - 1)
  for (let i = 0; i < currentMonthStrings.length; i++) {
    if (currentMonthStrings[i] !== prevMonthStrings[i]) {
      return i + 1
    }
  }
}

export function computeIntlInLeapYear(
  intlCalendar: IntlCalendar,
  year: number,
): boolean {
  return getCalendarLeapMonthMeta(intlCalendar) !== undefined
    ? computeIntlMonthsInYear(intlCalendar, year) > 12
    : computeIntlDaysInYear(intlCalendar, year) >
        computeIntlDaysInYear(intlCalendar, year - 1)
}

export function computeIntlDaysInYear(
  intlCalendar: IntlCalendar,
  year: number,
): number {
  const milli = computeIntlEpochMilli(intlCalendar, year)
  const milliNext = computeIntlEpochMilli(intlCalendar, year + 1)
  return diffEpochMilliByDay(milli, milliNext)
}

export function computeIntlDaysInMonth(
  intlCalendar: IntlCalendar,
  year: number,
  month: number,
): number {
  const { monthEpochMillis } = intlCalendar.queryYearData(year)
  let nextMonth = month + 1
  let nextMonthEpochMilli = monthEpochMillis

  if (nextMonth > monthEpochMillis.length) {
    nextMonth = 1
    nextMonthEpochMilli = intlCalendar.queryYearData(year + 1).monthEpochMillis
  }

  return diffEpochMilliByDay(
    monthEpochMillis[month - 1],
    nextMonthEpochMilli[nextMonth - 1],
  )
}

export function computeIntlMonthsInYear(
  intlCalendar: IntlCalendar,
  year: number,
): number {
  return intlCalendar.queryYearData(year).monthEpochMillis.length
}

export function computeIntlEraParts(
  intlCalendar: IntlCalendar,
  isoFields: IsoDateFields,
): EraParts {
  const intlFields = intlCalendar.queryFields(isoFields)
  return [intlFields.era, intlFields.eraYear]
}

export function computeIntlYearMonthForMonthDay(
  intlCalendar: IntlCalendar,
  monthCodeNumber: number,
  isLeapMonth: boolean,
  day: number,
): YearMonthParts | undefined {
  const isChinese =
    intlCalendar.id && computeCalendarIdBase(intlCalendar.id) === 'chinese'
  const startIsoYear = isChinese
    ? chineseMonthDaySearchStartYear(monthCodeNumber, isLeapMonth, day)
    : isoEpochFirstLeapYear

  let [startYear, startMonth, startDay] = computeIntlDateParts(intlCalendar, {
    isoYear: startIsoYear,
    isoMonth: isoMonthsInYear,
    isoDay: 31,
  })
  const startYearLeapMonth = computeIntlLeapMonth(intlCalendar, startYear)
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
  // TODO: reference implementation says only go 20 years back! also special-cases per-calendar!
  for (let yearMove = 0; yearMove < 100; yearMove++) {
    const tryYear = startYear - yearMove
    const tryLeapMonth = computeIntlLeapMonth(intlCalendar, tryYear)
    const tryMonth = monthCodeNumberToMonth(
      monthCodeNumber,
      isLeapMonth,
      tryLeapMonth,
    )
    const tryMonthIsLeap = tryMonth === tryLeapMonth

    if (
      isLeapMonth === tryMonthIsLeap &&
      day <= computeIntlDaysInMonth(intlCalendar, tryYear, tryMonth)
    ) {
      return [tryYear, tryMonth]
    }
  }
}

function chineseMonthDaySearchStartYear(
  monthCodeNumber: number,
  isLeapMonth: boolean,
  day: number,
): number {
  // Note that ICU4C actually has _no_ years in which leap months M01L and
  // M09L through M12L have 30 days. The values marked with (*) here are years
  // in which the leap month occurs with 29 days. ICU4C disagrees with ICU4X
  // here and it is not clear which is correct.
  if (isLeapMonth) {
    switch (monthCodeNumber) {
      case 1:
        return 1651 // *
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
        return 1832 // *
      case 10:
        return 1870 // *
      case 11:
        return 1814 // *
      case 12:
        return 1890 // *
    }
  }
  return 1972
}

// -----------------------------------------------------------------------------

function queryMonthStrings(intlCalendar: IntlCalendar, year: number): string[] {
  return intlCalendar.queryYearData(year).monthStrings
}

function computeIntlMonthIndex(
  intlCalendar: IntlCalendar,
  year: number,
  epochMilli: number,
): number {
  const { monthEpochMillis } = intlCalendar.queryYearData(year)

  for (let i = monthEpochMillis.length - 1; i >= 0; i--) {
    if (epochMilli >= monthEpochMillis[i]) {
      return i + 1
    }
  }

  throw new RangeError(errorMessages.invalidProtocolResults)
}
