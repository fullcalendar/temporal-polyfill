import { dayFieldNames, yearFieldNames } from './fields'

export const isoCalendarId = 'iso8601'
export const gregoryCalendarId = 'gregory'
export const japaneseCalendarId = 'japanese'

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
    'gregory-inverse': -1,
    'gregory': 0,
  },
  [japaneseCalendarId]: {
    'japanese-inverse': -1,
    'japanese': 0,
    'meiji': 1867,
    'taisho': 1911,
    'showa': 1925,
    'heisei': 1988,
    'reiwa': 2018,
  },
  'ethiopic': {
    'aa': 0,
    'am': 5500,
  },
  'ethioaa': {
    'aa': 0,
  },
  'coptic': {
    'am': 0,
  },
  'roc': {
    'roc-inverse': -1,
    'roc': 0,
  },
  'buddhist': {
    'be': 0,
  },
  'hebrew': {
    'am': 0,
  },
  'islamic': {
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
  [gregoryCalendarId]: {
    'bce': 'gregory-inverse',
    'ce': 'gregory',
  },
  [japaneseCalendarId]: {
    'bce': 'japanese-inverse',
    'ce': 'japanese',
  },
  'ethiopic': {
    'era0': 'aa',
    'era1': 'am',
    'ethioaa': 'aa',
    'ethiopic': 'am',
  },
  'ethioaa': {
    'era0': 'aa',
    'ethioaa': 'aa',
  },
  'coptic': {
    'era1': 'am',
    'coptic': 'am',
  },
  'roc': {
    'broc': 'roc-inverse',
    'minguo': 'roc',
  },
  'indian': {
    // Some Intl implementations surface the older `saka` label while
    // Temporal test262 expects the canonical `shaka` code.
    'saka': 'shaka',
  },
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
