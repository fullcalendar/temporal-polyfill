import { nativeMergeFields } from './bag'
import { eraOriginsByCalendarId, eraRemaps, japaneseCalendarId, leapMonthMetas } from './calendarConfig'
import { computeGregoryEraParts } from './calendarGregory'
import { NativeDateModOps, NativeDateRefineOps, NativeDayOfYearOps, NativeDiffOps, NativeMonthDayRefineOps, NativeMonthDayModOps, NativeMoveOps, NativePartOps, NativeYearMonthModOps, NativeYearMonthRefineOps, nativeDiffBase, nativeMoveBase, NativeStandardOps, DateParts, MonthCodeParts, EraParts, YearMonthParts, nativeYearMonthRefineBase, nativeDateRefineBase, nativeMonthDayRefineBase, eraYearToYear, monthCodeNumberToMonth, monthToMonthCodeNumber, nativeStandardBase, NativeDaysInMonthOps, NativeInLeapYearOps, NativeMonthsInYearOps, NativeDaysInYearOps, NativeEraOps, NativeEraYearOps, NativeMonthCodeOps, computeInLeapYear, computeMonthsInYear, computeDaysInMonth, computeDaysInYear, computeEra, computeEraYear, computeMonthCode, NativeYearMonthMoveOps, NativeYearMonthDiffOps, NativeYearMonthParseOps, NativeMonthDayParseOps } from './calendarNative'
import { computeIntlMonthsInYearSpan, diffEpochMilliByDay } from './diff'
import { OrigDateTimeFormat, hashIntlFormatParts, standardLocaleId } from './intlFormat'
import { IsoDateFields, isoTimeFieldDefaults } from './isoFields'
import { checkIsoDateInBounds, epochMilliToIso, isoArgsToEpochMilli, isoEpochFirstLeapYear, isoEpochOriginYear, isoToEpochMilli } from './isoMath'
import { intlMonthAdd } from './move'
import { utcTimeZoneId } from './timeZoneConfig'
import { milliInDay } from './units'
import { compareNumbers, createLazyGenerator, mapPropNamesToIndex } from './utils'

export function createCalendarIntlOps<M extends {}>(
  calendarId: string,
  methods: M
): M & IntlCalendar {
  return Object.assign(Object.create(methods), queryIntlCalendar(calendarId))
}

// Refine
// -------------------------------------------------------------------------------------------------

const intlYearMonthRefineDeps = {
  leapMonth: computeIntlLeapMonth,
  monthsInYearPart: computeIntlMonthsInYear,
  isoFields: computeIsoFieldsFromIntlParts,
  getEraOrigins: getIntlEraOrigins,
  getLeapMonthMeta: getIntlLeapMonthMeta,
}

const intlDateRefineDeps = {
  ...intlYearMonthRefineDeps,
  daysInMonthParts: computeIntlDaysInMonth,
}

const intlMonthDayRefineDeps = {
  ...intlDateRefineDeps,
  yearMonthForMonthDay: computeIntlYearMonthForMonthDay,
}

export const intlYearMonthRefineOps: NativeYearMonthRefineOps = {
  ...nativeYearMonthRefineBase,
  ...intlYearMonthRefineDeps,
}

export const intlDateRefineOps: NativeDateRefineOps = {
  ...nativeDateRefineBase,
  ...intlDateRefineDeps,
}

export const intlMonthDayRefineOps: NativeMonthDayRefineOps = {
  ...nativeMonthDayRefineBase,
  ...intlMonthDayRefineDeps,
}

// Mod
// -------------------------------------------------------------------------------------------------

export const intlYearMonthModOps: NativeYearMonthModOps = {
  ...intlYearMonthRefineOps,
  mergeFields: nativeMergeFields,
}

export const intlDateModOps: NativeDateModOps = {
  ...intlDateRefineOps,
  mergeFields: nativeMergeFields,
}

export const intlMonthDayModOps: NativeMonthDayModOps = {
  ...intlMonthDayRefineOps,
  mergeFields: nativeMergeFields,
}

// Math
// -------------------------------------------------------------------------------------------------

const intlMathOps = {
  dateParts: computeIntlDateParts,
  monthCodeParts: computeIntlMonthCodeParts,
  monthsInYearPart: computeIntlMonthsInYear,
  daysInMonthParts: computeIntlDaysInMonth,
  monthAdd: intlMonthAdd,
}

export const intlMoveOps: NativeMoveOps = {
  ...nativeMoveBase,
  ...intlMathOps,
  leapMonth: computeIntlLeapMonth,
  epochMilli: computeIntlEpochMilli,
}

export const intlDiffOps: NativeDiffOps = {
  ...nativeDiffBase,
  ...intlMathOps,
  monthsInYearSpan: computeIntlMonthsInYearSpan,
}

export const intlYearMonthMoveOps: NativeYearMonthMoveOps = {
  ...intlMoveOps,
  day: computeIntlDay,
}

export const intlYearMonthDiffOps: NativeYearMonthDiffOps = {
  ...intlDiffOps,
  day: computeIntlDay,
}

// Parts & Stats
// -------------------------------------------------------------------------------------------------

export const intlInLeapYearOps: NativeInLeapYearOps = {
  inLeapYear: computeInLeapYear,
  dateParts: computeIntlDateParts,
  inLeapYearPart: computeIntlInLeapYear,
}

export const intlMonthsInYearOps: NativeMonthsInYearOps = {
  monthsInYear: computeMonthsInYear,
  dateParts: computeIntlDateParts,
  monthsInYearPart: computeIntlMonthsInYear,
}

export const intlDaysInMonthOps: NativeDaysInMonthOps = {
  daysInMonth: computeDaysInMonth,
  dateParts: computeIntlDateParts,
  daysInMonthParts: computeIntlDaysInMonth,
}

export const intlDaysInYearOps: NativeDaysInYearOps = {
  daysInYear: computeDaysInYear,
  dateParts: computeIntlDateParts,
  daysInYearPart: computeIntlDaysInYear,
}

export const intlDayOfYearOps: NativeDayOfYearOps = {
  dayOfYear: computeIntlDayOfYear,
}

export const intlEraOps: NativeEraOps = {
  era: computeEra,
  eraParts: computeIntlEraParts,
}

export const intlEraYearOps: NativeEraYearOps = {
  eraYear: computeEraYear,
  eraParts: computeIntlEraParts,
}

export const intlMonthCodeOps: NativeMonthCodeOps = {
  monthCode: computeMonthCode,
  monthCodeParts: computeIntlMonthCodeParts,
  dateParts: computeIntlDateParts,
}

export const intlPartOps: NativePartOps = {
  dateParts: computeIntlDateParts,
  eraParts: computeIntlEraParts,
  monthCodeParts: computeIntlMonthCodeParts,
}

// String Parsing
// -------------------------------------------------------------------------------------------------

export const intlYearMonthParseOps: NativeYearMonthParseOps = {
  day: computeIntlDay,
}

export const intlMonthDayParseOps: NativeMonthDayParseOps = {
  dateParts: computeIntlDateParts,
  monthCodeParts: computeIntlMonthCodeParts,
  yearMonthForMonthDay: computeIntlYearMonthForMonthDay,
  isoFields: computeIsoFieldsFromIntlParts,
}

// Standard
// -------------------------------------------------------------------------------------------------

export const intlStandardOps: NativeStandardOps = {
  ...nativeStandardBase,
  dateParts: computeIntlDateParts,
  eraParts: computeIntlEraParts,
  monthCodeParts: computeIntlMonthCodeParts,
  yearMonthForMonthDay: computeIntlYearMonthForMonthDay,
  inLeapYearPart: computeIntlInLeapYear,
  leapMonth: computeIntlLeapMonth,
  monthsInYearPart: computeIntlMonthsInYear,
  monthsInYearSpan: computeIntlMonthsInYearSpan,
  daysInMonthParts: computeIntlDaysInMonth,
  daysInYearPart: computeIntlDaysInYear,
  dayOfYear: computeIntlDayOfYear,
  isoFields: computeIsoFieldsFromIntlParts,
  epochMilli: computeIntlEpochMilli,
  monthAdd: intlMonthAdd,
  getEraOrigins: getIntlEraOrigins,
  getLeapMonthMeta: getIntlLeapMonthMeta,
  year: computeIntlYear,
  month: computeIntlMonth,
  day: computeIntlDay,
}

// -------------------------------------------------------------------------------------------------

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

export interface IntlCalendar {
  idBase: string,
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
  const calendarIdBase = getCalendarIdBase(calendarId)

  if (calendarIdBase !== getCalendarIdBase(intlFormat.resolvedOptions().calendar)) {
    throw new RangeError('Invalid calendar: ' + calendarId)
  }

  function epochMilliToIntlFields(epochMilli: number) {
    const intlPartsHash = hashIntlFormatParts(intlFormat, epochMilli)
    return parseIntlDateFields(intlPartsHash, calendarIdBase)
  }

  return {
    idBase: calendarIdBase,
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

function buildIntlFormat(calendarId: string): Intl.DateTimeFormat {
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

function computeIntlYear(this: IntlCalendar, isoFields: IsoDateFields): number {
  return this.queryFields(isoFields).day
}

function computeIntlMonth(this: IntlCalendar, isoFields: IsoDateFields): number {
  const { year, month } = this.queryFields(isoFields)
  const { monthStrToIndex } = this.queryYearMonths(year)
  return monthStrToIndex[month] + 1
}

function computeIntlDay(this: IntlCalendar, isoFields: IsoDateFields): number {
  return this.queryFields(isoFields).day
}

function computeIntlDateParts(this: IntlCalendar, isoFields: IsoDateFields): DateParts {
  const { year, month, day } = this.queryFields(isoFields)
  const { monthStrToIndex } = this.queryYearMonths(year)
  return [year, monthStrToIndex[month] + 1, day]
}

function computeIsoFieldsFromIntlParts(
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

function computeIntlEpochMilli(
  this: IntlCalendar,
  year: number,
  month: number = 1,
  day: number = 1,
): number {
  return this.queryYearMonths(year).monthEpochMilli[month - 1] +
    (day - 1) * milliInDay
}

function computeIntlMonthCodeParts(
  this: IntlCalendar,
  year: number,
  month: number,
): MonthCodeParts {
  const leapMonth = computeIntlLeapMonth.call(this, year)
  const monthCodeNumber = monthToMonthCodeNumber(month, leapMonth)
  const isLeapMonth = leapMonth === monthCodeNumber
  return [monthCodeNumber, isLeapMonth]
}

function computeIntlLeapMonth(
  this: IntlCalendar,
  year: number,
): number | undefined {
  const currentMonthStrs = queryMonthStrs(this, year)
  const prevMonthStrs = queryMonthStrs(this, year - 1)
  const currentLength = currentMonthStrs.length

  if (currentLength > prevMonthStrs.length) {
    // hardcoded leap month. usually means complex month-code schemes
    const leapMonthMeta = leapMonthMetas[this.idBase]
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

function getIntlEraOrigins(this: IntlCalendar): Record<string, number> | undefined {
  return eraOriginsByCalendarId[this.idBase]
}

function getIntlLeapMonthMeta(this: IntlCalendar): number | undefined {
  return leapMonthMetas[this.idBase]
}

function computeIntlInLeapYear(this: IntlCalendar, year: number): boolean {
  const days = computeIntlDaysInYear.call(this, year)
  return days > computeIntlDaysInYear.call(this, year - 1) &&
    days > computeIntlDaysInYear.call(this, year + 1)
}

function computeIntlDaysInYear(this: IntlCalendar, year: number): number {
  const milli = computeIntlEpochMilli.call(this, year)
  const milliNext = computeIntlEpochMilli.call(this, year + 1)
  return diffEpochMilliByDay(milli, milliNext)
}

function computeIntlDaysInMonth(this: IntlCalendar, year: number, month: number): number {
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

function computeIntlDayOfYear(
  this: IntlCalendar,
  isoFields: IsoDateFields,
): number {
  const dayEpochMilli = isoToEpochMilli({
    ...isoFields,
    ...isoTimeFieldDefaults, // needed?
  })!
  const { year } = this.queryFields(isoFields)
  const yearStartEpochMilli = computeIntlEpochMilli.call(this, year)
  return diffEpochMilliByDay(yearStartEpochMilli, dayEpochMilli)
}

export function computeIntlMonthsInYear(this: IntlCalendar, year: number): number {
  return this.queryYearMonths(year).monthEpochMilli.length
}

const primaryJapaneseEraMilli = isoArgsToEpochMilli(1868, 9, 8)!

function computeIntlEraParts(this: IntlCalendar, isoFields: IsoDateFields): EraParts {
  if (
    this.idBase === japaneseCalendarId &&
    isoToEpochMilli(isoFields)! < primaryJapaneseEraMilli
  ) {
    return computeGregoryEraParts(isoFields)
  }
  const intlFields = this.queryFields(isoFields)
  return [intlFields.era, intlFields.eraYear]
}

function computeIntlYearMonthForMonthDay(
  this: IntlCalendar,
  monthCodeNumber: number,
  isLeapMonth: boolean,
  day: number,
): YearMonthParts {
  let [startYear, startMonth, startDay] = computeIntlDateParts.call(this, {
    isoYear: isoEpochFirstLeapYear,
    isoMonth: 12,
    isoDay: 31,
  })
  const startYearLeapMonth = computeIntlLeapMonth.call(this, startYear)
  const startMonthCodeNumber = monthToMonthCodeNumber(startMonth, startYearLeapMonth)
  const startMonthIsLeap = startMonth === startYearLeapMonth

  // ensure monthCodeNumber/isLeapMonth/day is within `isoEpochFirstLeapYear`
  // TODO: use general-purpose array-comparison util later
  if (
    (
      compareNumbers(monthCodeNumber, startMonthCodeNumber) ||
      compareNumbers(Number(isLeapMonth), Number(startMonthIsLeap)) ||
      compareNumbers(day, startDay)
    ) === 1
  ) {
    startYear--
  }

  for (let yearMove = 0; yearMove < 100; yearMove++) {
    const yearTry = startYear - yearMove // move backwards
    const leapMonthTry = computeIntlLeapMonth.call(this, yearTry)
    const monthTry = monthCodeNumberToMonth(monthCodeNumber, isLeapMonth, leapMonthTry)

    if (
      (!isLeapMonth || monthTry === leapMonthTry) &&
      day <= computeIntlDaysInMonth.call(this, yearTry, monthTry)
    ) {
      return [yearTry, monthTry]
    }
  }

  throw new RangeError('Could not guess year')
}

// -------------------------------------------------------------------------------------------------

function queryMonthStrs(intlCalendar: IntlCalendar, year: number): string[] {
  return Object.keys(intlCalendar.queryYearMonths(year).monthStrToIndex)
}

function getCalendarIdBase(calendarId: string): string {
  return calendarId.split('-')[0]
}
