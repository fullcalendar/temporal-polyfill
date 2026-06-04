import { eraYearToYear } from '../../internal/calendarFields'
import {
  type MonthCodeParts,
  monthCodeNumberToMonth,
  monthToMonthCodeNumber,
} from '../../internal/calendarMonthCode'
import { type ExoticCalendar } from '../../internal/calendarSlot'
import {
  diffEpochMilliDays,
  epochMilliToIsoDateTime,
  isoArgsToEpochMilli,
  isoDateToEpochMilli,
} from '../../internal/epochMath'
import * as errorMessages from '../../internal/errorMessages'
import {
  type CalendarDateFields,
  type CalendarEraFields,
  type CalendarYearMonthFields,
} from '../../internal/fieldTypes'
import { normalizeEraName } from '../../internal/intlCalendarConfig'
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
import { milliInDay } from '../../internal/units'
import { compareNumbers, memoize } from '../../internal/utils'

interface IntlDateFields {
  era: string | undefined
  eraYear: number | undefined
  year: number
  month: number
  monthString: string
  day: number
}

export interface IntlYearDataForOverride {
  monthEpochMillis: number[]
  // Keep the ordered month labels exactly as Intl produced them. Some
  // calendars repeat the same label for common/leap months, so collapsing to a
  // string->index map loses the leap-month position entirely.
  monthStrings: string[]
}

interface IntlYearData extends IntlYearDataForOverride {}

type IntlYearDataCache = (year: number) => IntlYearData

export interface IntlCalendarOverrideConfig {
  eraOrigins?: Record<string, number>
  eraRemaps?: Record<string, string>
  defaultEra?: string
  leapMonthMeta?: number
  plainMonthDayLeapMonthMaxDays?: Record<number, number>
  plainMonthDayCommonMonthMaxDay?: number
  computeYearFromEra?(
    eraYear: number,
    normalizedEra: string,
    eraOrigin: number,
  ): number
  constrainPlainMonthDay?(
    monthCodeNumber: number,
    isLeapMonth: boolean,
    day: number,
  ): number | undefined
  getMonthDaySearchStartYear?(
    monthCodeNumber: number,
    isLeapMonth: boolean,
    day: number,
  ): number
  hasYearDataOverrideCandidate?(year: number): boolean
  applyYearDataOverrides?(
    year: number,
    scrapedYearData: IntlYearDataForOverride,
  ): IntlYearDataForOverride
  queryLeapMonthOverride?(year: number): number | undefined
}

export interface IntlCalendar extends ExoticCalendar {
  id: string
  overrideConfig: IntlCalendarOverrideConfig
  queryFields: (isoDate: CalendarDateFields) => IntlDateFields
  queryYearData: IntlYearDataCache
}

// -----------------------------------------------------------------------------

export function createIntlCalendarWithOverrides(
  normCalendarId: string,
  overrideConfig: IntlCalendarOverrideConfig,
): IntlCalendar {
  const intlFormat = queryCalendarIntlFormat(normCalendarId)

  function rawEpochMilliToIntlFields(epochMilli: number) {
    const intlParts = formatEpochMilliToPartsRecord(intlFormat, epochMilli)
    return parseIntlDateFields(intlParts, overrideConfig)
  }

  const queryYearData = createIntlYearDataCache(
    overrideConfig,
    rawEpochMilliToIntlFields,
  )

  function epochMilliToIntlFields(epochMilli: number) {
    return computeIntlFieldsFromCorrectedYearData(
      overrideConfig,
      queryYearData,
      epochMilli,
      rawEpochMilliToIntlFields(epochMilli),
    )
  }

  const calendar: IntlCalendar = {
    id: normCalendarId,
    overrideConfig,
    queryFields: createIntlFieldCache(epochMilliToIntlFields, queryYearData),
    queryYearData,
    eraOrigins: overrideConfig.eraOrigins,
    eraRemaps: overrideConfig.eraRemaps,
    leapMonthMeta: overrideConfig.leapMonthMeta,
    plainMonthDayLeapMonthMaxDays: overrideConfig.plainMonthDayLeapMonthMaxDays,
    plainMonthDayCommonMonthMaxDay:
      overrideConfig.plainMonthDayCommonMonthMaxDay,
    computeYearFromEra(eraYear, normalizedEra, eraOrigin) {
      return (
        overrideConfig.computeYearFromEra?.(
          eraYear,
          normalizedEra,
          eraOrigin,
        ) ?? eraYearToYear(eraYear, eraOrigin)
      )
    },
    constrainPlainMonthDay(monthCodeNumber, isLeapMonth, day) {
      return overrideConfig.constrainPlainMonthDay?.(
        monthCodeNumber,
        isLeapMonth,
        day,
      )
    },
    computeDateFields(isoDate) {
      return calendar.queryFields(isoDate)
    },
    computeIsoFieldsFromParts(year, month, day) {
      return computeIsoFieldsFromIntlParts(calendar, year, month, day)
    },
    computeEpochMilli(year, month, day) {
      return computeIntlEpochMilli(calendar, year, month, day)
    },
    computeMonthCodeParts(year, month) {
      return computeIntlMonthCodeParts(calendar, year, month)
    },
    computeYearMonthFieldsForMonthDay(monthCodeNumber, isLeapMonth, day) {
      return computeIntlYearMonthFieldsForMonthDay(
        calendar,
        monthCodeNumber,
        isLeapMonth,
        day,
      )
    },
    computeInLeapYear(year) {
      return computeIntlInLeapYear(calendar, year)
    },
    computeMonthsInYear(year) {
      return computeIntlMonthsInYear(calendar, year)
    },
    computeDaysInMonth(year, month) {
      return computeIntlDaysInMonth(calendar, year, month)
    },
    computeDaysInYear(year) {
      return computeIntlDaysInYear(calendar, year)
    },
    computeLeapMonth(year) {
      return computeIntlLeapMonth(calendar, year)
    },
    computeEraFields(isoDate) {
      return computeIntlEraFields(calendar, isoDate)
    },
    addMonths(year, month, monthDelta) {
      return addIntlMonths(calendar, year, month, monthDelta)
    },
    diffMonthSlots(year0, month0, year1, month1) {
      return diffIntlMonthSlots(calendar, year0, month0, year1, month1)
    },
    isConstrainedFinalIntercalaryMonthDiff(
      sign,
      year0,
      month0,
      day0,
      year1,
      month1,
      day1,
    ) {
      return isConstrainedFinalIntercalaryMonthDiff(
        calendar,
        sign,
        year0,
        month0,
        day0,
        year1,
        month1,
        day1,
      )
    },
  }

  return calendar
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
    const epochMilli = isoDateToEpochMilli(isoDateFields)!
    const intlFields = epochMilliToIntlFields(epochMilli)
    return {
      ...intlFields,
      month: computeIntlMonthIndex(queryYearData, intlFields.year, epochMilli),
    }
  }, WeakMap)
}

function createIntlYearDataCache(
  overrideConfig: IntlCalendarOverrideConfig,
  epochMilliToIntlFields: (epochMilli: number) => IntlDateFields,
): IntlYearDataCache {
  // Per-normalized-calendar cache, keyed only by numeric calendar year. This is
  // the expensive Intl-derived year-shape table used by both directions.
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

    const scrapedYearData = {
      monthEpochMillis: millisReversed.reverse(),
      monthStrings: monthStringsReversed.reverse(),
    }

    return correctIntlYearData(overrideConfig, year, scrapedYearData)
  }

  return memoize(buildYear)
}

// Corrected Year-Data Overrides
// -----------------------------------------------------------------------------
//
// Keep the host-Intl scrape as the default data source, but pass the scraped
// year data through a bounded override table before using it for both
// calendar->ISO construction and ISO->calendar field access.

function correctIntlYearData(
  overrideConfig: IntlCalendarOverrideConfig,
  year: number,
  scrapedYearData: IntlYearData,
): IntlYearData {
  // Keep Intl scraping as the first step for every calendar. Known corrections
  // are applied afterward so future host data can pass through unchanged when
  // it already matches the canonical shape.
  return (
    overrideConfig.applyYearDataOverrides?.(year, scrapedYearData) ??
    scrapedYearData
  )
}

// Override Detection
// -----------------------------------------------------------------------------
//
// A corrected year start changes both the starting year and the previous year's
// closing interval, so either side of the candidate interval can make field
// derivation necessary.

function hasCorrectedIntlYearInterval(
  overrideConfig: IntlCalendarOverrideConfig,
  year: number,
): boolean {
  return (
    overrideConfig.hasYearDataOverrideCandidate?.(year) ||
    overrideConfig.hasYearDataOverrideCandidate?.(year + 1) ||
    false
  )
}

// ISO -> Calendar Fields From Corrected Year Data
// -----------------------------------------------------------------------------

function computeIntlFieldsFromCorrectedYearData(
  overrideConfig: IntlCalendarOverrideConfig,
  queryYearData: IntlYearDataCache,
  epochMilli: number,
  rawIntlFields: IntlDateFields,
): IntlDateFields {
  // Raw formatToParts output is normally authoritative. For a corrected year
  // interval, derive Y/M/D from the same month-boundary table used for
  // construction so ISO->calendar and calendar->ISO stay coherent.
  const firstCandidateYear = rawIntlFields.year - 1

  // Raw Intl is still a good hint; corrected boundaries only move by one day in
  // the known data, so the containing corrected year must be the raw year or an
  // immediate neighbor.
  for (let yearMove = 0; yearMove < 3; yearMove++) {
    const year = firstCandidateYear + yearMove

    // Most years have no override table nearby. Skip those before querying
    // extra year data so the normal raw-Intl path stays cheap.
    if (!hasCorrectedIntlYearInterval(overrideConfig, year)) {
      continue
    }

    const yearData = queryYearData(year)
    const yearStart = yearData.monthEpochMillis[0]
    const nextYearStart = queryYearData(year + 1).monthEpochMillis[0]

    // Neighboring candidates can be checked even when they do not contain this
    // ISO date. Only the corrected interval that actually contains epochMilli
    // is allowed to replace raw formatToParts fields.
    if (yearStart <= epochMilli && epochMilli < nextYearStart) {
      const monthIndex = computeIntlYearDataMonthIndex(yearData, epochMilli)
      const monthStart = yearData.monthEpochMillis[monthIndex]

      return {
        ...computeCorrectedIntlYearParts(
          overrideConfig.defaultEra,
          year,
          rawIntlFields,
        ),
        month: monthIndex + 1,
        monthString: yearData.monthStrings[monthIndex],
        day: diffEpochMilliDays(monthStart, epochMilli) + 1,
      }
    }
  }

  return rawIntlFields
}

function computeCorrectedIntlYearParts(
  defaultEra: string | undefined,
  year: number,
  rawIntlFields: IntlDateFields,
): Pick<IntlDateFields, 'era' | 'eraYear' | 'year'> {
  // Month/day can come entirely from corrected year data, but era labels still
  // need to follow the normal Intl parsing path and calendar fallback rules.
  const era = rawIntlFields.era || defaultEra

  return {
    era,
    eraYear: era === undefined ? rawIntlFields.eraYear : year,
    year,
  }
}

function computeIntlYearDataMonthIndex(
  yearData: IntlYearData,
  epochMilli: number,
): number {
  const { monthEpochMillis } = yearData

  // Month tables are tiny. Walk backward because most lookups are ordinary
  // in-year dates, and the last matching boundary is the containing month.
  for (let i = monthEpochMillis.length - 1; i >= 0; i--) {
    if (epochMilli >= monthEpochMillis[i]) {
      return i
    }
  }

  throw new RangeError(errorMessages.invalidProtocolResults)
}

// DateTimeFormat Utils
// -----------------------------------------------------------------------------

function parseIntlDateFields(
  intlParts: Record<string, string>,
  overrideConfig: IntlCalendarOverrideConfig,
): IntlDateFields {
  return {
    ...parseIntlYear(intlParts, overrideConfig),
    month: 0,
    monthString: intlParts.month,
    day: parseInt(intlParts.day),
  }
}

export function parseIntlYear(
  intlParts: Record<string, string>,
  overrideConfig: IntlCalendarOverrideConfig,
): {
  era: string | undefined
  eraYear: number | undefined
  year: number
} {
  const rawYear = parseInt(intlParts.year)
  let year = parseInt(intlParts.relatedYear || intlParts.year)
  let era: string | undefined
  let eraYear: number | undefined
  const eraOrigins = overrideConfig.eraOrigins

  if (eraOrigins !== undefined) {
    const eraRemaps = overrideConfig.eraRemaps || {}
    const rawEra = intlParts.era && normalizeEraName(intlParts.era)
    const fallbackEra = overrideConfig.defaultEra
    const normalizedEra = rawEra
      ? eraRemaps[rawEra] || rawEra
      : fallbackEra && (eraRemaps[fallbackEra] || fallbackEra)

    if (normalizedEra !== undefined) {
      const eraOrigin = eraOrigins[normalizedEra]

      if (eraOrigin === undefined) {
        throw new RangeError(errorMessages.invalidProtocolResults)
      }

      era = normalizedEra
      eraYear = rawEra ? rawYear : year
      year = eraYearToYear(eraYear, eraOrigin)
    }
  }

  return { era, eraYear, year }
}

const calendarIntlFormatByNormId = new Map<string, Intl.DateTimeFormat>()

/**
 * Shared Intl.DateTimeFormat cache for calendar math and validation. Pass a
 * normalized ID after calendar resolution. During resolution, pass the
 * lowercased raw ID with validateNoFallback=true so invalid/fallback-only input
 * returns undefined instead of populating the normalized-ID cache.
 */
export function queryCalendarIntlFormat(
  normCalendarId: string,
): Intl.DateTimeFormat
export function queryCalendarIntlFormat(
  lowerRawCalendarId: string,
  validateNoFallback: true,
): Intl.DateTimeFormat | undefined
export function queryCalendarIntlFormat(
  calendarId: string,
  validateNoFallback = false,
): Intl.DateTimeFormat | undefined {
  const format = calendarIntlFormatByNormId.get(calendarId)
  if (format) {
    return format
  }

  const newFormat = createCalendarIntlFormat(calendarId)
  if (
    validateNoFallback &&
    newFormat.resolvedOptions().calendar !== calendarId
  ) {
    return undefined
  }

  // Validation only reaches this point when Intl echoed the lowercased ID, so
  // that raw ID is also the normalized cache key. The ordinary resolved-ID path
  // skips the resolvedOptions() check to avoid paying it during calendar math.
  calendarIntlFormatByNormId.set(calendarId, newFormat)
  return newFormat
}

function createCalendarIntlFormat(normCalendarId: string): Intl.DateTimeFormat {
  return new RawDateTimeFormat('en', {
    calendar: normCalendarId,
    timeZone: utcTimeZoneId,
    era: 'short', // 'narrow' is too terse for japanese months
    year: 'numeric',
    month: 'short', // easier to identify monthCodes
    day: 'numeric',
    hour12: false,
  })
}

// Intl-Calendar methods
// -----------------------------------------------------------------------------

export function computeIntlDateFields(
  intlCalendar: IntlCalendar,
  isoDate: CalendarDateFields,
): CalendarDateFields {
  return intlCalendar.queryFields(isoDate)
}

export function computeIsoFieldsFromIntlParts(
  intlCalendar: IntlCalendar,
  year: number,
  month?: number,
  day?: number,
): CalendarDateFields {
  return epochMilliToIsoDateTime(
    computeIntlEpochMilli(intlCalendar, year, month, day),
  )
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
  const leapMonthMeta = intlCalendar.leapMonthMeta
  if (leapMonthMeta === undefined) {
    return undefined
  }

  const leapMonthOverride =
    intlCalendar.overrideConfig.queryLeapMonthOverride?.(year)
  if (leapMonthOverride !== undefined) {
    return leapMonthOverride
  }

  const currentMonthStrings = queryMonthStrings(intlCalendar, year)
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
  if (intlCalendar.leapMonthMeta !== undefined) {
    return computeIntlMonthsInYear(intlCalendar, year) > 12
  }

  const daysInYear = computeIntlDaysInYear(intlCalendar, year)
  return (
    daysInYear > computeIntlDaysInYear(intlCalendar, year - 1) ||
    daysInYear > computeIntlDaysInYear(intlCalendar, year + 1)
  )
}

export function computeIntlDaysInYear(
  intlCalendar: IntlCalendar,
  year: number,
): number {
  const milli = computeIntlEpochMilli(intlCalendar, year)
  const milliNext = computeIntlEpochMilli(intlCalendar, year + 1)
  return diffEpochMilliDays(milli, milliNext)
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

  return diffEpochMilliDays(
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

export function computeIntlEraFields(
  intlCalendar: IntlCalendar,
  isoDate: CalendarDateFields,
): CalendarEraFields {
  const intlFields = intlCalendar.queryFields(isoDate)
  return { era: intlFields.era, eraYear: intlFields.eraYear }
}

export function computeIntlYearMonthFieldsForMonthDay(
  intlCalendar: IntlCalendar,
  monthCodeNumber: number,
  isLeapMonth: boolean,
  day: number,
): CalendarYearMonthFields | undefined {
  const startIsoYear =
    intlCalendar.overrideConfig.getMonthDaySearchStartYear?.(
      monthCodeNumber,
      isLeapMonth,
      day,
    ) || isoEpochFirstLeapYear

  const startCalendarDateFields = computeIntlDateFields(intlCalendar, {
    year: startIsoYear,
    month: isoMonthsInYear,
    day: 31,
  })
  let {
    year: startYear,
    month: startMonth,
    day: startDay,
  } = startCalendarDateFields
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
  // TODO: reference implementation says only go 20 years back.
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
      return { year: tryYear, month: tryMonth }
    }
  }
}

export function addIntlMonths(
  intlCalendar: IntlCalendar,
  year: number,
  month: number,
  monthDelta: number,
): CalendarYearMonthFields {
  if (monthDelta) {
    month += monthDelta

    if (!Number.isSafeInteger(month)) {
      throw new RangeError(errorMessages.outOfBoundsDate)
    }

    if (monthDelta < 0) {
      while (month < 1) {
        month += computeIntlMonthsInYear(intlCalendar, --year)
      }
    } else {
      let monthsInYear: number
      while (
        month > (monthsInYear = computeIntlMonthsInYear(intlCalendar, year))
      ) {
        month -= monthsInYear
        year++
      }
    }
  }

  return { year, month }
}

export function diffIntlMonthSlots(
  intlCalendar: IntlCalendar,
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
    let months = computeIntlMonthsInYear(intlCalendar, year0) - month0 + month1
    for (let year = year0 + 1; year < year1; year++) {
      months += computeIntlMonthsInYear(intlCalendar, year)
    }
    return months
  }

  return -diffIntlMonthSlots(intlCalendar, year1, month1, year0, month0)
}

function isConstrainedFinalIntercalaryMonthDiff(
  intlCalendar: IntlCalendar,
  sign: number,
  year0: number,
  month0: number,
  day0: number,
  year1: number,
  month1: number,
  day1: number,
): boolean {
  const monthsInYear0 = computeIntlMonthsInYear(intlCalendar, year0)
  const monthsInYear1 = computeIntlMonthsInYear(intlCalendar, year1)

  // Calendars with a real final intercalary month can constrain the final day
  // across adjacent years without losing a full month slot. Ordinary end-of-
  // month wrapping still backs off because it changes monthCode instead of
  // staying on the same final intercalary month.
  return (
    sign < 0 &&
    monthsInYear0 > isoMonthsInYear &&
    monthsInYear1 > isoMonthsInYear &&
    month0 === monthsInYear0 &&
    month1 === monthsInYear1 &&
    day0 === computeIntlDaysInMonth(intlCalendar, year0, month0) &&
    day1 === computeIntlDaysInMonth(intlCalendar, year1, month1) &&
    day0 > day1
  )
}

// -----------------------------------------------------------------------------

function queryMonthStrings(intlCalendar: IntlCalendar, year: number): string[] {
  return intlCalendar.queryYearData(year).monthStrings
}

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

  throw new RangeError(errorMessages.invalidProtocolResults)
}
