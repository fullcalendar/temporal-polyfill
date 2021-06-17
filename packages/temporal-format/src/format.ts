import { PlainDateTime, ZonedDateTime } from 'temporal-ponyfill'

// Regex to replace token string with actual values
// https://github.com/iamkun/dayjs/blob/dev/src/constant.js
const REGEX_FORMAT =
  /\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g

export const format = (
  tokenStr: string,
  date: PlainDateTime | ZonedDateTime,
  locale = 'en-us',
  options?: Intl.DateTimeFormatOptions
): string => {
  const ms = date.epochMilliseconds
  const timeZone = date instanceof ZonedDateTime ? date.timeZone.id : 'UTC'

  // Object containing a tuple of [options to append to formatter, value to use from parts]
  const matches: { [key: string]: [Intl.DateTimeFormatOptions, string] } = {
    YY: [{ year: '2-digit' }, 'year'],
    YYYY: [{ year: 'numeric' }, 'year'],
    M: [{ month: 'numeric' }, 'month'],
    MM: [{ month: '2-digit' }, 'month'],
    MMM: [{ month: 'short' }, 'month'],
    MMMM: [{ month: 'long' }, 'month'],
    D: [{ day: 'numeric' }, 'day'],
    DD: [{ day: '2-digit' }, 'day'],
    // d: Numeric day of week,
    dd: [{ weekday: 'narrow' }, 'weekday'],
    ddd: [{ weekday: 'short' }, 'weekday'],
    dddd: [{ weekday: 'long' }, 'weekday'],
    H: [{ hour: 'numeric', hour12: false }, 'hour'],
    HH: [{ hour: '2-digit', hour12: false }, 'hour'],
    h: [{ hour: 'numeric', hour12: true }, 'hour'],
    hh: [{ hour: '2-digit', hour12: true }, 'hour'],
    // a: am / pm,
    // A: AM / PM,
    m: [{ minute: 'numeric' }, 'minute'],
    mm: [{ minute: '2-digit' }, 'minute'],
    s: [{ second: 'numeric' }, 'second'],
    ss: [{ second: '2-digit' }, 'second'],
    SSS: [{ second: 'numeric', fractionalSecondDigits: 3 }, 'second'],
    Z: [{ timeZoneName: 'short' }, 'timeZoneName'],
    ZZ: [{ timeZoneName: 'long' }, 'timeZoneName'],
  }
  const tokenOptions = Object.keys(matches).reduce(
    (acc: Intl.DateTimeFormatOptions, val) => {
      // Match parts of matches object from string
      // If there's a match, append its formatter options
      return tokenStr.includes(val) ? { ...acc, ...matches[val][0] } : acc
    },
    {}
  )

  // Create a format by merging user's options with token string's options
  const parts = Intl.DateTimeFormat(locale, {
    timeZone,
    ...tokenOptions,
    ...options,
  })
    .formatToParts(ms)
    .reduce((acc: Record<string, string>, { type, value }) => {
      // Convert from an array of objects to an object with keys for year/month/day/etc.
      return {
        ...acc,
        [type]: value,
      }
    }, {})

  // TODO Needs testing
  return tokenStr.replace(REGEX_FORMAT, (match, $1) => {
    return $1 || parts[matches[match][1]]
  })
}
