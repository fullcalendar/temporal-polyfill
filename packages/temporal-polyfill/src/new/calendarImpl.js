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
  allYearFieldNames,
  dateBasicNames,
  eraYearFieldNames,
  monthDayFieldNames,
  monthFieldNames,
  yearStatNames,
} from './calendarFields'
import {
  computeIntlMonthsInYearSpan,
  computeIsoMonthsInYearSpan,
  diffDatesExact,
  diffEpochMilliByDay,
} from './diff'
import { IntlDateTimeFormat, hashIntlFormatParts, standardCalendarId } from './intlFormat'
import { isoDateFieldNames, isoTimeFieldDefaults } from './isoFields'
import {
  computeIsoDayOfWeek,
  computeIsoDaysInMonth,
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
import { rejectI } from './options'
import { milliInDay } from './units'
import { clamp, createLazyGenerator, mapPropNamesToIndex, padNumber } from './utils'

// Base ISO Calendar
// -------------------------------------------------------------------------------------------------

class IsoCalendarImpl {
  constructor(id) {
    this.id = id
  }

  year(isoDateFields) {
    return isoDateFields.isoYear
  }

  month(isoDateFields) {
    return isoDateFields.isoMonth
  }

  day(isoDateFields) {
    return isoDateFields.isoDay
  }

  era(isoDateFields) {
    // undefined
  }

  eraYear(isoDateFields) {
    // undefined
  }

  monthCode(isoDateFields) {
    return formatMonthCode(isoDateFields.isoMonth)
  }

  daysInMonth(isoDateFields) {
    return this.queryDaysInMonth(...this.queryYearMonthDay(isoDateFields))
  }

  dateFromFields(fields, overflow) {
    const year = this.refineYear(fields)
    const month = this.refineMonth(fields, year, overflow)
    const day = this.refineDay(fields, month, year, overflow)
    return this.queryIsoFields(year, month, day)
  }

  yearMonthFromFields(fields, overflow) {
    const year = this.refineYear(fields)
    const month = this.refineMonth(fields, year, overflow)
    return this.queryIsoFields(year, month, 1)
  }

  monthDayFromFields(fields, overflow) {
    let { month, monthCode, day } = fields
    let year

    if (monthCode !== undefined) {
      // year is guessed
      const [monthCodeNumber, isLeapMonth] = parseMonthCode(monthCode)
      ;([year, month] = this.queryYearMonthForMonthDay(monthCodeNumber, isLeapMonth, day))
    } else {
      // year is required
      year = this.refineYear(fields)
      month = this.refineMonth(fields, year, overflow)
    }

    return this.queryIsoFields(year, month, day)
  }

  fields(fieldNames) {
    if (getAllowErasInFields(this) && fieldNames.includes('year')) {
      return [...fieldNames, ...eraYearFieldNames]
    }

    return fieldNames
  }

  mergeFields(baseFields, additionalFields) {
    const merged = { ...baseFields }

    removeIfAnyProps(merged, additionalFields, monthFieldNames)

    if (getAllowErasInFields(this)) {
      removeIfAnyProps(merged, additionalFields, allYearFieldNames)
    }

    if (getErasBeginMidYear(this)) {
      removeIfAnyProps(
        merged,
        additionalFields,
        monthDayFieldNames,
        eraYearFieldNames,
      )
    }

    return Object.assign(merged, additionalFields)
  }

  // Internal Querying
  // -----------------

  queryIsoFields(year, month, day) {
    return {
      calendar: this,
      isoYear: year,
      isoMonth: month,
      isoDay: day,
    }
  }

  queryYearMonthDay(isoDateFields) {
    return [isoDateFields.isoYear, isoDateFields.isoMonth, isoDateFields.isoDay]
  }

  queryYearMonthForMonthDay(monthCodeNumber /*, isLeapMonth, day */) {
    return [isoEpochFirstLeapYear, monthCodeNumber]
  }

  queryLeapMonth(year) {
    // undefined
  }

  // Algorithmic Computations
  // ------------------------

  dayOfYear(isoDateFields) {
    const dayEpochMilli = isoToEpochMilli({
      ...isoDateFields,
      ...isoTimeFieldDefaults,
    })
    const yearStartEpochMilli = this.queryDateStart(this.year(isoDateFields))
    return diffEpochMilliByDay(yearStartEpochMilli, dayEpochMilli)
  }

  dateAdd(isoDateFields, durationFields, overflow) {
    return moveDate(this, isoDateFields, durationFields, overflow)
  }

  dateUntil(startIsoDateFields, endIsoDateFields, largestUnitIndex) {
    return diffDatesExact(this, startIsoDateFields, endIsoDateFields, largestUnitIndex)
  }

  // Field Refining
  // --------------

  refineYear(fields) {
    let { era, eraYear, year } = fields
    const allowEras = getAllowErasInFields(this)

    if (allowEras && era !== undefined && eraYear !== undefined) {
      const yearByEra = refineEraYear(this, era, eraYear)

      if (year !== undefined && year !== yearByEra) {
        throw new RangeError('The year and era/eraYear must agree')
      }

      year = yearByEra
    } else if (year === undefined) {
      throw new RangeError('Must specify year' + (allowEras ? ' or era/eraYear' : ''))
    }

    return year
  }

  refineMonth(
    fields,
    year, // optional if known that calendar doesn't support leap months
    overflowI = rejectI,
  ) {
    let { month, monthCode } = fields

    if (monthCode !== undefined) {
      const monthByCode = refineMonthCode(this, monthCode, year, overflowI)

      if (month !== undefined && month !== monthByCode) {
        throw new RangeError('The month and monthCode do not agree')
      }

      month = monthByCode
    } else if (month === undefined) {
      throw new RangeError('Must specify either month or monthCode')
    }

    return clamp(
      this.readMonth(fields, year, overflowI),
      1,
      this.queryMonthsInYear(year),
      overflowI,
      'month',
    )
  }

  refineDay(fields, month, year, overflowI) {
    return clamp(
      fields.day, // day guaranteed to exist because of required*Fields
      1,
      this.queryDaysInMonth(year, month),
      overflowI,
      'day',
    )
  }
}

// Refining Utils
// --------------

function refineEraYear(calendar, era, eraYear) {
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
  calendar,
  monthCode,
  year, // optional if known that calendar doesn't support leap months
  overflow = 'reject',
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

    if (overflow === 'reject' && month !== leapMonth) {
      throw new RangeError('Invalid leap-month month code')
    }
  }

  return month
}

// Prototype Trickery
// ------------------

const isoYearQueryMethods = {
  // sorted alphabetically, for predictable macros
  queryDaysInYear: computeIsoDaysInYear,
  queryIsLeapYear: computeIsoIsLeapYear,
  queryMonthsInYear: computeIsoMonthsInYear,
}

Object.assign(IsoCalendarImpl.prototype, {
  dayOfWeek: computeIsoDayOfWeek,
  weekOfYear: computeIsoWeekOfYear,
  yearOfWeek: computeIsoYearOfWeek,
  addMonths: moveByIsoMonths,
  queryDateStart: isoArgsToEpochMilli,
  queryDaysInMonth: computeIsoDaysInMonth,
  queryMonthsInYearSpan: computeIsoMonthsInYearSpan,
  ...isoYearQueryMethods,
})

// year/month/day
dateBasicNames.forEach((dateFieldName, i) => {
  IsoCalendarImpl.prototype[dateFieldName] = function(isoDateFields) {
    return isoDateFields[isoDateFieldNames[i]]
  }
})

// daysInYear/inLeapYear/monthsInYear
Object.keys(isoYearQueryMethods).forEach((queryMethodName, i) => {
  IsoCalendarImpl.prototype[yearStatNames[i]] = function(isoDateFields) {
    return this[queryMethodName](this.year(isoDateFields))
  }
})

// Gregory Calendar
// -------------------------------------------------------------------------------------------------

class GregoryCalendarImpl extends IsoCalendarImpl {
  era(isoDateFields) {
    return computeGregoryEra(isoDateFields.isoYear)
  }

  eraYear(isoDateFields) {
    return computeGregoryEraYear(isoDateFields.isoYear)
  }
}

function computeGregoryEra(isoYear) {
  return isoYear < 1 ? 'bce' : 'ce'
}

function computeGregoryEraYear(isoYear) {
  return isoYear < 1 ? -(isoYear - 1) : isoYear
}

// Japanese Calendar
// -------------------------------------------------------------------------------------------------

class JapaneseCalendarImpl extends GregoryCalendarImpl {
  isoDateFieldsToIntl = createJapaneseFieldCache()

  era(isoDateFields) {
    return this.isoDateFieldsToIntl(isoDateFields).era
  }

  eraYear(isoDateFields) {
    return this.isoDateFieldsToIntl(isoDateFields).eraYear
  }
}

// Intl Calendar
// -------------------------------------------------------------------------------------------------

class IntlCalendarImpl extends IsoCalendarImpl {
  constructor(id) {
    super(id)

    const epochMilliToIntlFields = createEpochMilliToIntlFields(id)
    const [queryYear, yearAtEpoch] = createIntlMonthCache(epochMilliToIntlFields)

    this.isoDateFieldsToIntl = createIntlFieldCache(epochMilliToIntlFields)
    this.queryYear = queryYear
    this.yearAtEpoch = yearAtEpoch
  }

  year(isoDateFields) {
    return this.queryYearMonthDay(isoDateFields)[0]
  }

  month(isoDateFields) {
    return this.queryYearMonthDay(isoDateFields)[1]
  }

  monthCode(isoDateFields) {
    const [year, month] = this.queryYearMonthDay(isoDateFields)
    const leapMonth = this.queryLeapMonth(year)
    return formatMonthCode(month, leapMonth)
  }

  addMonths(year, month, monthDelta) {
    return moveByIntlMonths(year, month, monthDelta, this)
  }

  // Internal Querying
  // -----------------

  queryIsoFields(year, month, day) {
    return {
      calendar: this,
      ...epochMilliToIso(this.queryDateStart(year, month, day)),
    }
  }

  queryDaysInYear(year) {
    const milli = this.queryDateStart(year)
    const milliNext = this.queryDateStart(year + 1)
    return diffEpochMilliByDay(milli, milliNext)
  }

  queryIsLeapYear(year) {
    const days = this.queryDaysInYear(year)
    return days > this.queryDaysInYear(year - 1) &&
      days > this.queryDaysInYear(year + 1)
  }

  queryYearMonthDay(isoDateFields) {
    const intlFields = this.isoDateFieldsToIntl(isoDateFields)
    const { year, month, day } = intlFields
    const { monthStrToIndex } = this.queryYear(year)
    return [year, monthStrToIndex[month] + 1, day]
  }

  queryYearMonthForMonthDay(monthCodeNumber, isLeapMonth, day) {
    let year = this.yearAtEpoch
    const endYear = year + 100

    for (; year < endYear; year++) {
      const leapMonth = this.queryLeapMonth(year)
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

  queryLeapMonth(year) {
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

  queryMonthsInYear(year) {
    const { monthEpochMilli } = this.queryYear(year)
    return monthEpochMilli.length
  }

  queryMonthsInYearSpan(yearDelta, yearStart) {
    return computeIntlMonthsInYearSpan(yearDelta, yearStart, this)
  }

  queryDaysInMonth(year, month) {
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

  queryDateStart(year, month = 1, day = 1) {
    return this.queryYear(year).monthEpochMilli[month - 1] +
      (day - 1) * milliInDay
  }

  queryMonthStrs(year) {
    return Object.keys(this.queryYear(year).monthStrToIndex)
  }
}

// Prototype Trickery
// ------------------

// era/eraYear/year/day
[...allYearFieldNames, 'day'].forEach((dateFieldName) => {
  IntlCalendarImpl.prototype[dateFieldName] = function(isoDateFields) {
    return this.isoDateFieldsToIntl(isoDateFields)[dateFieldName]
  }
})

// CalendarImpl Querying
// -------------------------------------------------------------------------------------------------

const calendarImplClasses = {
  [isoCalendarId]: IsoCalendarImpl,
  [gregoryCalendarId]: GregoryCalendarImpl,
  [japaneseCalendarId]: JapaneseCalendarImpl,
}

const queryCalendarImplWithClass = createLazyGenerator((calendarId, CalendarImplClass) => {
  return new CalendarImplClass(calendarId)
})

export function queryCalendarImpl(calendarId) {
  const calendarIdBase = getCalendarIdBase(calendarId)
  const CalendarImplClass = calendarImplClasses[calendarIdBase]

  if (CalendarImplClass) {
    calendarId = calendarIdBase
  }

  return queryCalendarImplWithClass(calendarId, CalendarImplClass || IntlCalendarImpl)
}

// IntlFields Querying
// -------------------------------------------------------------------------------------------------

/*
interface IntlFields {
  era: string
  eraYear: number
  year: number
  month: string
  day: number
}
*/

function createIntlFieldCache(epochMilliToIntlFields) {
  return createLazyGenerator((isoDateFields) => {
    const epochMilli = isoToEpochMilli(isoDateFields)
    return epochMilliToIntlFields(epochMilli)
  }, WeakMap)
}

function createJapaneseFieldCache() {
  const epochMilliToIntlFields = createEpochMilliToIntlFields(japaneseCalendarId)
  const primaryEraMilli = isoArgsToEpochMilli(1868, 9, 8)

  return createLazyGenerator((isoDateFields) => {
    const epochMilli = isoToEpochMilli(isoDateFields)
    const intlFields = epochMilliToIntlFields(epochMilli)

    if (epochMilli < primaryEraMilli) {
      intlFields.era = computeGregoryEra(isoDateFields.isoYear)
      intlFields.eraYear = computeGregoryEraYear(isoDateFields.isoYear)
    }

    return intlFields
  }, WeakMap)
}

function createEpochMilliToIntlFields(calendarId) {
  const intlFormat = buildIntlFormat(calendarId)

  if (!isCalendarIdsRelated(calendarId, intlFormat.resolvedOptions().calendar)) {
    throw new RangeError('Invalid calendar: ' + calendarId)
  }

  return (epochMilli) => {
    const intlParts = hashIntlFormatParts(intlFormat, epochMilli)
    return parseIntlParts(intlParts, calendarId)
  }
}

function parseIntlParts(intlParts, calendarId) {
  return {
    ...parseIntlYear(intlParts, calendarId),
    month: intlParts.month, // a short month string
    day: parseInt(intlParts.day),
  }
}

export function parseIntlYear(intlParts, calendarId) {
  let year = parseInt(intlParts.relatedYear || intlParts.year)
  let era
  let eraYear

  if (intlParts.era) {
    const eraOrigins = getEraOrigins(calendarId)
    if (eraOrigins !== undefined) {
      era = normalizeShortEra(intlParts.era)
      eraYear = year // TODO: will this get optimized to next line?
      year = eraYearToYear(eraYear, eraOrigins[era] || 0)
    }
  }

  return { era, eraYear, year }
}

function buildIntlFormat(calendarId) {
  return new IntlDateTimeFormat(standardCalendarId, {
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

function createIntlMonthCache(epochMilliToIntlFields) {
  const yearAtEpoch = epochMilliToIntlFields(0).year
  const yearCorrection = yearAtEpoch - isoEpochOriginYear
  const queryYear = createLazyGenerator(buildYear)

  function buildYear(year) {
    let epochMilli = isoArgsToEpochMilli(year - yearCorrection)
    let intlFields
    const milliReversed = []
    const monthStrsReversed = []

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

function getEraOrigins(calendarId) {
  return eraOriginsByCalendarId[getCalendarIdBase(calendarId)]
}

function eraYearToYear(eraYear, eraOrigin) {
  // see the origin format in calendarConfig
  return (eraOrigin + eraYear) * (Math.sign(eraOrigin) || 1)
}

function normalizeShortEra(formattedEra) {
  formattedEra = formattedEra
    .normalize('NFD') // 'Shōwa' -> 'Showa'
    .replace(/[^a-z0-9]/g, '') // 'Before R.O.C.' -> 'BeforeROC'
    .toLowerCase() // 'BeforeROC' -> 'beforeroc'

  return eraRemaps[formattedEra] || formattedEra
}

// Month Utils
// -------------------------------------------------------------------------------------------------

const monthCodeRegExp = /^M(\d{2})(L?)$/

function parseMonthCode(monthCode) {
  const m = monthCodeRegExp.exec(monthCode)
  if (!m) {
    throw new RangeError('Invalid monthCode format')
  }

  return [
    parseInt(m[1]), // monthCodeNumber
    Boolean(m[2]),
  ]
}

function refineMonthCodeNumber(monthCodeNumber, isLeapMonth, leapMonth) {
  return monthCodeNumber + (
    (isLeapMonth || (leapMonth && monthCodeNumber >= leapMonth))
      ? 1
      : 0
  )
}

function formatMonthCode(month, leapMonth) {
  return 'M' + padNumber(
    month - (
      (leapMonth && month >= leapMonth)
        ? 1
        : 0
    ),
    2,
  ) + ((month === leapMonth) ? 'L' : '')
}

// Calendar ID Utils
// -------------------------------------------------------------------------------------------------

function isCalendarIdsRelated(calendarId0, calendarId1) {
  return getCalendarIdBase(calendarId0) === getCalendarIdBase(calendarId1)
}

function getCalendarIdBase(calendarId) {
  return calendarId.split('-')[0]
}

// General Utils
// -------------------------------------------------------------------------------------------------

function removeIfAnyProps(
  targetObj,
  testObj,
  testPropNames,
  deletablePropNames = testPropNames,
) {
  for (const testPropName of testPropNames) {
    if (testObj[testPropName] !== undefined) {
      for (const deletablePropName of deletablePropNames) {
        delete targetObj[deletablePropName]
      }
      break
    }
  }
}
