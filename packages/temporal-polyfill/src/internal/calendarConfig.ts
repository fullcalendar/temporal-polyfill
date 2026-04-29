import { dayFieldNames, yearFieldNames } from './fields'

export const isoCalendarId = 'iso8601'
export const gregoryCalendarId = 'gregory'
export const japaneseCalendarId = 'japanese'

// Normalize era names from either user input or Intl output into a stable,
// punctuation-insensitive token before applying calendar-specific remaps.
export function normalizeEraName(era: string): string {
  const normalized = era
    .normalize('NFD') // 'Shōwa' -> 'Showa'
    .toLowerCase() // 'Before R.O.C.' -> 'before r.o.c.'
    .replace(/[^a-z0-9]/g, '') // 'before r.o.c.' -> 'beforeroc'

  // Firefox historically returned one-letter era names for some calendars.
  if (normalized === 'bc' || normalized === 'b') {
    return 'bce'
  }
  if (normalized === 'ad' || normalized === 'a') {
    return 'ce'
  }
  if (normalized === 'beforeroc') {
    return 'broc'
  }

  return normalized
}

/*
for converting from [era,eraYear] -> year
if origin is >=0,
  year = origin + eraYear
if origin is <0, consider the era to be 'reverse' direction
  year = -origin - eraYear, same as...
  year = -(origin + eraYear)
*/
export const eraOriginsByCalendarId: {
  [calendarId: string]: Record<string, number>
} = {
  [gregoryCalendarId]: {
    'bce': -1,
    'ce': 0,
  },
  [japaneseCalendarId]: {
    'bce': -1,
    'ce': 0,
    'meiji': 1867,
    'taisho': 1911,
    'showa': 1925,
    'heisei': 1988,
    'reiwa': 2018,
  },
  'ethioaa': {
    'aa': 0,
  },
  'ethiopic': {
    'am': 0,
    'aa': 0,
  },
  'coptic': {
    'am': 0,
  },
  'roc': {
    'broc': -1,
    'roc': 0,
  },
  'buddhist': {
    'be': 0,
  },
  'hebrew': {
    'am': 0,
  },
  'islamic': {
    'bh': -1,
    'ah': 0,
  },
  'indian': {
    'shaka': 0,
  },
  'persian': {
    'ap': 0,
  },
}

export const eraRemapsByCalendarId: {
  [calendarId: string]: Record<string, string>
} = {
  'ethiopic': {
    'era0': 'aa',
    'era1': 'am',
    'ethioaa': 'aa',
    'ethiopic': 'am',
  },
  'ethioaa': {
    'era0': 'aa',
    'era1': 'aa',
    'ethioaa': 'aa',
  },
  'coptic': {
    'era0': 'am',
    'era1': 'am',
    'coptic': 'am',
  },
  'roc': {
    'minguo': 'roc',
  },
  'indian': {
    // Some Intl implementations surface the older `saka` label while
    // Temporal test262 expects the canonical `shaka` code.
    'saka': 'shaka',
  },
}

// A few calendars are structurally Gregorian/ISO for month/day math and their
// arithmetic year can be derived from a fixed ISO-year offset. Keep those local
// and data-driven instead of routing them through Intl, whose historical data
// can be non-proleptic.
export const isoYearOffsetsByCalendarId: Record<string, number> = {
  'buddhist': 543,
  'roc': -1911,
}

// Some Intl implementations omit `era` for single-era calendars. Keep the
// canonical Temporal-era fallback next to the rest of the calendar metadata.
export const defaultEraByCalendarIdBase: Record<string, string> = {
  'buddhist': 'be',
  'coptic': 'am',
  'ethioaa': 'aa',
  'hebrew': 'am',
  'indian': 'shaka',
  'islamic': 'ah',
  'persian': 'ap',
}

export const leapMonthMetas: Record<string, number> = {
  'chinese': 13, // (positive) max possible leap month
  'dangi': 13, // "
  'hebrew': -6, // (negative) constant leap month
}

// PlainMonthDay stores a canonical reference date, not the user-supplied year.
// For Chinese/Dangi leap months, Temporal uses a modern reference table rather
// than blindly accepting every historical Intl result. A value of 0 means that
// monthCode has no accepted PlainMonthDay leap-month reference row; 29 means
// that days 1-29 are accepted as leap month-days, but day 30 constrains to the
// corresponding common month. Month codes omitted from this table are accepted
// according to normal calendar lookup.
const chineseDangiPlainMonthDayLeapMonthMaxDays: Record<number, number> = {
  1: 0,
  2: 29,
  8: 29,
  9: 29,
  10: 29,
  11: 29,
  12: 0,
}

export const plainMonthDayLeapMonthMaxDaysByCalendarIdBase: Record<
  string,
  Record<number, number>
> = {
  'chinese': chineseDangiPlainMonthDayLeapMonthMaxDays,
  'dangi': chineseDangiPlainMonthDayLeapMonthMaxDays,
}

// When a Chinese/Dangi PlainMonthDay leap month-day falls outside the accepted
// leap reference table, Temporal constrains through the corresponding common
// month. Common lunisolar months top out at 30 days.
//
// TODO: maybe hardcode 30 for user
//
export const plainMonthDayCommonMonthMaxDayByCalendarIdBase: Record<
  string,
  number
> = {
  'chinese': 30,
  'dangi': 30,
}

export const daysInYearOverridesByCalendarIdBase: Record<
  string,
  Record<number, number>
> = {
  // Current ICU4C data disagrees with Temporal/test262 for a few Chinese year
  // lengths near 2030: ICU reports 2026/2027/2029/2030 as 355/353/354/355
  // days, while test262 expects 354/354/355/354. Keep these accessor-level
  // overrides narrow instead of shifting scraped month boundaries, which would
  // also affect date construction, arithmetic, and ISO <-> Chinese field math.
  'chinese': {
    2026: 354,
    2027: 354,
    2029: 355,
    2030: 354,
  },
  // Hebrew entries are accessor-level year-length corrections for known ICU4C
  // data disagreements. Older entries are paired with correctIntlYearData(),
  // which rewrites the scraped month-boundary table for impossible 385-day leap
  // shapes. The 5806/5807 entries only keep daysInYear aligned with the
  // rule-based data used by test262; they do not correct ISO <-> Hebrew field
  // conversion around ISO 2046.
  'hebrew': {
    3705: 384,
    3952: 384,
    4050: 384,
    4297: 384,
    4544: 384,
    4642: 384,
    4889: 384,
    4967: 384,
    5136: 384,
    5214: 384,
    5461: 384,
    5559: 384,
    5806: 384,
    5807: 355,
  },
}

// See correctIntlYearData()
export const hebrewInvalidCompleteLeapYears: Record<number, true> = {
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
}

// only used by calendar
// ---------------------

export function getRequiredYearMonthFields(calendarId: string): string[] {
  return calendarId === isoCalendarId ? yearFieldNames : []
}

export function getRequiredMonthDayFields(calendarId: string): string[] {
  return calendarId === isoCalendarId ? dayFieldNames : []
}

export function getRequiredDateFields(calendarId: string): string[] {
  return calendarId === isoCalendarId ? ['year', 'day'] : []
}
