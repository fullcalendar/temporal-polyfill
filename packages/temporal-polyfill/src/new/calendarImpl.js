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
import { computeIntlMonthsInYearSpan, computeIsoMonthsInYearSpan, diffYearMonthDay } from './diff'
import { durationFieldDefaults } from './durationFields'
import { IntlDateTimeFormat, hashIntlFormatParts, standardCalendarId } from './intlFormat'
import { isoDateFieldNames, isoTimeFieldDefaults } from './isoFields'
import {
  addDaysMilli,
  computeIsoDayOfWeek,
  computeIsoDaysInMonth,
  computeIsoDaysInYear,
  computeIsoIsLeapYear,
  computeIsoMonthsInYear,
  computeIsoWeekOfYear,
  computeIsoYearOfWeek,
  diffDaysMilli,
  epochMilliToIsoFields,
  isoDaysInWeek,
  isoEpochFirstLeapYear,
  isoEpochOriginYear,
  isoFieldsToEpochMilli,
  isoToEpochMilli,
} from './isoMath'
import { addIntlMonths, addIsoMonths } from './move'
import { constrainInt } from './options'
import { buildWeakMapCache, twoDigit } from './util'

// Base ISO Calendar
// -------------------------------------------------------------------------------------------------

class IsoCalendarImpl {
  constructor(id) {
    this.id = id
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
    const year = this.readYear(fields)
    const month = this.refineMonth(fields, year, overflow)
    const day = this.refineDay(fields, month, year, overflow)
    return this.queryIsoFields(year, month, day)
  }

  yearMonthFromFields(fields, overflow) {
    const year = this.readYear(fields)
    const month = this.refineMonth(fields, year, overflow)
    return this.queryIsoFields(year, month)
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
      year = this.readYear(fields)
      month = this.refineMonth(fields, year, overflow)
    }

    return this.queryIsoFields(year, month, day)
  }

  fields(fieldNames) {
    if (getAllowErasInFields(this) && fieldNames.indexOf('year') !== -1) {
      return fieldNames.concat(eraYearFieldNames)
    }

    return fieldNames
  }

  mergeFields(baseFields, additionalFields) {
    const merged = Object.assign({}, baseFields)

    removePropSet(merged, additionalFields, monthFieldNames)

    if (getAllowErasInFields(this)) {
      removePropSet(merged, additionalFields, allYearFieldNames)
    }

    if (getErasBeginMidYear(this)) {
      removePropSet(
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
    return { isoYear: year, isoMonth: month, isoDay: day }
  }

  queryDateStart(year, month, day) {
    return isoToEpochMilli(year, month, day)
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
    const dayEpochMilliseconds = isoFieldsToEpochMilli({
      ...isoDateFields,
      ...isoTimeFieldDefaults,
    })
    const yearStartEpochMilliseconds = this.queryDateStart(this.year(isoDateFields))
    return diffDaysMilli(yearStartEpochMilliseconds, dayEpochMilliseconds)
  }

  dateAdd(isoDateFields, durationFields, overflow) {
    // TODO: move all of this into move.js file?

    const { years, months, weeks, days } = durationFields
    let ms

    if (years || months) {
      let [year, month, day] = this.queryYearMonthDay(isoDateFields)

      if (years) {
        year += years
        month = constrainInt(month, 1, this.queryMonthsInYear(year), overflow)
      }

      if (months) {
        ([year, month] = this.addMonths(year, month, months))
        day = constrainInt(day, 1, this.queryDaysInMonth(year, month), overflow)
      }

      ms = this.queryDateStart(year, months, day)
    } else if (weeks || days) {
      ms = isoFieldsToEpochMilli(isoDateFields)
    } else {
      return isoDateFields
    }

    ms = addDaysMilli(ms, weeks * isoDaysInWeek + days)
    return epochMilliToIsoFields(ms)
  }

  dateUntil(startIsoDateFields, endIsoDateFields, largestUnit) {
    // TODO: move all of this into diff.js file?

    if (largestUnit <= 'week') { // TODO
      let weeks = 0
      let days = diffDaysMilli(
        isoFieldsToEpochMilli(startIsoDateFields),
        isoFieldsToEpochMilli(endIsoDateFields),
      )
      const sign = Math.sign(days)

      if (largestUnit === 'day') { // TODO
        weeks = Math.trunc(days / isoDaysInWeek)
        days %= isoDaysInWeek
      }

      return { ...durationFieldDefaults, weeks, days, sign }
    }

    const yearMonthDayStart = this.queryYearMonthDay(startIsoDateFields)
    const yearMonthDayEnd = this.queryYearMonthDay(endIsoDateFields)
    let [years, months, days, sign] = diffYearMonthDay(
      ...yearMonthDayStart,
      ...yearMonthDayEnd,
      this,
    )

    if (largestUnit === 'month') { // TODO
      months = this.queryMonthsInYearSpan(yearMonthDayStart[0], years)
      years = 0
    }

    return { ...durationFieldDefaults, years, months, days, sign }

    // TODO: only return DateDurationFields
  }

  // Field "Refining" (Reading & Constraining)
  // -----------------------------------------

  refineMonth(fields, year, overflow) {
    return constrainInt(
      this.readMonth(fields, year, overflow),
      1,
      this.queryMonthsInYear(year),
      overflow,
    )
  }

  refineDay(fields, month, year, overflow) {
    return constrainInt(
      fields.day, // day guaranteed to exist because of required*Fields
      1,
      this.queryDaysInMonth(year, month),
      overflow,
    )
  }

  // Field Reading
  // -------------

  readYear(fields) {
    let { era, eraYear, year } = fields

    if (getAllowErasInFields(this) && era !== undefined && eraYear !== undefined) {
      const yearByEra = this.readYearByEra(era, eraYear)

      if (year !== undefined && year !== yearByEra) {
        throw new RangeError('The year and era/eraYear must agree')
      }

      year = yearByEra
    } else if (year === undefined) {
      // Will never reach this point for ISO calendar system b/c of required*Fields
      // TODO: is this true for monthday parsing?
      throw new RangeError('Must specify year or era/eraYear')
    }

    return year
  }

  readYearByEra(era, eraYear) {
    const eraOrigins = getEraOrigins(this.id)
    if (eraOrigins === undefined) {
      throw new RangeError('Does not accept era/eraYear')
    }

    const eraOrigin = eraOrigins[era]
    if (eraOrigin === undefined) {
      throw new RangeError('Unknown era')
    }

    return eraYearToYear(eraYear, eraOrigin)
  }

  readMonth(
    fields,
    year, // optional if known that calendar doesn't support leap months
    overflowForLeap = 'reject',
  ) {
    let { month, monthCode } = fields

    if (monthCode !== undefined) {
      const monthByCode = this.readMonthByCode(monthCode, year, overflowForLeap)

      if (month !== undefined && month !== monthByCode) {
        throw new RangeError('The month and monthCode do not agree')
      }

      month = monthByCode
    } else if (month === undefined) {
      throw new RangeError('Must specify either month or monthCode')
    }

    return month
  }

  readMonthByCode(
    monthCode,
    year, // optional if known that calendar doesn't support leap months
    overflowForLeap = 'reject',
  ) {
    const leapMonth = this.queryLeapMonth(year)
    const [monthCodeNumber, isLeapMonth] = parseMonthCode(monthCode)
    const month = refineMonthCodeNumber(monthCodeNumber, isLeapMonth, leapMonth)

    if (isLeapMonth) {
      const leapYearMeta = leapYearMetas[getCalendarIdBase(this.id)]
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

      if (overflowForLeap === 'reject' && month !== leapMonth) {
        throw new RangeError('Invalid leap-month month code')
      }
    }

    return month
  }
}

// Prototype Trickery
// ------------------

const isoYearQueryMethods = {
  // sorted alphabetically, for predictable macros
  queryDaysInYear: computeIsoDaysInYear,
  queryIsLeapYear: computeIsoIsLeapYear,
  queryMonthsInYear: computeIsoMonthsInYear,
  queryMonthsInYearSpan: computeIsoMonthsInYearSpan,
}

Object.assign(IsoCalendarImpl.prototype, {
  dayOfWeek: computeIsoDayOfWeek,
  weekOfYear: computeIsoWeekOfYear,
  yearOfWeek: computeIsoYearOfWeek,
  addMonths: addIsoMonths,
  queryDaysInMonth: computeIsoDaysInMonth,
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

    const epochMillisecondsToIntlFields = createEpochMillisecondsToIntlFields(id)
    const [queryYear, yearAtEpoch] = createIntlMonthCache(epochMillisecondsToIntlFields)

    this.isoDateFieldsToIntl = createIntlFieldCache(epochMillisecondsToIntlFields)
    this.queryYear = queryYear
    this.yearAtEpoch = yearAtEpoch
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
    return addIntlMonths(year, month, monthDelta, this)
  }

  // Internal Querying
  // -----------------

  queryIsoFields(year, month, day) {
    return epochMilliToIsoFields(this.queryDateStart(year, month, day))
  }

  queryDaysInYear(year) {
    const milli = this.queryDateStart(year)
    const milliNext = this.queryDateStart(year + 1)
    return diffDaysMilli(milli, milliNext)
  }

  queryIsLeapYear(year) {
    const daysPrev = this.queryDaysInYear(year - 1)
    const days = this.queryDaysInYear(year)
    const daysNext = this.queryDaysInYear(year + 1)
    return days > daysPrev && days > daysNext
  }

  queryYearMonthDay(isoDateFields) {
    const intlFields = this.isoDateFieldsToIntl(isoDateFields)
    const { year } = intlFields
    const { monthStrToNum } = this.queryYear(year)
    const month = monthStrToNum[intlFields.month]
    return [year, month, intlFields.day]
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
    const { monthEpochMilliseconds } = this.queryYear(year)
    return monthEpochMilliseconds.length
  }

  queryMonthsInYearSpan(yearStart, yearDelta) {
    return computeIntlMonthsInYearSpan(yearStart, yearDelta, this)
  }

  queryDaysInMonth(year, month) {
    const { monthEpochMilliseconds } = this.queryYear(year)
    let nextMonth = month + 1
    let nextMonthEpochMilliseconds = monthEpochMilliseconds

    if (nextMonth > monthEpochMilliseconds.length) {
      nextMonth = 1
      nextMonthEpochMilliseconds = this.queryYear(year + 1).monthEpochMilliseconds
    }

    return diffDaysMilli(
      monthEpochMilliseconds[month - 1],
      nextMonthEpochMilliseconds[nextMonth - 1],
    )
  }

  queryDateStart(year, month = 1, day = 1) {
    return addDaysMilli(
      this.queryYear(year).monthEpochMilliseconds[month - 1],
      day - 1,
    )
  }

  queryMonthStrs(year) {
    return Object.keys(this.queryYear(year).monthStrToNum)
  }
}

// Prototype Trickery
// ------------------

// era/eraYear/year/day
allYearFieldNames.concat('day').forEach((dateFieldName) => {
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

const calendarImplCache = {}

export function queryCalendarImpl(calendarId) {
  const calendarIdBase = getCalendarIdBase(calendarId)
  const CalendarImplClass = calendarImplClasses[calendarIdBase]

  if (CalendarImplClass) {
    calendarId = calendarIdBase
  }

  return calendarImplCache[calendarId] || (
    calendarImplCache[calendarId] = new (CalendarImplClass || IntlCalendarImpl)(calendarId)
  )
}

// IntlFields Querying
// -------------------------------------------------------------------------------------------------

function createIntlFieldCache(epochMillisecondsToIntlFields) {
  return buildWeakMapCache((isoDateFields) => {
    const epochMilliseconds = isoFieldsToEpochMilli(isoDateFields)
    return epochMillisecondsToIntlFields(epochMilliseconds)
  })
}

function createJapaneseFieldCache() {
  const epochMillisecondsToIntlFields = createEpochMillisecondsToIntlFields(japaneseCalendarId)
  const primaryEraMilli = isoToEpochMilli(1868, 9, 8)

  return buildWeakMapCache((isoDateFields) => {
    const epochMilliseconds = isoFieldsToEpochMilli(isoDateFields)
    const intlFields = epochMillisecondsToIntlFields(epochMilliseconds)

    if (epochMilliseconds < primaryEraMilli) {
      intlFields.era = computeGregoryEra(isoDateFields.isoYear)
      intlFields.eraYear = computeGregoryEraYear(isoDateFields.isoYear)
    }

    return intlFields
  })
}

function createEpochMillisecondsToIntlFields(calendarId) {
  const intlFormat = buildIntlFormat(calendarId)

  if (!isCalendarIdsRelated(calendarId, intlFormat.resolvedOptions().calendar)) {
    throw new RangeError('Invalid calendar: ' + calendarId)
  }

  return (epochMilliseconds) => {
    const intlParts = hashIntlFormatParts(intlFormat, epochMilliseconds)
    return parseIntlParts(intlParts, calendarId)
  }
}

function parseIntlParts(intlParts, calendarId) {
  return {
    ...parseIntlYear(intlParts, calendarId),
    month: intlParts.month, // a short month string!
    day: parseInt(intlParts.day),
  }
}

// best place for this?
export function parseIntlYear(intlParts, calendarId) {
  let year = parseInt(intlParts.relatedYear || intlParts.year)
  let era
  let eraYear

  if (intlParts.era) {
    const eraOrigins = getEraOrigins(calendarId)
    if (eraOrigins !== undefined) {
      era = normalizeShortEra(intlParts.era)
      year = eraYearToYear(eraYear = year, eraOrigins[era] || 0)
    }
  }

  return { era, eraYear, year }
}

// DateTimeFormat Utils
// -------------------------------------------------------------------------------------------------

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

function createIntlMonthCache(epochMillisecondsToIntlFields) {
  const yearAtEpoch = epochMillisecondsToIntlFields(0)
  const yearCorrection = yearAtEpoch - isoEpochOriginYear
  const yearCache = {}

  function queryYear(year) {
    return yearCache[year] || ( // TODO: reusable pattern for this?
      yearCache[year] = buildYear(year)
    )
  }

  function buildYear(year) {
    let ms = isoToEpochMilli(year - yearCorrection)
    let intlFields
    const msReversed = []
    const monthStrsReversed = []

    // move beyond current year
    do {
      ms = addDaysMilli(ms, 400)
    } while ((intlFields = epochMillisecondsToIntlFields(ms)).year <= year)

    do {
      // move to start-of-month
      ms = addDaysMilli(ms, 1 - intlFields.day)

      // only record the epochMilli if current year
      if (intlFields.year === year) {
        msReversed.push(ms)
        monthStrsReversed.push(intlFields.month)
      }

      // move to last day of previous month
      ms = addDaysMilli(ms, -1)
    } while ((intlFields = epochMillisecondsToIntlFields(ms)).year >= year)

    return {
      monthEpochMilliseconds: msReversed.reverse(),
      monthStrToNum: monthStrsReversed.reverse().reduce(accumMonthStrToNum, {}),
    }
  }

  return [queryYear, yearAtEpoch]
}

function accumMonthStrToNum(accum, monthStr, index) {
  accum[monthStr] = index + 1
  return accum
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

function parseMonthCode(monthCode) {
  const m = monthCode.match(/^M(\d{2})(L?)$/)
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
    (isLeapMonth || (leapMonth && monthCodeNumber >= leapMonth)) // TODO: double check this
      ? 1
      : 0
  )
}

function formatMonthCode(month, leapMonth) {
  return 'M' + twoDigit(
    month - (
      (leapMonth && month >= leapMonth) // TODO: double check this
        ? 1
        : 0
    ),
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

function removePropSet(
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
