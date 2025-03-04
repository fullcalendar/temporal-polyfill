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
    'ethioaa': 0,
    'ethiopic': 5500,
  },
  'coptic': {
    'coptic-inverse': -1,
    'coptic': 0,
  },
  'roc': {
    'roc-inverse': -1,
    'roc': 0,
  },
  'buddhist': {
    'be': 0,
  },
  'islamic': {
    'ah': 0,
  },
  'indian': {
    'saka': 0,
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
    'era0': 'ethioaa',
    'era1': 'ethiopic',
  },
  'coptic': {
    'era0': 'coptic-inverse',
    'era1': 'coptic',
  },
  'roc': {
    'broc': 'roc-inverse',
    'minguo': 'roc',
  },
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
