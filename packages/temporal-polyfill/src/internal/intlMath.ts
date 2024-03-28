import { eraOriginsByCalendarId, eraRemaps } from './calendarConfig'
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
import {
  RawDateTimeFormat,
  hashIntlFormatParts,
  standardLocaleId,
} from './intlFormatUtils'
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
} from './timeMath'
import { utcTimeZoneId } from './timeZoneConfig'
import { milliInDay } from './units'
import { compareNumbers, mapPropNamesToIndex, memoize } from './utils'

interface IntlDateFields {
  era: string | undefined
  eraYear: number | undefined
  year: number
  monthString: string
  day: number
}

interface IntlYearData {
  monthEpochMillis: number[]
  monthStringToIndex: Record<string, number>
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
    } while ((intlFields = epochMilliToIntlFields(epochMilli)).year >= year)

    return {
      monthEpochMillis: millisReversed.reverse(),
      monthStringToIndex: mapPropNamesToIndex(monthStringsReversed.reverse()),
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

  if (intlParts.era) {
    const eraOrigins = eraOriginsByCalendarId[calendarIdBase]
    if (eraOrigins !== undefined) {
      era = normalizeShortEra(intlParts.era)
      eraYear = year // TODO: will this get optimized to next line?
      year = eraYearToYear(eraYear, eraOrigins[era] || 0)
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
    new RawDateTimeFormat(standardLocaleId, {
      calendar: id,
      timeZone: utcTimeZoneId,
      era: 'short', // 'narrow' is too terse for japanese months
      year: 'numeric',
      month: 'short', // easier to identify monthCodes
      day: 'numeric',
    }),
)

function normalizeShortEra(formattedEra: string): string {
  formattedEra = formattedEra
    .normalize('NFD') // 'Shōwa' -> 'Showa'
    .toLowerCase() // 'Before R.O.C.' -> 'before r.o.c.'
    .replace(/[^a-z0-9]/g, '') // 'before r.o.c.' -> 'beforeroc'

  return eraRemaps[formattedEra] || formattedEra
}

// Intl-Calendar methods
// -----------------------------------------------------------------------------

export function computeIntlYear(
  this: IntlCalendar,
  isoFields: IsoDateFields,
): number {
  return this.queryFields(isoFields).year
}

export function computeIntlMonth(
  this: IntlCalendar,
  isoFields: IsoDateFields,
): number {
  const { year, monthString } = this.queryFields(isoFields)
  const { monthStringToIndex } = this.queryYearData(year)
  return monthStringToIndex[monthString] + 1
}

export function computeIntlDay(
  this: IntlCalendar,
  isoFields: IsoDateFields,
): number {
  return this.queryFields(isoFields).day
}

export function computeIntlDateParts(
  this: IntlCalendar,
  isoFields: IsoDateFields,
): DateParts {
  const { year, monthString, day } = this.queryFields(isoFields)
  const { monthStringToIndex } = this.queryYearData(year)
  return [year, monthStringToIndex[monthString] + 1, day]
}

export function computeIsoFieldsFromIntlParts(
  this: IntlCalendar,
  year: number,
  month?: number,
  day?: number,
): IsoDateFields {
  return epochMilliToIso(computeIntlEpochMilli.call(this, year, month, day))
}

export function computeIntlEpochMilli(
  this: IntlCalendar,
  year: number,
  month = 1,
  day = 1,
): number {
  return (
    this.queryYearData(year).monthEpochMillis[month - 1] +
    (day - 1) * milliInDay
  )
}

export function computeIntlMonthCodeParts(
  this: IntlCalendar,
  year: number,
  month: number,
): MonthCodeParts {
  const leapMonth = computeIntlLeapMonth.call(this, year)
  const monthCodeNumber = monthToMonthCodeNumber(month, leapMonth)
  const isLeapMonth = leapMonth === month
  return [monthCodeNumber, isLeapMonth]
}

export function computeIntlLeapMonth(
  this: IntlCalendar,
  year: number,
): number | undefined {
  const currentMonthStrings = queryMonthStrings(this, year)
  const prevMonthStrings = queryMonthStrings(this, year - 1)
  const currentLength = currentMonthStrings.length

  if (currentLength > prevMonthStrings.length) {
    // hardcoded leap month. usually means complex month-code schemes
    const leapMonthMeta = getCalendarLeapMonthMeta(this) as number // hack for <0
    if (leapMonthMeta < 0) {
      return -leapMonthMeta
    }

    for (let i = 0; i < currentLength; i++) {
      if (currentMonthStrings[i] !== prevMonthStrings[i]) {
        return i + 1 // convert to 1-based
      }
    }
  }
}

export function computeIntlInLeapYear(
  this: IntlCalendar,
  year: number,
): boolean {
  const days = computeIntlDaysInYear.call(this, year)
  return (
    days > computeIntlDaysInYear.call(this, year - 1) &&
    days > computeIntlDaysInYear.call(this, year + 1)
  )
}

export function computeIntlDaysInYear(
  this: IntlCalendar,
  year: number,
): number {
  const milli = computeIntlEpochMilli.call(this, year)
  const milliNext = computeIntlEpochMilli.call(this, year + 1)
  return diffEpochMilliByDay(milli, milliNext)
}

export function computeIntlDaysInMonth(
  this: IntlCalendar,
  year: number,
  month: number,
): number {
  const { monthEpochMillis } = this.queryYearData(year)
  let nextMonth = month + 1
  let nextMonthEpochMilli = monthEpochMillis

  if (nextMonth > monthEpochMillis.length) {
    nextMonth = 1
    nextMonthEpochMilli = this.queryYearData(year + 1).monthEpochMillis
  }

  return diffEpochMilliByDay(
    monthEpochMillis[month - 1],
    nextMonthEpochMilli[nextMonth - 1],
  )
}

export function computeIntlMonthsInYear(
  this: IntlCalendar,
  year: number,
): number {
  return this.queryYearData(year).monthEpochMillis.length
}

export function computeIntlEraParts(
  this: IntlCalendar,
  isoFields: IsoDateFields,
): EraParts {
  const intlFields = this.queryFields(isoFields)
  return [intlFields.era, intlFields.eraYear]
}

export function computeIntlYearMonthForMonthDay(
  this: IntlCalendar,
  monthCodeNumber: number,
  isLeapMonth: boolean,
  day: number,
): YearMonthParts | undefined {
  let [startYear, startMonth, startDay] = computeIntlDateParts.call(this, {
    isoYear: isoEpochFirstLeapYear,
    isoMonth: isoMonthsInYear,
    isoDay: 31,
  })
  const startYearLeapMonth = computeIntlLeapMonth.call(this, startYear)
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
  for (let yearMove = 0; yearMove < 100; yearMove++) {
    const tryYear = startYear - yearMove
    const tryLeapMonth = computeIntlLeapMonth.call(this, tryYear)
    const tryMonth = monthCodeNumberToMonth(
      monthCodeNumber,
      isLeapMonth,
      tryLeapMonth,
    )
    const tryMonthIsLeap = tryMonth === tryLeapMonth

    if (
      isLeapMonth === tryMonthIsLeap &&
      day <= computeIntlDaysInMonth.call(this, tryYear, tryMonth)
    ) {
      return [tryYear, tryMonth]
    }
  }
}

// -----------------------------------------------------------------------------

function queryMonthStrings(intlCalendar: IntlCalendar, year: number): string[] {
  return Object.keys(intlCalendar.queryYearData(year).monthStringToIndex)
}
