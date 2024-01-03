import { eraOriginsByCalendarId, eraRemaps } from './calendarConfig'
import { diffEpochMilliByDay } from './diff'
import { OrigDateTimeFormat, hashIntlFormatParts, standardLocaleId } from './formatIntl'
import { IsoDateFields, isoTimeFieldDefaults } from './calendarIsoFields'
import { isoEpochFirstLeapYear, isoEpochOriginYear, isoMonthsInYear } from './calendarIso'
import { checkIsoDateInBounds, epochMilliToIso, isoArgsToEpochMilli, isoToEpochMilli } from './epochAndTime'
import { utcTimeZoneId } from './timeZoneNative'
import { milliInDay } from './units'
import { compareNumbers, createLazyGenerator, mapPropNamesToIndex } from './utils'
import { DateParts, EraParts, MonthCodeParts, NativeCalendar, YearMonthParts, computeCalendarIdBase, eraYearToYear, getCalendarLeapMonthMeta, monthCodeNumberToMonth, monthToMonthCodeNumber } from './calendarNative'
import * as errorMessages from './errorMessages'

interface IntlDateFields {
  era: string | undefined
  eraYear: number | undefined
  year: number
  month: string // string!
  day: number
}

interface IntlYearMonths {
  monthEpochMilli: number[],
  monthStrToIndex: Record<string, number>
}

export interface IntlCalendar extends NativeCalendar {
  queryFields: (isoFields: IsoDateFields) => IntlDateFields
  queryYearMonths: (year: number) => IntlYearMonths
}

// -------------------------------------------------------------------------------------------------

/*
Expects an already-normalized calendarId
*/
export const queryIntlCalendar = createLazyGenerator(createIntlCalendar)

function createIntlCalendar(calendarId: string): IntlCalendar {
  const intlFormat = buildIntlFormat(calendarId)
  const calendarIdBase = computeCalendarIdBase(calendarId)

  if (calendarIdBase !== computeCalendarIdBase(intlFormat.resolvedOptions().calendar)) {
    throw new RangeError(errorMessages.invalidCalendar(calendarId))
  }

  function epochMilliToIntlFields(epochMilli: number) {
    const intlPartsHash = hashIntlFormatParts(intlFormat, epochMilli)
    return parseIntlDateFields(intlPartsHash, calendarIdBase)
  }

  return {
    id: calendarId,
    queryFields: createIntlFieldCache(epochMilliToIntlFields),
    queryYearMonths: createIntlYearMonthCache(epochMilliToIntlFields),
  }
}

// Caches
// -------------------------------------------------------------------------------------------------

function createIntlFieldCache(
  epochMilliToIntlFields: (epochMilli: number) => IntlDateFields,
) {
  return createLazyGenerator((isoDateFields: IsoDateFields) => {
    const epochMilli = isoToEpochMilli(isoDateFields)!
    return epochMilliToIntlFields(epochMilli)
  }, WeakMap)
}

function createIntlYearMonthCache(
  epochMilliToIntlFields: (epochMilli: number) => IntlDateFields,
): (
  (year: number) => IntlYearMonths
) {
  const yearAtEpoch = epochMilliToIntlFields(0).year
  const yearCorrection = yearAtEpoch - isoEpochOriginYear

  function buildYear(year: number) {
    let epochMilli = isoArgsToEpochMilli(year - yearCorrection)!
    let intlFields
    const milliReversed: number[] = []
    const monthStrsReversed: string[] = []

    // move beyond current year
    do {
      epochMilli += 400 * milliInDay
    } while ((intlFields = epochMilliToIntlFields(epochMilli)).year <= year)

    do {
      // move to start-of-month
      epochMilli += (1 - intlFields.day) * milliInDay

      // only record the epochMilli if current year
      if (intlFields.year === year) {
        milliReversed.push(epochMilli)
        monthStrsReversed.push(intlFields.month)
      }

      // move to last day of previous month
      epochMilli -= milliInDay
    } while ((intlFields = epochMilliToIntlFields(epochMilli)).year >= year)

    return {
      monthEpochMilli: milliReversed.reverse(),
      monthStrToIndex: mapPropNamesToIndex(monthStrsReversed.reverse()),
    }
  }

  return createLazyGenerator(buildYear)
}

// DateTimeFormat Utils
// -------------------------------------------------------------------------------------------------

function parseIntlDateFields(
  intlPartsHash: Record<string, string>,
  calendarIdBase: string,
): IntlDateFields {
  return {
    ...parseIntlYear(intlPartsHash, calendarIdBase),
    month: intlPartsHash.month, // a short month string
    day: parseInt(intlPartsHash.day),
  }
}

export function parseIntlYear(
  intlPartsHash: Record<string, string>,
  calendarIdBase: string,
): {
  era: string | undefined
  eraYear: number | undefined
  year: number
} {
  let year = parseInt(intlPartsHash.relatedYear || intlPartsHash.year)
  let era: string | undefined
  let eraYear: number | undefined

  if (intlPartsHash.era) {
    const eraOrigins = eraOriginsByCalendarId[calendarIdBase]
    if (eraOrigins !== undefined) {
      era = normalizeShortEra(intlPartsHash.era)
      eraYear = year // TODO: will this get optimized to next line?
      year = eraYearToYear(eraYear, eraOrigins[era] || 0)
    }
  }

  return { era, eraYear, year }
}

// TODO: rename to be about calendar
export function buildIntlFormat(calendarId: string): Intl.DateTimeFormat {
  return new OrigDateTimeFormat(standardLocaleId, {
    calendar: calendarId,
    timeZone: utcTimeZoneId,
    era: 'short', // 'narrow' is too terse for japanese months
    year: 'numeric',
    month: 'short', // easier to identify monthCodes
    day: 'numeric',
  })
}

function normalizeShortEra(formattedEra: string): string {
  formattedEra = formattedEra
    .normalize('NFD') // 'Shōwa' -> 'Showa'
    .toLowerCase() // 'Before R.O.C.' -> 'before r.o.c.'
    .replace(/[^a-z0-9]/g, '') // 'before r.o.c.' -> 'beforeroc'

  return eraRemaps[formattedEra] || formattedEra
}

// Intl-Calendar methods
// -------------------------------------------------------------------------------------------------

export function computeIntlYear(this: IntlCalendar, isoFields: IsoDateFields): number {
  return this.queryFields(isoFields).year
}

export function computeIntlMonth(this: IntlCalendar, isoFields: IsoDateFields): number {
  const { year, month } = this.queryFields(isoFields)
  const { monthStrToIndex } = this.queryYearMonths(year)
  return monthStrToIndex[month] + 1
}

export function computeIntlDay(this: IntlCalendar, isoFields: IsoDateFields): number {
  return this.queryFields(isoFields).day
}

export function computeIntlDateParts(this: IntlCalendar, isoFields: IsoDateFields): DateParts {
  const { year, month, day } = this.queryFields(isoFields)
  const { monthStrToIndex } = this.queryYearMonths(year)
  return [year, monthStrToIndex[month] + 1, day]
}

export function computeIsoFieldsFromIntlParts(
  this: IntlCalendar,
  year: number,
  month?: number,
  day?: number,
): IsoDateFields {
  // check might be redundant if happens in epochMilliToIso/queryDateStart
  // TODO: i don't like that this is happening here
  return checkIsoDateInBounds({
    ...epochMilliToIso(computeIntlEpochMilli.call(this, year, month, day)),
  })
}

export function computeIntlEpochMilli(
  this: IntlCalendar,
  year: number,
  month: number = 1,
  day: number = 1,
): number {
  return this.queryYearMonths(year).monthEpochMilli[month - 1] +
    (day - 1) * milliInDay
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
  const currentMonthStrs = queryMonthStrs(this, year)
  const prevMonthStrs = queryMonthStrs(this, year - 1)
  const currentLength = currentMonthStrs.length

  if (currentLength > prevMonthStrs.length) {
    // hardcoded leap month. usually means complex month-code schemes
    const leapMonthMeta = getCalendarLeapMonthMeta(this) as number // hack for <0
    if (leapMonthMeta < 0) {
      return -leapMonthMeta
    }

    for (let i = 0; i < currentLength; i++) {
      if (currentMonthStrs[i] !== prevMonthStrs[i]) {
        return i + 1 // convert to 1-based
      }
    }
  }
}

export function computeIntlInLeapYear(this: IntlCalendar, year: number): boolean {
  const days = computeIntlDaysInYear.call(this, year)
  return days > computeIntlDaysInYear.call(this, year - 1) &&
    days > computeIntlDaysInYear.call(this, year + 1)
}

export function computeIntlDaysInYear(this: IntlCalendar, year: number): number {
  const milli = computeIntlEpochMilli.call(this, year)
  const milliNext = computeIntlEpochMilli.call(this, year + 1)
  return diffEpochMilliByDay(milli, milliNext)
}

export function computeIntlDaysInMonth(this: IntlCalendar, year: number, month: number): number {
  const { monthEpochMilli } = this.queryYearMonths(year)
  let nextMonth = month + 1
  let nextMonthEpochMilli = monthEpochMilli

  if (nextMonth > monthEpochMilli.length) {
    nextMonth = 1
    nextMonthEpochMilli = this.queryYearMonths(year + 1).monthEpochMilli
  }

  return diffEpochMilliByDay(
    monthEpochMilli[month - 1],
    nextMonthEpochMilli[nextMonth - 1],
  )
}

export function computeIntlDayOfYear(
  this: IntlCalendar,
  isoFields: IsoDateFields,
): number {
  const dayEpochMilli = isoToEpochMilli({
    ...isoFields,
    ...isoTimeFieldDefaults,
  })!
  const { year } = this.queryFields(isoFields)
  const yearStartEpochMilli = computeIntlEpochMilli.call(this, year)
  return diffEpochMilliByDay(yearStartEpochMilli, dayEpochMilli)
}

export function computeIntlMonthsInYear(this: IntlCalendar, year: number): number {
  return this.queryYearMonths(year).monthEpochMilli.length
}

export function computeIntlEraParts(this: IntlCalendar, isoFields: IsoDateFields): EraParts {
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
  const startMonthCodeNumber = monthToMonthCodeNumber(startMonth, startYearLeapMonth)
  const startMonthIsLeap = startMonth === startYearLeapMonth

  // If startYear doesn't span isoEpochFirstLeapYear, walk backwards
  // TODO: smaller way to do this with epochMilli comparison?
  if (
    (
      compareNumbers(monthCodeNumber, startMonthCodeNumber) ||
      compareNumbers(Number(isLeapMonth), Number(startMonthIsLeap)) ||
      compareNumbers(day, startDay)
    ) === 1
  ) {
    startYear--
  }

  // Walk backwards until finding a year with monthCode/day
  for (let yearMove = 0; yearMove < 100; yearMove++) {
    const tryYear = startYear - yearMove
    const tryLeapMonth = computeIntlLeapMonth.call(this, tryYear)
    const tryMonth = monthCodeNumberToMonth(monthCodeNumber, isLeapMonth, tryLeapMonth)
    const tryMonthIsLeap = tryMonth === tryLeapMonth

    if (
      isLeapMonth === tryMonthIsLeap &&
      day <= computeIntlDaysInMonth.call(this, tryYear, tryMonth)
    ) {
      return [tryYear, tryMonth]
    }
  }
}

// -------------------------------------------------------------------------------------------------

function queryMonthStrs(intlCalendar: IntlCalendar, year: number): string[] {
  return Object.keys(intlCalendar.queryYearMonths(year).monthStrToIndex)
}
