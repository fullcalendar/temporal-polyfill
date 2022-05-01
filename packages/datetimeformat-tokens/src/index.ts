import { Temporal } from 'temporal-spec'
import { getOrdinalForValue } from './ordinals'

// Regex to replace token string with actual values
const REGEX_MATCHES =
  /Y{1,4}|M{1,4}|Do|Wo|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS|E|W/g
const REGEX_ESCAPED_LITERALS = /\[[^\]]+]/g
const REGEX_FORMAT = new RegExp(
  `(${REGEX_ESCAPED_LITERALS.source}|${REGEX_MATCHES.source})`,
  'g',
)

// Object containing a options to append to formatter, property to use from parts
// transform function that creates an output from parts
const tokenMap: {
  [key: string]: {
    options: Intl.DateTimeFormatOptions
    property: string
    transform?: (
      parts: { [x: string]: string },
      date: Temporal.PlainDateTime | Temporal.ZonedDateTime,
      locale: string
    ) => string
  }
} = {
  YY: { options: { year: '2-digit' }, property: 'year' },
  YYYY: { options: { year: 'numeric' }, property: 'year' },
  M: { options: { month: 'numeric' }, property: 'month' },
  MM: { options: { month: '2-digit' }, property: 'month' },
  MMM: { options: { month: 'short' }, property: 'month' },
  MMMM: { options: { month: 'long' }, property: 'month' },
  D: { options: { day: 'numeric' }, property: 'day' },
  DD: { options: { day: '2-digit' }, property: 'day' },
  d: {
    options: {},
    property: 'day',
    transform: (_parts, date) => {
      return date.dayOfWeek.toString()
    },
  },
  dd: { options: { weekday: 'narrow' }, property: 'weekday' },
  ddd: { options: { weekday: 'short' }, property: 'weekday' },
  dddd: { options: { weekday: 'long' }, property: 'weekday' },
  H: { options: { hour: 'numeric', hour12: false }, property: 'hour' },
  HH: { options: { hour: '2-digit', hour12: false }, property: 'hour' },
  h: { options: { hour: 'numeric', hour12: true }, property: 'hour' },
  hh: { options: { hour: '2-digit', hour12: true }, property: 'hour' },
  a: {
    options: { dayPeriod: 'short', hour12: true },
    property: 'dayPeriod',
    transform: (parts) => {
      return parts.dayPeriod.toLowerCase()
    },
  },
  A: { options: { dayPeriod: 'narrow', hour12: true }, property: 'dayPeriod' },
  m: { options: { minute: 'numeric' }, property: 'minute' },
  mm: { options: { minute: '2-digit' }, property: 'minute' },
  s: { options: { second: 'numeric' }, property: 'second' },
  ss: { options: { second: '2-digit' }, property: 'second' },
  SSS: {
    options: { second: 'numeric', fractionalSecondDigits: 3 },
    property: 'second',
  },
  Z: { options: { timeZoneName: 'short' }, property: 'timeZoneName' },
  ZZ: { options: { timeZoneName: 'long' }, property: 'timeZoneName' },
  E: {
    options: {},
    property: 'weekday',
    transform: (_parts, date) => {
      return date.dayOfWeek.toString()
    },
  },
  W: {
    options: {},
    property: 'weekday',
    transform: (_parts, date) => {
      return date.weekOfYear.toString()
    },
  },
  Do: {
    options: { day: 'numeric' },
    property: 'day',
    transform: (parts, _date, locale) => {
      return parts.day + getOrdinalForValue(parseInt(parts.day), 'day', locale)
    },
  },
  Wo: {
    options: {},
    property: 'weekday',
    transform: (_parts, date, locale) => {
      return (
        date.weekOfYear + getOrdinalForValue(date.weekOfYear, 'weekday', locale)
      )
    },
  },
}

export class TokenDateTimeFormat {
  private formatter: Intl.DateTimeFormat
  private tokenSplit: Array<{ token: string } | string>

  constructor(
    tokenStr: string,
    private locale: string = 'en-us',
    options?: Intl.DateTimeFormatOptions,
  ) {
    // Map into either a string literal or an object with a token property
    this.tokenSplit = tokenStr.split(REGEX_FORMAT).map((val) => {
      if (val.match(REGEX_ESCAPED_LITERALS)) {
        return val.substring(1, val.length - 1)
      } else if (val.match(REGEX_MATCHES)) {
        return { token: val }
      }
      return val
    })

    // Create options from matches in tokenStr
    const tokenOptions: Intl.DateTimeFormatOptions = this.tokenSplit.reduce(
      (accum: Intl.DateTimeFormatOptions, val) => {
        // Append token options into existing options
        return typeof val === 'object'
          ? { ...accum, ...tokenMap[val.token]?.options }
          : accum
      },
      {},
    )

    // Create a format by merging user's options with token string's options
    const internalOptions = { timeZone: 'UTC', ...tokenOptions, ...options }
    this.formatter = new Intl.DateTimeFormat(locale, internalOptions)
  }

  format(dt: Temporal.PlainDateTime | Temporal.ZonedDateTime): string {
    const timeZone = dt instanceof Temporal.ZonedDateTime ? dt.timeZone.id : 'UTC'
    const resolvedOptions = this.formatter.resolvedOptions()

    // Adjust formatter only if timeZone is different
    if (resolvedOptions.timeZone !== timeZone) {
      this.formatter = new Intl.DateTimeFormat(this.locale, {
        ...resolvedOptions,
        timeZone,
      } as Intl.DateTimeFormatOptions)
    }

    const zdt = dt instanceof Temporal.ZonedDateTime ? dt : dt.toZonedDateTime('UTC')
    const parts = this.formatter
      .formatToParts(zdt.epochMilliseconds)
      .reduce((accum: Record<string, string>, { type, value }) => {
        // Convert from an array of objects to an object with keys for year/month/day/etc.
        accum[type] = value
        return accum
      }, {})

    // Map parts that are tokens into values
    return this.tokenSplit
      .map((val) => {
        if (typeof val === 'object') {
          return tokenMap[val.token].transform
            ? tokenMap[val.token].transform!(parts, dt, this.locale)
            : parts[tokenMap[val.token].property]
        }
        return val
      })
      .join('')
  }
}
