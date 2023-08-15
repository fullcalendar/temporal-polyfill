import {
  eraOriginsByCalendarId,
  eraRemaps,
  getAllowErasInFields,
  getErasBeginMidYear,
  gregoryCalendarId,
  isoCalendarId,
  japaneseCalendarId,
  leapYearMetas,
} from './calendarConfig'
import {
  EraYearOrYear,
  MonthFields,
  YearFieldsIntl,
  intlYearFieldNames,
  eraYearFieldNames,
  monthDayFieldNames,
  monthFieldNames,
  yearStatNames,
  DayFields,
  DateBag,
  YearMonthBag,
  MonthDayBag,
} from './calendarFields'
import {
  computeIntlMonthsInYearSpan,
  computeIsoMonthsInYearSpan,
  diffDatesExact,
  diffEpochMilliByDay,
} from './diff'
import { OrigDateTimeFormat, hashIntlFormatParts, standardLocaleId } from './intlFormat'
import { IsoDateFields, isoTimeFieldDefaults } from './isoFields'
import { IsoDateInternals } from './isoInternals'
import {
  checkIsoDateInBounds,
  computeIsoDayOfWeek,
  computeIsoDaysInMonth,
  computeIsoDaysInWeek,
  computeIsoDaysInYear,
  computeIsoIsLeapYear,
  computeIsoMonthsInYear,
  computeIsoWeekOfYear,
  computeIsoYearOfWeek,
  epochMilliToIso,
  isoArgsToEpochMilli,
  isoEpochFirstLeapYear,
  isoEpochOriginYear,
  isoToEpochMilli,
} from './isoMath'
import { moveByIntlMonths, moveByIsoMonths, moveDate } from './move'
import { Overflow } from './options'
import { Unit, milliInDay } from './units'
import { Callable, clampEntity, createLazyGenerator, mapPropNamesToIndex, padNumber2 } from './utils'
import { CalendarOps, validateFieldNames } from './calendarOps'
import { DurationInternals } from './durationFields'
import { ensureString } from './cast'

// Base Calendar Implementation
// -------------------------------------------------------------------------------------------------

export class CalendarImpl implements CalendarOps {
  constructor(public id: string) {}

  year(isoDateFields: IsoDateFields): number {
    return isoDateFields.isoYear
  }

  month(isoDateFields: IsoDateFields): number {
    return isoDateFields.isoMonth
  }

  day(isoDateFields: IsoDateFields): number {
    return isoDateFields.isoDay
  }

  era(isoDateFields: IsoDateFields): string | undefined {
    return undefined // hopefully minifier will remove
  }

  eraYear(isoDateFields: IsoDateFields): number | undefined {
    return undefined // hopefully minifier will remove
  }

  monthCode(isoDateFields: IsoDateFields): string {
    return formatMonthCode(isoDateFields.isoMonth)
  }

  daysInMonth(isoDateFields: IsoDateFields): number {
    return this.queryDaysInMonth(
      ...(this.queryYearMonthDay(isoDateFields) as unknown as [number, number]),
    )
  }

  dateFromFields(fields: DateBag, overflow?: Overflow): IsoDateInternals {
    const year = this.refineYear(fields)
    const month = this.refineMonth(fields, year, overflow)
    const day = this.refineDay(fields as DayFields, month, year, overflow)

    return this.queryIsoFields(year, month, day)
  }

  yearMonthFromFields(fields: YearMonthBag, overflow?: Overflow): IsoDateInternals {
    const year = this.refineYear(fields)
    const month = this.refineMonth(fields, year, overflow)

    return this.queryIsoFields(year, month, 1)
  }

  monthDayFromFields(fields: MonthDayBag, overflow?: Overflow): IsoDateInternals {
    let { month, monthCode } = fields as Partial<MonthFields>
    let year
    let isLeapMonth
    let monthCodeNumber
    let day

    if (monthCode !== undefined) {
      [monthCodeNumber, isLeapMonth] = parseMonthCode(monthCode)
      year = fields.year

      if (year !== undefined || this.id === isoCalendarId) {
        // just for validation
        // year can be undefined
        month = this.refineMonth(fields, year!, overflow)
      } else {
        month = fields.month

        // without year, half-ass our validation...
        // TODO: improve

        if (monthCodeNumber <= 0) {
          throw new RangeError('Below zero')
        }

        // TODO: should be smarter for Intl calendars with leap-months? (use year if available?)
        if (month !== undefined && month !== monthCodeNumber) {
          throw new RangeError('Inconsistent month/monthCode')
        }
      }

      const maybeDay = fields.day
      if (maybeDay === undefined) {
        throw new TypeError('Must specify day')
      }

      day = maybeDay
    } else {
      // derive monthCodeNumber/isLeapMonth from year/month, then discard year
      year = this.refineYear(fields as EraYearOrYear)
      month = this.refineMonth(fields, year, overflow)
      day = this.refineDay(fields as DayFields, month, year, overflow)

      const leapMonth = this.queryLeapMonth(year)
      isLeapMonth = month === leapMonth
      monthCodeNumber = month - ( // TODO: more DRY with formatMonthCode
        (leapMonth && month >= leapMonth)
          ? 1
          : 0)
    }

    [year, month] = this.queryYearMonthForMonthDay(monthCodeNumber, isLeapMonth, day)

    // TODO: only do this if not also calling refineDay
    if (this.id === isoCalendarId) {
      // TODO: more DRY with refineDay
      day = clampEntity(
        'day',
        day,
        1,
        this.queryDaysInMonth(year, month),
        overflow,
      )
    }

    return this.queryIsoFields(year, month, day)
  }

  fields(fieldNames: Iterable<string>): string[] {
    const fieldNameSet = validateFieldNames(fieldNames, true)

    if (getAllowErasInFields(this) && fieldNameSet.has('year')) {
      return [...fieldNameSet.values(), ...eraYearFieldNames]
    }

    return [...fieldNameSet.values()]
  }

  mergeFields(
    baseFields: Record<string, unknown>,
    additionalFields: Record<string, unknown>
  ): Record<string, unknown> {
    const merged = { ...baseFields }

    removeIfAnyProps(merged, additionalFields, monthFieldNames)

    if (getAllowErasInFields(this)) {
      removeIfAnyProps(merged, additionalFields, intlYearFieldNames)
    }

    if (getErasBeginMidYear(this)) {
      removeIfAnyProps(
        merged,
        additionalFields,
        monthDayFieldNames,
        eraYearFieldNames,
      )
    }

    return Object.assign(Object.create(null), merged, additionalFields)
  }

  // Internal Querying
  // -----------------

  queryIsoFields(year: number, month: number, day: number): IsoDateInternals {
    return checkIsoDateInBounds({
      calendar: this,
      isoYear: year,
      isoMonth: month,
      isoDay: day,
    })
  }

  queryYearMonthDay(isoDateFields: IsoDateFields): [number, number, number] {
    return [isoDateFields.isoYear, isoDateFields.isoMonth, isoDateFields.isoDay]
  }

  queryYearMonthForMonthDay(monthCodeNumber: number, isLeapMonth: boolean, day: number): [number, number] {
    return [isoEpochFirstLeapYear, monthCodeNumber]
  }

  queryLeapMonth(year: number): number | undefined {
    return undefined // hopefully removed by minifier
  }

  // Algorithmic Computations
  // ------------------------

  dayOfYear(isoDateFields: IsoDateFields): number {
    const dayEpochMilli = isoToEpochMilli({
      ...isoDateFields,
      ...isoTimeFieldDefaults,
    })!
    const yearStartEpochMilli = this.queryDateStart(this.year(isoDateFields))
    return diffEpochMilliByDay(yearStartEpochMilli, dayEpochMilli)
  }

  dateAdd(
    isoDateFields: IsoDateFields,
    durationFields: DurationInternals,
    overflow?: Overflow,
  ): IsoDateInternals  {
    return moveDate(this, isoDateFields, durationFields, overflow)
  }

  dateUntil(
    startIsoDateFields: IsoDateFields,
    endIsoDateFields: IsoDateFields,
    largestUnit: Unit, // TODO: only year/month/week/day?
  ): DurationInternals {
    return diffDatesExact(this, startIsoDateFields, endIsoDateFields, largestUnit)
  }

  // Field Refining
  // --------------

  refineYear(fields: Partial<YearFieldsIntl>): number {
    let { era, eraYear, year } = fields
    const allowEras = getAllowErasInFields(this)

    if (allowEras && era !== undefined && eraYear !== undefined) {
      const yearByEra = refineEraYear(this, era, eraYear)

      if (year !== undefined && year !== yearByEra) {
        throw new RangeError('The year and era/eraYear must agree')
      }

      year = yearByEra
    } else if (year === undefined) {
      throw new TypeError('Must specify year' + (allowEras ? ' or era/eraYear' : ''))
    }

    return year
  }

  refineMonth(
    fields: Partial<MonthFields>,
    year: number, // optional if known that calendar doesn't support leap months
    overflow?: Overflow,
  ): number {
    let { month, monthCode } = fields

    if (monthCode !== undefined) {
      const monthByCode = refineMonthCode(this, monthCode, year)

      if (month !== undefined && month !== monthByCode) {
        throw new RangeError('The month and monthCode do not agree')
      }

      month = monthByCode
      overflow = Overflow.Reject // monthCode parsing doesn't constrain
    } else if (month === undefined) {
      throw new TypeError('Must specify either month or monthCode')
    }

    // TODO: do this earlier, in refiner (toPositiveNonZeroInteger)
    if (month <= 0) {
      throw new RangeError('Below zero')
    }

    return clampEntity(
      'month',
      month,
      1,
      this.computeMonthsInYear(year),
      overflow,
    )
  }

  refineDay(
    fields: DayFields,
    month: number,
    year: number,
    overflow?: Overflow
  ): number {
    const { day } = fields

    if (day === undefined) {
      throw new TypeError('Must specify day')
    }

    // TODO: do this earlier, in refiner (toPositiveNonZeroInteger)
    if (day <= 0) {
      throw new RangeError('Below zero')
    }

    return clampEntity(
      'day',
      day,
      1,
      this.queryDaysInMonth(year, month),
      overflow,
    )
  }
}

// Base Calendar Implementation :: Year Query Methods
// -------------------------------------------------------------------------------------------------

interface YearComputeMethods {
  computeDaysInYear(year: number): number
  computeIsLeapYear(year: number): boolean
  computeMonthsInYear(year: number): number
}

// sorted alphabetically, for predictable macros
const yearComputeMethods: YearComputeMethods = {
  computeDaysInYear: computeIsoDaysInYear,
  computeIsLeapYear: computeIsoIsLeapYear,
  computeMonthsInYear: computeIsoMonthsInYear,
}

// Base Calendar Implementation :: Year Methods
// -------------------------------------------------------------------------------------------------

interface YearMethods {
  daysInYear(isoFields: IsoDateFields): number
  inLeapYear(isoFields: IsoDateFields): boolean
  monthsInYear(isoFields: IsoDateFields): number
}

const yearMethods = {} as YearMethods

(
  Object.keys(yearComputeMethods) as (keyof YearComputeMethods)[]
).forEach((computeMethodName, i) => {
  yearMethods[yearStatNames[i]] = function(
    this: CalendarImpl,
    isoDateFields: IsoDateFields,
  ) {
    return this[computeMethodName](this.year(isoDateFields))
  } as Callable
})

// Base Calendar Implementation :: Week Methods
// -------------------------------------------------------------------------------------------------

interface WeekMethods {
  daysInWeek(isoFields: IsoDateFields): number
  dayOfWeek(isoFields: IsoDateFields): number
  weekOfYear(isoFields: IsoDateFields): number
  yearOfWeek(isoFields: IsoDateFields): number
}

const weekMethods: WeekMethods = {
  daysInWeek: computeIsoDaysInWeek,
  dayOfWeek: computeIsoDayOfWeek,
  weekOfYear: computeIsoWeekOfYear,
  yearOfWeek: computeIsoYearOfWeek,
}

// Base Calendar Implementation :: Misc Methods
// -------------------------------------------------------------------------------------------------
// TODO: what about 'query' -> 'compute' ?

interface MiscMethods {
  addMonths(year: number, month: number, monthDelta: number): [number, number]
  queryDateStart(year: number, month?: number, day?: number): number
  queryDaysInMonth(year: number, month: number): number
  queryMonthsInYearSpan(yearStart: number, yearEnd: number): number
}

const miscMethods: MiscMethods = {
  addMonths: moveByIsoMonths,
  queryDateStart(year: number, month?: number, day?: number) {
    const epochMilli = isoArgsToEpochMilli(year, month, day)
    if (epochMilli === undefined) { // YUCK
      throw new RangeError('Out of range')
    }
    return epochMilli
  },
  queryDaysInMonth: computeIsoDaysInMonth,
  queryMonthsInYearSpan: computeIsoMonthsInYearSpan,
}

// Base Calendar Implementation :: Prototype Extension
// -------------------------------------------------------------------------------------------------

export interface CalendarImpl extends YearComputeMethods {}
export interface CalendarImpl extends YearMethods {}
export interface CalendarImpl extends WeekMethods {}
export interface CalendarImpl extends MiscMethods {}

Object.assign(CalendarImpl.prototype, {
  ...yearComputeMethods,
  ...yearMethods,
  ...weekMethods,
  ...miscMethods,
})

// Refining Utils
// -------------------------------------------------------------------------------------------------

function refineEraYear(calendar: CalendarImpl, era: string, eraYear: number): number {
  const eraOrigins = getEraOrigins(calendar.id)
  if (eraOrigins === undefined) {
    throw new RangeError('Does not accept era/eraYear')
  }

  const eraOrigin = eraOrigins[era]
  if (eraOrigin === undefined) {
    throw new RangeError('Unknown era')
  }

  return eraYearToYear(eraYear, eraOrigin)
}

function refineMonthCode(
  calendar: CalendarImpl,
  monthCode: string,
  year: number, // optional if known that calendar doesn't support leap months
) {
  const leapMonth = calendar.queryLeapMonth(year)
  const [monthCodeNumber, isLeapMonth] = parseMonthCode(monthCode)
  const month = refineMonthCodeNumber(monthCodeNumber, isLeapMonth, leapMonth)

  if (isLeapMonth) {
    const leapYearMeta = leapYearMetas[getCalendarIdBase(calendar.id)]
    if (leapYearMeta === undefined) {
      throw new RangeError('Calendar system doesnt support leap months')
    }

    if (
      leapYearMeta > 0
        ? month > leapYearMeta // max possible leap month
        : month !== -leapYearMeta // (negative) constant leap month
    ) {
      throw new RangeError('Invalid leap-month month code')
    }

    if (month !== leapMonth) {
      throw new RangeError('Invalid leap-month month code')
    }
  }

  return month
}

// Gregory Calendar
// -------------------------------------------------------------------------------------------------

class GregoryCalendarImpl extends CalendarImpl {
  era(isoDateFields: IsoDateFields): string | undefined {
    return computeGregoryEra(isoDateFields.isoYear)
  }

  eraYear(isoDateFields: IsoDateFields): number | undefined {
    return computeGregoryEraYear(isoDateFields.isoYear)
  }
}

function computeGregoryEra(isoYear: number): string {
  return isoYear < 1 ? 'bce' : 'ce'
}

function computeGregoryEraYear(isoYear: number): number {
  return isoYear < 1 ? -(isoYear - 1) : isoYear
}

// Japanese Calendar
// -------------------------------------------------------------------------------------------------

class JapaneseCalendarImpl extends GregoryCalendarImpl {
  isoDateFieldsToIntl = createJapaneseFieldCache()

  era(isoDateFields: IsoDateFields): string | undefined {
    return this.isoDateFieldsToIntl(isoDateFields).era
  }

  eraYear(isoDateFields: IsoDateFields): number | undefined {
    return this.isoDateFieldsToIntl(isoDateFields).eraYear
  }
}

// Intl Calendar
// -------------------------------------------------------------------------------------------------

class IntlCalendarImpl extends CalendarImpl {
  isoDateFieldsToIntl: (isoDateFields: IsoDateFields) => IntlFields
  queryYear: YearQueryFunc
  yearAtEpoch: number

  constructor(id: string) {
    super(id)

    const epochMilliToIntlFields = createEpochMilliToIntlFields(id)
    const [queryYear, yearAtEpoch] = createIntlMonthCache(epochMilliToIntlFields)

    this.isoDateFieldsToIntl = createIntlFieldCache(epochMilliToIntlFields)
    this.queryYear = queryYear
    this.yearAtEpoch = yearAtEpoch
  }

  year(isoDateFields: IsoDateFields): number {
    return this.queryYearMonthDay(isoDateFields)[0]
  }

  month(isoDateFields: IsoDateFields): number {
    return this.queryYearMonthDay(isoDateFields)[1]
  }

  monthCode(isoDateFields: IsoDateFields): string {
    const [year, month] = this.queryYearMonthDay(isoDateFields)
    const leapMonth = this.queryLeapMonth(year)
    return formatMonthCode(month, leapMonth)
  }

  addMonths(year: number, month: number, monthDelta: number): [
    year: number,
    month: number,
  ] {
    return moveByIntlMonths(year, month, monthDelta, this)
  }

  // Internal Querying
  // -----------------

  queryIsoFields(year: number, month: number, day: number): IsoDateInternals {
    return checkIsoDateInBounds({ // check might be redundant if happens in epochMilliToIso/queryDateStart
      calendar: this,
      ...epochMilliToIso(this.queryDateStart(year, month, day)),
    })
  }

  computeDaysInYear(year: number): number {
    const milli = this.queryDateStart(year)
    const milliNext = this.queryDateStart(year + 1)
    return diffEpochMilliByDay(milli, milliNext)
  }

  computeIsLeapYear(year: number): boolean {
    const days = this.computeDaysInYear(year)
    return days > this.computeDaysInYear(year - 1) &&
      days > this.computeDaysInYear(year + 1)
  }

  queryYearMonthDay(isoDateFields: IsoDateFields): [
    year: number,
    month: number,
    day: number,
  ] {
    const intlFields = this.isoDateFieldsToIntl(isoDateFields)
    const { year, month, day } = intlFields
    const { monthStrToIndex } = this.queryYear(year)
    return [year, monthStrToIndex[month] + 1, day]
  }

  queryYearMonthForMonthDay(monthCodeNumber: number, isLeapMonth: boolean, day: number): [
    year: number,
    month: number,
  ] {
    let year = this.yearAtEpoch
    const endYear = year + 100

    for (; year < endYear; year++) {
      const leapMonth = this.queryLeapMonth(year)

      // TODO: don't repeatedly refine
      const month = refineMonthCodeNumber(monthCodeNumber, isLeapMonth, leapMonth)

      if (
        (!isLeapMonth || month === leapMonth) &&
        day <= this.queryDaysInMonth(year, month)
      ) {
        return [year, month]
      }
    }

    throw new RangeError('Could not guess year')
  }

  queryLeapMonth(year: number): number | undefined {
    const currentMonthStrs = this.queryMonthStrs(year)
    const prevMonthStrs = this.queryMonthStrs(year - 1)
    const prevLength = currentMonthStrs.length

    if (currentMonthStrs.length > prevLength) {
      for (let i = 0; i < prevLength; i++) {
        if (prevMonthStrs[i] !== currentMonthStrs[i]) {
          return i + 1 // convert to 1-based
        }
      }
    }
  }

  computeMonthsInYear(year: number): number {
    const { monthEpochMilli } = this.queryYear(year)
    return monthEpochMilli.length
  }

  queryMonthsInYearSpan(yearDelta: number, yearStart: number): number {
    return computeIntlMonthsInYearSpan(yearDelta, yearStart, this)
  }

  queryDaysInMonth(year: number, month: number): number {
    const { monthEpochMilli } = this.queryYear(year)
    let nextMonth = month + 1
    let nextMonthEpochMilli = monthEpochMilli

    if (nextMonth > monthEpochMilli.length) {
      nextMonth = 1
      nextMonthEpochMilli = this.queryYear(year + 1).monthEpochMilli
    }

    return diffEpochMilliByDay(
      monthEpochMilli[month - 1],
      nextMonthEpochMilli[nextMonth - 1],
    )
  }

  queryDateStart(year: number, month: number = 1, day: number = 1): number {
    return this.queryYear(year).monthEpochMilli[month - 1] +
      (day - 1) * milliInDay
  }

  queryMonthStrs(year: number): string[] {
    return Object.keys(this.queryYear(year).monthStrToIndex)
  }
}

// IntlCalendarImpl - Prototype Trickery
// -------------------------------------------------------------------------------------------------

type EasyIntlMethodName = (keyof YearFieldsIntl) | 'day'

/*
era/eraYear/year/day
Fields that are easily-extractable from IntlFields (non-month fields)
*/
(
  [...intlYearFieldNames, 'day'] as EasyIntlMethodName[]
).forEach((dateFieldName) => {
  IntlCalendarImpl.prototype[dateFieldName] = function(
    this: IntlCalendarImpl,
    isoDateFields: IsoDateFields,
  ) {
    return this.isoDateFieldsToIntl(isoDateFields)[dateFieldName as EasyIntlMethodName]
  } as Callable
})

// CalendarImpl Querying
// -------------------------------------------------------------------------------------------------

const calendarImplClasses: {
  [calendarId: string]: { new(calendarId: string): CalendarImpl }
} = {
  [isoCalendarId]: CalendarImpl,
  [gregoryCalendarId]: GregoryCalendarImpl,
  [japaneseCalendarId]: JapaneseCalendarImpl,
}

const queryCacheableCalendarImpl = createLazyGenerator((calendarId, CalendarImplClass) => {
  return new CalendarImplClass(calendarId)
})

export function queryCalendarImpl(calendarId: string): CalendarImpl {
  // TODO: fix double-call of ensureString
  calendarId = ensureString(calendarId).toLowerCase()

  const calendarIdBase = getCalendarIdBase(calendarId)
  const CalendarImplClass = calendarImplClasses[calendarIdBase]

  if (CalendarImplClass) {
    calendarId = calendarIdBase
  }

  return queryCacheableCalendarImpl(calendarId, CalendarImplClass || IntlCalendarImpl)
}

// IntlFields Querying
// -------------------------------------------------------------------------------------------------

interface IntlFields {
  era: string | undefined
  eraYear: number | undefined
  year: number
  month: string
  day: number
}

function createIntlFieldCache(
  epochMilliToIntlFields: (epochMilli: number) => IntlFields,
) {
  return createLazyGenerator((isoDateFields: IsoDateFields) => {
    const epochMilli = isoToEpochMilli(isoDateFields)!
    return epochMilliToIntlFields(epochMilli)
  }, WeakMap)
}

function createJapaneseFieldCache(): (
  (isoDateFields: IsoDateFields) => IntlFields
) {
  const epochMilliToIntlFields = createEpochMilliToIntlFields(japaneseCalendarId)
  const primaryEraMilli = isoArgsToEpochMilli(1868, 9, 8)!

  return createLazyGenerator((isoDateFields: IsoDateFields) => {
    const epochMilli = isoToEpochMilli(isoDateFields)!
    const intlFields = epochMilliToIntlFields(epochMilli)

    if (epochMilli < primaryEraMilli) {
      intlFields.era = computeGregoryEra(isoDateFields.isoYear)
      intlFields.eraYear = computeGregoryEraYear(isoDateFields.isoYear)
    }

    return intlFields
  }, WeakMap)
}

function createEpochMilliToIntlFields(calendarId: string) {
  const intlFormat = buildIntlFormat(calendarId)

  if (!isCalendarIdsRelated(calendarId, intlFormat.resolvedOptions().calendar)) {
    throw new RangeError('Invalid calendar: ' + calendarId)
  }

  return (epochMilli: number) => {
    const intlPartsHash = hashIntlFormatParts(intlFormat, epochMilli)
    return parseIntlParts(intlPartsHash, calendarId)
  }
}

function parseIntlParts(
  intlPartsHash: Record<string, string>,
  calendarId: string,
): IntlFields {
  return {
    ...parseIntlYear(intlPartsHash, calendarId),
    month: intlPartsHash.month, // a short month string
    day: parseInt(intlPartsHash.day),
  }
}

// TODO: best place for this? Used by timeZoneImpl
export function parseIntlYear(
  intlPartsHash: Record<string, string>,
  calendarId: string,
): {
  era: string | undefined
  eraYear: number | undefined
  year: number
} {
  let year = parseInt(intlPartsHash.relatedYear || intlPartsHash.year)
  let era: string | undefined
  let eraYear: number | undefined

  if (intlPartsHash.era) {
    const eraOrigins = getEraOrigins(calendarId)
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
    timeZone: 'UTC',
    era: 'short', // 'narrow' is too terse for japanese months
    year: 'numeric',
    month: 'short', // easier to identify monthCodes
    day: 'numeric',
  })
}

// Intl Month Cache
// -------------------------------------------------------------------------------------------------

// TODO: rename to year 'info' (as opposed to year number?)
type YearQueryFunc = (year: number) => {
  monthEpochMilli: number[],
  monthStrToIndex: Record<string, number>
}

function createIntlMonthCache(
  epochMilliToIntlFields: (epochMilli: number) => IntlFields,
): [
  queryYear: YearQueryFunc,
  yearAtEpoch: number,
] {
  const yearAtEpoch = epochMilliToIntlFields(0).year
  const yearCorrection = yearAtEpoch - isoEpochOriginYear
  const queryYear = createLazyGenerator(buildYear)

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

  return [queryYear, yearAtEpoch]
}

// Era Utils
// -------------------------------------------------------------------------------------------------

function getEraOrigins(calendarId: string): Record<string, number> | undefined {
  return eraOriginsByCalendarId[getCalendarIdBase(calendarId)]
}

function eraYearToYear(eraYear: number, eraOrigin: number): number {
  // see the origin format in calendarConfig
  return (eraOrigin + eraYear) * (Math.sign(eraOrigin) || 1)
}

function normalizeShortEra(formattedEra: string): string {
  formattedEra = formattedEra
    .normalize('NFD') // 'Shōwa' -> 'Showa'
    .replace(/[^a-z0-9]/g, '') // 'Before R.O.C.' -> 'BeforeROC'
    .toLowerCase() // 'BeforeROC' -> 'beforeroc'

  return eraRemaps[formattedEra] || formattedEra
}

// Month Utils
// -------------------------------------------------------------------------------------------------

const monthCodeRegExp = /^M(\d{2})(L?)$/

function parseMonthCode(monthCode: string): [
  monthCodeNumber: number,
  isLeapMonth: boolean,
] {
  const m = monthCodeRegExp.exec(monthCode)
  if (!m) {
    throw new RangeError('Invalid monthCode format')
  }

  return [
    parseInt(m[1]), // monthCodeNumber
    Boolean(m[2]),
  ]
}

function refineMonthCodeNumber(
  monthCodeNumber: number,
  isLeapMonth: boolean,
  leapMonth: number | undefined,
): number {
  return monthCodeNumber + (
    (isLeapMonth || (leapMonth && monthCodeNumber >= leapMonth))
      ? 1
      : 0
  )
}

function formatMonthCode(month: number, leapMonth?: number): string {
  return 'M' + padNumber2(
    month - (
      (leapMonth && month >= leapMonth)
        ? 1
        : 0
    ),
  ) + ((month === leapMonth) ? 'L' : '')
}

// Calendar ID Utils
// -------------------------------------------------------------------------------------------------

function isCalendarIdsRelated(calendarId0: string, calendarId1: string): boolean {
  return getCalendarIdBase(calendarId0) === getCalendarIdBase(calendarId1)
}

function getCalendarIdBase(calendarId: string): string {
  return calendarId.split('-')[0]
}

// General Utils
// -------------------------------------------------------------------------------------------------

function removeIfAnyProps(
  targetObj: Record<string, unknown>,
  testObj: Record<string, unknown>,
  testPropNames: string[],
  deletablePropNames: string[] = testPropNames,
): void {
  for (const testPropName of testPropNames) {
    if (testObj[testPropName] !== undefined) {
      for (const deletablePropName of deletablePropNames) {
        delete targetObj[deletablePropName]
      }
      break
    }
  }
}
