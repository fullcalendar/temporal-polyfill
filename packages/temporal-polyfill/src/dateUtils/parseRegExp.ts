
const yearMonthRegExpStr =
  '([+-]\\d{6}|\\d{4})' + // 0: year
  '-?(\\d{2})' // 1: month
  // ending... 12: timeZone, 14: calendar

const dateRegExpStr =
  yearMonthRegExpStr + // 0-1: yearMonth
  '-?(\\d{2})' // 2: day
  // ending... 13: timeZone, 15: calendar

const monthDayRegExpStr =
  '(--)?(\\d{2})' + // 1: month
  '-?(\\d{2})' // 2: day
  // ending... 13: timeZone, 15: calendar

const timeRegExpStr =
  '(\\d{2})' + // 0: hour
  '(:?(\\d{2})' + // 2: minute
  '(:?(\\d{2})' + // 4: second
  '([.,](\\d{1,9}))?' + // 6: afterDecimal
  ')?)?'

const dateTimeRegExpStr =
  dateRegExpStr + // 0-2: date
  '([T ]' + // 3: timeEverything
  timeRegExpStr + // 4-10: time
  ')?'
  // ending... 11: zOrOffset, 12-19: offset, 21: timeZone, 23: calendar

const offsetRegExpStr =
  '([+-])' + // 0: plusOrMinus
  timeRegExpStr // 1-7: time

const endingRegExpStr =
  '(Z|' + // 0: zOrOffset
  offsetRegExpStr + // 1-8: offset
  ')?' +
  '(\\[([^=\\]]+)\\])?' + // 10: timeZone
  '(\\[u-ca=([^\\]]+)\\])?' // 12: calendar

export const yearMonthRegExp = createRegExp(yearMonthRegExpStr + endingRegExpStr)
export const monthDayRegExp = createRegExp(monthDayRegExpStr + endingRegExpStr)
export const dateTimeRegExp = createRegExp(dateTimeRegExpStr + endingRegExpStr)
export const timeRegExp = createRegExp('T?' + timeRegExpStr + endingRegExpStr)
export const offsetRegExp = createRegExp(offsetRegExpStr)

// TODO: use same DRY technique as above
export const durationRegExp = /^([-+])?P(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T((\d+)([.,](\d{1,9}))?H)?((\d+)([.,](\d{1,9}))?M)?((\d+)([.,](\d{1,9}))?S)?)?$/i

// TODO: inject this into regexes above?
const unicodeDashRegExp = /\u2212/g

function createRegExp(meat: string): RegExp {
  return new RegExp(`^${meat}$`, 'i')
}

export function normalizeDashes(str: string): string {
  return str.replace(unicodeDashRegExp, '-')
}
