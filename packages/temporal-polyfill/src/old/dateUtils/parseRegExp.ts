
const yearMonthRegExpStr =
  '([+-]\\d{6}|\\d{4})' + // 0:year
  '-?(\\d{2})' // 1:month
  // 2:annotations

const dateRegExpStr =
  yearMonthRegExpStr + // 0:year, 1:month
  '-?(\\d{2})' // 2:day
  // 3:annotations

const monthDayRegExpStr =
  '(--)?(\\d{2})' + // 1:month
  '-?(\\d{2})' // 2:day
  // 3:annotations

const numericTimeRegExpStr =
  '(\\d{2})' + // 0:hour
  '(:?(\\d{2})' + // 2:minute (NOTE: ':?' means optional ':')
  '(:?(\\d{2})' + // 4:second
  '([.,](\\d{1,9}))?' + // 6:afterDecimal
  ')?)?'

const numericOffsetRegExpStr =
  '([+-])' + // 0:plusOrMinus
  numericTimeRegExpStr // 1:hour, 3:minute, 5:second, 7:afterDecimal

const offsetRegExpStr =
  '(Z|' + // 0:zOrOffset
  numericOffsetRegExpStr + // 1:plusOrMinus, 2:hour, 4:minute, 6:second, 8:afterDecimal
  ')?'

const timeRegExpStr =
  numericTimeRegExpStr + // 0:hour, 2:minute, 4:second, 6:afterDecimal
  offsetRegExpStr // 7:zOrOffset, 8:plusOrMinus, 9:hour, 11:minute, 13:second, 15:afterDecimal
  // 16:annotations

const dateTimeRegExpStr =
  dateRegExpStr + // 0:year, 1:month, 2:day
  '([T ]' + // 3:timeEverything
  timeRegExpStr +
  // 4:hour, 6:minute, 8:second, 10:afterDecimal
  // 11:zOrOffset, 12:plusOrMinus, 13:hour, 15:minute, 17:second, 19:afterDecimal
  ')?'
  // 20:annotations

const annotationRegExpStr = '((\\[[^\\]]*\\])*)'

export const yearMonthRegExp = createRegExp(yearMonthRegExpStr + annotationRegExpStr)
export const monthDayRegExp = createRegExp(monthDayRegExpStr + annotationRegExpStr)
export const dateTimeRegExp = createRegExp(dateTimeRegExpStr + annotationRegExpStr)
export const timeRegExp = createRegExp('T?' + timeRegExpStr + annotationRegExpStr)
export const numericOffsetRegExp = createRegExp(numericOffsetRegExpStr) // annotations not allowed

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
