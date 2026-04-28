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
  'ethioaa': {
    'era0': 'aa',
    'era1': 'aa',
  },
  'ethiopic': {
    'era0': 'aa',
    'era1': 'am',
  },
  'coptic': {
    'era0': 'am',
    'era1': 'am',
  },
  'roc': {
    'minguo': 'roc',
  },
  'indian': {
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

export const leapMonthMetas: Record<string, number> = {
  'chinese': 13, // (positive) max possible leap month
  'dangi': 13, // "
  'hebrew': -6, // (negative) constant leap month
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
