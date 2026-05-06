import { eraYearToYear } from '../internal/calendarFields'
import {
  type MonthCodeParts,
  monthCodeNumberToMonth,
  monthToMonthCodeNumber,
} from '../internal/calendarMonthCode'
import {
  diffEpochMilliDays,
  epochMilliToIsoDateTime,
  isoArgsToEpochMilli,
  isoDateToEpochMilli,
} from '../internal/epochMath'
import * as errorMessages from '../internal/errorMessages'
import { type ExternalCalendar } from '../internal/externalCalendar'
import {
  type CalendarDateFields,
  type CalendarEraFields,
  type CalendarYearMonthFields,
} from '../internal/fieldTypes'
import { normalizeEraName } from '../internal/intlCalendarConfig'
import {
  RawDateTimeFormat,
  formatEpochMilliToPartsRecord,
} from '../internal/intlFormatUtils'
import { parseIntlPartsYear } from '../internal/intlParts'
import {
  isoEpochFirstLeapYear,
  isoEpochOriginYear,
  isoMonthsInYear,
} from '../internal/isoCalendarMath'
import { maxMilli } from '../internal/temporalConstants'
import { utcTimeZoneId } from '../internal/timeZoneConfig'
import { milliInDay } from '../internal/units'
import {
  areNumberArraysEqual,
  clampNumber,
  compareNumbers,
  memoize,
  modFloor,
} from '../internal/utils'
import {
  defaultEraByCalendarIdBase,
  eraOriginsByCalendarId,
  eraRemapsByCalendarId,
  leapMonthMetas,
  plainMonthDayCommonMonthMaxDayByCalendarIdBase,
  plainMonthDayLeapMonthMaxDaysByCalendarIdBase,
} from './intlCalendarData'

interface IntlDateFields {
  era: string | undefined
  eraYear: number | undefined
  year: number
  month: number
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

type IntlYearDataCache = (year: number) => IntlYearData

export interface IntlCalendar extends ExternalCalendar {
  id: string
  queryFields: (isoDate: CalendarDateFields) => IntlDateFields
  queryYearData: IntlYearDataCache
}

const hebrewEpochYearKislevDay30EpochMilli = isoArgsToEpochMilli(-3761, 11, 17)!

function computeCalendarIdBase(normCalendarId: string): string {
  return (normCalendarId === 'islamicc' ? 'islamic' : normCalendarId).split(
    '-',
  )[0]
}

const hebrewEpochYearOneStartEpochMilli = isoArgsToEpochMilli(-3760, 9, 7)!

// Hebrew year 0 is a correction candidate because some ICU data has an
// epoch-year bug around the Kislev/Tevet boundary. Its corrected start affects
// the previous-year interval, but unlike the year-shape cases below it does not
// require canonicalizing year 1.
const hebrewSingleYearDataCorrectionCandidates: Record<number, true> = {
  0: true,
}

// These are Hebrew year-shape correction candidates. Current ICU data reports
// them one day too long: CALENDAR-INTL-DATA-NOTES.md documents the historical
// cases as impossible 3C1 complete leap years, and 5806 has the same practical
// bad-year-shape effect. The actual bad-data detection happens later by
// comparing scraped month starts with the rule-derived table, so a future ICU
// data set that already matches the rule-based shape passes through unchanged.
const hebrewYearShapeCorrectionCandidates: Record<number, true> = {
  3705: true,
  3952: true,
  4050: true,
  4297: true,
  4544: true,
  4642: true,
  4889: true,
  4967: true,
  5136: true,
  5214: true,
  5461: true,
  5559: true,
  5806: true,
}

// test262's Chinese year-length data implies two one-day new-year boundary
// disagreements with the ICU4C data bundled in Node 22. Keep this intentionally
// tiny until a broader ICU4X-sourced lunisolar table is available.
const chineseFirstMonthStartCorrections: Record<
  number,
  [knownBadEpochMilli: number, dayOffset: number]
> = {
  2027: [isoArgsToEpochMilli(2027, 2, 7)!, -1],
  2030: [isoArgsToEpochMilli(2030, 2, 2)!, 1],
}

// -----------------------------------------------------------------------------

/*
Expects an already-normalized calendar ID.
*/
export const getIntlCalendar = memoize(createIntlCalendar)

function createIntlCalendar(normCalendarId: string): IntlCalendar {
  const intlFormat = queryCalendarIntlFormat(normCalendarId)
  const baseCalendarId = computeCalendarIdBase(normCalendarId)

  function rawEpochMilliToIntlFields(epochMilli: number) {
    const intlParts = formatEpochMilliToPartsRecord(intlFormat, epochMilli)
    const intlFields = parseIntlDateFields(intlParts, baseCalendarId)
    return correctIntlDateFields(baseCalendarId, epochMilli, intlFields)
  }

  const queryYearData = createIntlYearDataCache(
    baseCalendarId,
    rawEpochMilliToIntlFields,
  )

  function epochMilliToIntlFields(epochMilli: number) {
    return computeIntlFieldsFromCorrectedYearData(
      baseCalendarId,
      queryYearData,
      epochMilli,
      rawEpochMilliToIntlFields(epochMilli),
    )
  }

  const calendar: IntlCalendar = {
    id: normCalendarId,
    queryFields: createIntlFieldCache(epochMilliToIntlFields, queryYearData),
    queryYearData,
    eraOrigins: eraOriginsByCalendarId[baseCalendarId],
    eraRemaps: eraRemapsByCalendarId[baseCalendarId],
    leapMonthMeta: getIntlCalendarLeapMonthMeta(normCalendarId),
    plainMonthDayLeapMonthMaxDays:
      plainMonthDayLeapMonthMaxDaysByCalendarIdBase[baseCalendarId],
    plainMonthDayCommonMonthMaxDay:
      plainMonthDayCommonMonthMaxDayByCalendarIdBase[baseCalendarId],
    computeYearFromEra(eraYear, normalizedEra, eraOrigin) {
      return computeIntlYearFromEra(
        baseCalendarId,
        eraYear,
        normalizedEra,
        eraOrigin,
      )
    },
    constrainPlainMonthDay(monthCodeNumber, isLeapMonth, day) {
      return constrainIntlPlainMonthDay(
        baseCalendarId,
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

function computeIntlYearFromEra(
  baseCalendarId: string,
  eraYear: number,
  normalizedEra: string,
  eraOrigin: number,
): number {
  // Ethiopic's AA era counts from an offset epoch instead of using the
  // forward/reverse year scheme used by Gregorian/ROC/Japanese eras.
  return baseCalendarId === 'ethiopic' && normalizedEra === 'aa'
    ? eraYear - 5500
    : eraYearToYear(eraYear, eraOrigin)
}

function constrainIntlPlainMonthDay(
  baseCalendarId: string,
  monthCodeNumber: number,
  isLeapMonth: boolean,
  day: number,
): number | undefined {
  let maxDay: number | undefined

  if (baseCalendarId === 'coptic') {
    maxDay = !isLeapMonth && monthCodeNumber === 13 ? 6 : 30
  } else if (baseCalendarId === 'chinese') {
    maxDay =
      isLeapMonth &&
      (monthCodeNumber === 1 ||
        monthCodeNumber === 9 ||
        monthCodeNumber === 10 ||
        monthCodeNumber === 11 ||
        monthCodeNumber === 12)
        ? 29
        : 30
  }

  return maxDay === undefined ? undefined : clampNumber(day, 1, maxDay)
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
  baseCalendarId: string,
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

    return correctIntlYearData(baseCalendarId, year, scrapedYearData)
  }

  return memoize(buildYear)
}

// Corrected Year-Data Canonicalization
// -----------------------------------------------------------------------------
//
// "Canonicalization" in this file means: keep the host-Intl scrape as the
// default data source, but replace a bounded set of known-bad scraped year data
// with the calendar shape expected by Temporal/test262. The corrected table is
// then used for both calendar->ISO construction and ISO->calendar field access.

function correctIntlYearData(
  baseCalendarId: string,
  year: number,
  scrapedYearData: IntlYearData,
): IntlYearData {
  // Keep Intl scraping as the first step for every calendar. Known corrections
  // are applied afterward so future host data can pass through unchanged when
  // it already matches the canonical shape.
  if (hasHebrewYearDataCorrectionCandidate(baseCalendarId, year)) {
    const canonicalMonthEpochMillis = buildCanonicalHebrewMonthEpochMillis(year)

    if (
      shouldCanonicalizeHebrewYearData(
        scrapedYearData,
        canonicalMonthEpochMillis,
      )
    ) {
      return {
        monthEpochMillis: canonicalMonthEpochMillis,
        // Month labels are not the source of the Hebrew-data disagreement.
        // Reuse the scraped labels so this correction does not ship localized
        // month-name strings or risk drifting from the host's label shape.
        monthStrings: scrapedYearData.monthStrings.slice(),
      }
    }
  }

  const chineseStartOffset = queryChineseFirstMonthStartCorrection(
    baseCalendarId,
    year,
    scrapedYearData,
  )
  if (chineseStartOffset !== undefined) {
    const monthEpochMillis = scrapedYearData.monthEpochMillis.slice()

    // Only the new-year boundary is known to disagree. Preserve the host's
    // month labels and later month starts so leap-month detection stays tied to
    // the same bounded ICU data that was scraped for the rest of the year.
    monthEpochMillis[0] += chineseStartOffset * milliInDay

    return {
      monthEpochMillis,
      monthStrings: scrapedYearData.monthStrings.slice(),
    }
  }

  return scrapedYearData
}

// Canonicalization Detection
// -----------------------------------------------------------------------------
//
// These helpers choose candidate years and prove whether the scraped data is
// actually bad. Candidate tables alone are not enough to replace anything; the
// scraped data must also match the known-bad shape or differ from the generated
// canonical Hebrew table.

function hasCorrectedIntlYearInterval(
  baseCalendarId: string,
  year: number,
): boolean {
  // A corrected year start changes both the starting year and the previous
  // year's closing interval, so either side of the candidate interval can make
  // field derivation necessary.
  return (
    hasCanonicalIntlYearDataCandidate(baseCalendarId, year) ||
    hasCanonicalIntlYearDataCandidate(baseCalendarId, year + 1)
  )
}

function hasCanonicalIntlYearDataCandidate(
  baseCalendarId: string,
  year: number,
): boolean {
  // This is intentionally a list of years with canonical replacement data, not
  // every year whose interval may be affected. Neighboring interval checks are
  // handled by hasCorrectedIntlYearInterval.
  return (
    hasHebrewYearDataCorrectionCandidate(baseCalendarId, year) ||
    (baseCalendarId === 'chinese' &&
      chineseFirstMonthStartCorrections[year] !== undefined)
  )
}

function hasHebrewYearDataCorrectionCandidate(
  baseCalendarId: string,
  year: number,
): boolean {
  // A single-year correction is used as-is. A bad-year-shape correction also
  // covers the following year, whose first month start moves when the bad year
  // is shortened by one day.
  return (
    baseCalendarId === 'hebrew' &&
    Boolean(
      hebrewSingleYearDataCorrectionCandidates[year] ||
        hebrewYearShapeCorrectionCandidates[year] ||
        hebrewYearShapeCorrectionCandidates[year - 1],
    )
  )
}

function shouldCanonicalizeHebrewYearData(
  scrapedYearData: IntlYearData,
  canonicalMonthEpochMillis: number[],
): boolean {
  // If the host reports a different leap/common shape than the Hebrew rules,
  // leave it alone instead of trying to pair rule boundaries with bad labels.
  // The known ICU mismatches have the same month count as the canonical year.
  if (
    scrapedYearData.monthStrings.length !== canonicalMonthEpochMillis.length
  ) {
    return false
  }

  // This is the future-ICU-data guard: a candidate year whose scraped table is
  // already canonical needs no replacement.
  return !areNumberArraysEqual(
    canonicalMonthEpochMillis,
    scrapedYearData.monthEpochMillis,
  )
}

function queryChineseFirstMonthStartCorrection(
  baseCalendarId: string,
  year: number,
  scrapedYearData: IntlYearData,
): number | undefined {
  const chineseStartCorrection = chineseFirstMonthStartCorrections[year]

  if (
    baseCalendarId === 'chinese' &&
    chineseStartCorrection !== undefined &&
    scrapedYearData.monthEpochMillis[0] === chineseStartCorrection[0]
  ) {
    // The known-bad boundary match keeps this dormant if a future ICU data set
    // already reports the canonical boundary.
    return chineseStartCorrection[1]
  }
}

// Canonical Hebrew Month-Start Generation
// -----------------------------------------------------------------------------
//
// These helpers build rule-derived Hebrew month starts for the bounded
// correction candidates above. The final IntlYearData object is assembled
// inline where the correction is applied, because that step mostly preserves
// scraped labels. General Hebrew behavior still flows through the normal Intl
// scrape unless a candidate year is proven non-canonical.

function buildCanonicalHebrewMonthEpochMillis(year: number): number[] {
  const monthEpochMillis: number[] = []
  let epochMilli = computeHebrewYearStartEpochMilli(year)
  const monthLengths = computeHebrewMonthLengths(year)

  for (let i = 0; i < monthLengths.length; i++) {
    monthEpochMillis.push(epochMilli)
    epochMilli += monthLengths[i] * milliInDay
  }

  return monthEpochMillis
}

function computeHebrewYearStartEpochMilli(year: number): number {
  // Anchor arithmetic at Hebrew year 1 Tishri 1, then move by elapsed Hebrew
  // calendar days. This avoids asking Intl about exactly the years it gets
  // wrong.
  return (
    hebrewEpochYearOneStartEpochMilli +
    (computeHebrewElapsedDays(year) - computeHebrewElapsedDays(1)) * milliInDay
  )
}

function computeHebrewDaysInYear(year: number): number {
  // Hebrew year length is the distance between adjacent Rosh Hashanah starts.
  return computeHebrewElapsedDays(year + 1) - computeHebrewElapsedDays(year)
}

function computeHebrewMonthLengths(year: number): number[] {
  // Heshvan and Kislev encode the deficient/regular/complete shape. All other
  // month lengths are fixed once the year is known to be common or leap.
  const daysInYear = computeHebrewDaysInYear(year)
  const isCompleteYear = daysInYear % 10 === 5
  const isDeficientYear = daysInYear % 10 === 3
  const monthLengths = [
    30, // Tishri
    isCompleteYear ? 30 : 29, // Heshvan
    isDeficientYear ? 29 : 30, // Kislev
    29, // Tevet
    30, // Shevat
  ]

  if (isHebrewLeapYear(year)) {
    monthLengths.push(30) // Adar I
  }

  monthLengths.push(
    29, // Adar / Adar II
    30, // Nisan
    29, // Iyar
    30, // Sivan
    29, // Tamuz
    30, // Av
    29, // Elul
  )

  return monthLengths
}

function isHebrewLeapYear(year: number): boolean {
  // Hebrew leap years are 7 out of every 19 years in the Metonic cycle.
  return modFloor(year * 7 + 1, 19) < 7
}

function computeHebrewElapsedDays(year: number): number {
  // Elapsed days are first calculated from lunar months, then adjusted by the
  // Rosh Hashanah postponement rules.
  return computeHebrewDelay1(year) + computeHebrewDelay2(year)
}

function computeHebrewDelay1(year: number): number {
  // Count elapsed lunar months and parts before this year's molad. Hebrew time
  // uses 1080 parts per hour, so a day is 25920 parts.
  const monthsElapsed = Math.floor((235 * year - 234) / 19)
  const partsElapsed = 12084 + 13753 * monthsElapsed
  let daysElapsed = 29 * monthsElapsed + Math.floor(partsElapsed / 25920)

  // Postpone Rosh Hashanah away from Sunday, Wednesday, and Friday. This is the
  // compact form of the Lo ADU Rosh rule used by common Hebrew-calendar code.
  if (modFloor(3 * (daysElapsed + 1), 7) < 3) {
    daysElapsed++
  }

  return daysElapsed
}

function computeHebrewDelay2(year: number): number {
  // The second-stage postponements compare adjacent provisional year starts.
  // They reject 356-day common years and 382-day leap years by moving one side
  // of the adjacent boundary.
  const lastYearStart = computeHebrewDelay1(year - 1)
  const currentYearStart = computeHebrewDelay1(year)
  const nextYearStart = computeHebrewDelay1(year + 1)

  // These two postponements prevent adjacent impossible year lengths. They are
  // what turns ICU's old complete-leap-year shape into the regular leap year
  // expected by Temporal for the documented historical cases.
  if (nextYearStart - currentYearStart === 356) {
    return 2
  }
  if (currentYearStart - lastYearStart === 382) {
    return 1
  }

  return 0
}

// ISO -> Calendar Fields From Corrected Year Data
// -----------------------------------------------------------------------------

function computeIntlFieldsFromCorrectedYearData(
  baseCalendarId: string,
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
    if (!hasCorrectedIntlYearInterval(baseCalendarId, year)) {
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
        ...computeCorrectedIntlYearParts(baseCalendarId, year, rawIntlFields),
        month: monthIndex + 1,
        monthString: yearData.monthStrings[monthIndex],
        day: diffEpochMilliDays(monthStart, epochMilli) + 1,
      }
    }
  }

  return rawIntlFields
}

function computeCorrectedIntlYearParts(
  baseCalendarId: string,
  year: number,
  rawIntlFields: IntlDateFields,
): Pick<IntlDateFields, 'era' | 'eraYear' | 'year'> {
  // Month/day can come entirely from corrected year data, but era labels still
  // need to follow the normal Intl parsing path and calendar fallback rules.
  const era = rawIntlFields.era || defaultEraByCalendarIdBase[baseCalendarId]

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

// Raw Intl Field Corrections
// -----------------------------------------------------------------------------

function correctIntlDateFields(
  baseCalendarId: string,
  epochMilli: number,
  intlFields: IntlDateFields,
): IntlDateFields {
  if (
    baseCalendarId === 'hebrew' &&
    epochMilli === hebrewEpochYearKislevDay30EpochMilli
  ) {
    // ICU4C reports this as Hebrew year 0 Tevet 1. Temporal/test262 expects
    // year 0 Kislev to have day 30, so keep this single boundary date in Kislev.
    return { ...intlFields, year: 0, day: 30 }
  }

  return intlFields
}

// DateTimeFormat Utils
// -----------------------------------------------------------------------------

function parseIntlDateFields(
  intlParts: Record<string, string>,
  baseCalendarId: string,
): IntlDateFields {
  return {
    ...parseIntlYear(intlParts, baseCalendarId),
    month: 0,
    monthString: intlParts.month,
    day: parseInt(intlParts.day),
  }
}

export function parseIntlYear(
  intlParts: Record<string, string>,
  baseCalendarId: string,
): {
  era: string | undefined
  eraYear: number | undefined
  year: number
} {
  const rawYear = parseInt(intlParts.year)
  let year = parseIntlPartsYear(intlParts)
  let era: string | undefined
  let eraYear: number | undefined
  const eraOrigins = eraOriginsByCalendarId[baseCalendarId]
  const eraRemaps = eraRemapsByCalendarId[baseCalendarId] || {}

  if (eraOrigins !== undefined) {
    if (intlParts.era) {
      const rawEra = normalizeEraName(intlParts.era)
      const normalizedEra = eraRemaps[rawEra] || rawEra

      // Some calendars expose raw ICU era labels that Temporal should surface as
      // stable public era codes, and a few of them need year interpretation that
      // doesn't fit the simple origin table below.
      if (baseCalendarId === 'coptic') {
        if (rawEra === 'era0') {
          year = 1 - rawYear
        } else {
          year = rawYear
        }
        era = 'am'
        eraYear = year
      } else if (baseCalendarId === 'ethioaa') {
        year = rawYear
        era = 'aa'
        eraYear = rawYear
      } else if (baseCalendarId === 'ethiopic') {
        era = normalizedEra
        if (normalizedEra === 'aa') {
          year = rawYear - 5500
          eraYear = rawYear
        } else {
          year = rawYear
          eraYear = rawYear
        }
      } else if (baseCalendarId === 'islamic') {
        year = rawYear
        if (year <= 0) {
          era = 'bh'
          eraYear = 1 - year
        } else {
          era = 'ah'
          eraYear = year
        }
      } else if (
        baseCalendarId === 'buddhist' ||
        baseCalendarId === 'hebrew' ||
        baseCalendarId === 'indian' ||
        baseCalendarId === 'persian'
      ) {
        year = rawYear
        era = normalizedEra
        eraYear = rawYear
      } else {
        const eraOrigin = eraOrigins[normalizedEra]

        if (eraOrigin === undefined) {
          throw new RangeError(errorMessages.invalidProtocolResults)
        }

        era = normalizedEra
        eraYear = rawYear
        year = eraYearToYear(eraYear, eraOrigin)
      }
    } else {
      // Some Intl implementations omit `era` for single-era calendars. Tests
      // still expect Temporal objects to expose the canonical era code.
      era = defaultEraByCalendarIdBase[baseCalendarId]

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
  const leapMonthMeta = getIntlCalendarLeapMonthMeta(intlCalendar.id)
  if (leapMonthMeta === undefined) {
    return undefined
  }

  // ICU's Chinese calendar data in Node 22 labels 1987 as having a leap M07
  // (`Mo7bis`), while Temporal/test262 follows ICU4X data where the inserted
  // slot is M06L. Keep this override deliberately narrow so the normal Intl
  // probing below remains the source of truth for other Chinese/Dangi years.
  if (computeCalendarIdBase(intlCalendar.id) === 'chinese') {
    if (year === 1987) {
      return 7
    }
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
  if (getIntlCalendarLeapMonthMeta(intlCalendar.id) !== undefined) {
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
  const baseCalendarId = computeCalendarIdBase(intlCalendar.id)
  const isChineseLike =
    baseCalendarId === 'chinese' || baseCalendarId === 'dangi'
  const startIsoYear = isChineseLike
    ? chineseMonthDaySearchStartYear(monthCodeNumber, isLeapMonth, day)
    : isoEpochFirstLeapYear

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
      return { year: tryYear, month: tryMonth }
    }
  }
}

function chineseMonthDaySearchStartYear(
  monthCodeNumber: number,
  isLeapMonth: boolean,
  day: number,
): number {
  if (isLeapMonth) {
    switch (monthCodeNumber) {
      case 1:
        // ICU4C has no M01L day-30 year; this is a 29-day leap month year.
        return 1651
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
        return 2014
      case 10:
        return 1984
      case 11:
        return day < 29 ? 2033 : 2034
      case 12:
        // ICU4C has no M12L day-30 year; this is a 29-day leap month year.
        return 1890
    }
  }
  return 1972
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

  // Coptic/Ethiopic-style calendars have a real final intercalary month every
  // year: M13 exists in both common and leap years, but its length is 5 or 6
  // days. Calendar date diffing determines the year/month span before
  // constraining the day, so Coptic 1739-M13-06.since(1738-M13-05,
  // { largestUnit: "months" }) should be 13 months, not 12 months + 6 days:
  // adding -13 months from 1739-M13-06 constrains exactly to 1738-M13-05.
  // Ordinary Jan 31 -> Feb 28 wrapping still backs off because it changes
  // monthCode instead of staying on the same final intercalary month.
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

function getIntlCalendarLeapMonthMeta(
  normCalendarId: string,
): number | undefined {
  return leapMonthMetas[computeCalendarIdBase(normCalendarId)]
}
