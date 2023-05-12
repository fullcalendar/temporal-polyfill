
export const isoCalendarId = 'iso8601'
export const gregoryCalendarId = 'gregory'
export const japaneseCalendarId = 'japanese'

// for converting from [era,eraYear] -> year
// if origin is >=0,
//   year = origin + eraYear
// if origin is <0, consider the era to be 'reverse' direction
//   year = -origin - eraYear
//   year = -(origin + eraYear)
export const eraOriginsByCalendarId = {
  [gregoryCalendarId]: {
    bce: -1,
    ce: 0,
  },
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

export const eraRemaps = {
  bc: 'bce',
  ad: 'ce',
}

export function getAllowErasInFields(calendarOps) {
  return calendarOps.id !== isoCalendarId
}

export function getErasBeginMidYear(calendarOps) {
  return calendarOps.id === japaneseCalendarId
}

export const leapYearMetas = {
  chinese: 11, // (positive) max possible leap month
  dangi: 11, // "
  hebrew: -6, // (negative) constant leap month
}

// Required Fields
// -------------------------------------------------------------------------------------------------

const defaultRequiredDateFields = ['day']
const defaultRequiredYearMonthFields = []
const defaultRequiredMonthDayFields = ['day']

const isoRequiredDateFields = [...defaultRequiredDateFields, 'year']
const isoRequiredYearMonthFields = [...defaultRequiredYearMonthFields, 'year']
const isoRequiredMonthDayFields = defaultRequiredMonthDayFields

export function getRequiredDateFields(calendarOps) {
  return calendarOps.id === isoCalendarId
    ? isoRequiredDateFields
    : defaultRequiredDateFields
}

export function getRequiredYearMonthFields(calendarOps) {
  return calendarOps.id === isoCalendarId
    ? isoRequiredYearMonthFields
    : defaultRequiredYearMonthFields
}

export function getRequiredMonthDayFields(calendarOps) {
  return calendarOps.id === isoCalendarId
    ? isoRequiredMonthDayFields
    : defaultRequiredMonthDayFields
}
