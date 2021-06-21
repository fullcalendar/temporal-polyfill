import { PlainDateTime, ZonedDateTime } from 'temporal-ponyfill'
import { LocaleId } from 'temporal-ponyfill/dist/utils'

// Regex to replace token string with actual values
// https://github.com/iamkun/dayjs/blob/dev/src/constant.js
const REGEX_FORMAT =
  /\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS|E|W/g

// Object containing a options to append to formatter, property to use from parts | transform function that creates an output from parts
const tokenMap: {
  [key: string]: {
    options: Intl.DateTimeFormatOptions
    property: string
    transform?: (
      parts: { [x: string]: string },
      date: PlainDateTime | ZonedDateTime
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
  // d: Numeric day of week,
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
      return date.dayOfWeek + ''
    },
  },
  W: {
    options: {},
    property: 'weekday',
    transform: (_parts, date) => {
      return date.weekOfYear + ''
    },
  },
}

export class TokenDateTimeFormat {
  private formatter: Intl.DateTimeFormat

  constructor(
    readonly tokenStr: string,
    readonly locale: LocaleId = 'en-us',
    options?: Intl.DateTimeFormatOptions
  ) {
    const tokenOptions = Object.keys(tokenMap).reduce(
      (accum: Intl.DateTimeFormatOptions, val) => {
        // Match parts of tokenTupleMap from string
        // If there's a match, append its formatter options
        return this.tokenStr.includes(val)
          ? { timeZone: 'UTC', ...accum, ...tokenMap[val].options }
          : accum
      },
      {}
    )

    // Create a format by merging user's options with token string's options
    const internalOptions = { ...tokenOptions, ...options }
    this.formatter = new Intl.DateTimeFormat(locale, internalOptions)
  }

  format(dt: PlainDateTime | ZonedDateTime): string {
    const timeZone = dt instanceof ZonedDateTime ? dt.timeZone.id : 'UTC'
    const resolvedOptions = this.formatter.resolvedOptions()

    if (resolvedOptions.timeZone !== timeZone) {
      const { locale, ...otherOptions } = resolvedOptions
      this.formatter = new Intl.DateTimeFormat(locale, {
        ...otherOptions,
        timeZone,
      } as Intl.DateTimeFormatOptions)
    }

    const parts = this.formatter
      .formatToParts(dt.epochMilliseconds)
      .reduce((acc: Record<string, string>, { type, value }) => {
        // Convert from an array of objects to an object with keys for year/month/day/etc.
        return {
          ...acc,
          [type]: value,
        }
      }, {})

    return this.tokenStr.replace(REGEX_FORMAT, (match, $1) => {
      if ($1) {
        return $1
      }

      if (tokenMap[match]) {
        return tokenMap[match].transform
          ? tokenMap[match].transform(parts, dt)
          : parts[tokenMap[match].property]
      }

      return match
    })
  }

  formatRange(
    dt0: PlainDateTime | ZonedDateTime,
    dt1: PlainDateTime | ZonedDateTime
  ): string {
    return ''
  }
}
