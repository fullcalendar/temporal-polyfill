export const isoCalendarId = 'iso8601'
export const gregoryCalendarId = 'gregory'
export const japaneseCalendarId = 'japanese'

/*
for converting from [era,eraYear] -> year
if origin is >=0,
  year = origin + eraYear
if origin is <0, consider the era to be 'reverse' direction
  year = -origin - eraYear
  year = -(origin + eraYear)
*/
export const gregoryCalendarOrigins: Record<string, number> = {
  bce: -1,
  ce: 0,
}
export const eraOriginsByCalendarId: { // for calendarIntl only
  [calendarId: string]: Record<string, number>
} = {
  [japaneseCalendarId]: {
    bce: -1,
    ce: 0,
    meiji: 1867,
    taisho: 1911,
    showa: 1925,
    heisei: 1988,
    reiwa: 2018,
  },
  ethioaa: {
    era0: 0,
  },
  ethiopic: {
    era0: 0,
    era1: 5500,
  },
  coptic: {
    era0: -1,
    era1: 0,
  },
  roc: {
    beforeroc: -1,
    minguo: 0,
  },
  buddhist: {
    be: 0,
  },
  islamic: {
    ah: 0,
  },
  indian: {
    saka: 0,
  },
  persian: {
    ap: 0,
  },
}

export const eraRemaps: Record<string, string> = {
  bc: 'bce',
  ad: 'ce',
}

export const leapMonthMetas: Record<string, number> = {
  chinese: 13, // (positive) max possible leap month
  dangi: 13, // "
  hebrew: -6, // (negative) constant leap month
}

// only used by calendar
// ---------------------

export function getRequiredYearMonthFields(calendarId: string): string[] {
  return calendarId === isoCalendarId ? ['year'] : []
}

export function getRequiredMonthDayFields(calendarId: string): string[] {
  return calendarId === isoCalendarId ? ['day'] : []
}

export function getRequiredDateFields(calendarId: string): string[] {
  return calendarId === isoCalendarId ? ['year', 'day'] : []
}
