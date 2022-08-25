import { padEnd } from '../utils/string'
import { isValidDateISO } from './constrain'
import { nanoToISOTime } from './dayAndTime'
import { isoEpochLeapYear } from './epoch'
import { ISODateFields, ISODateTimeFields, ISOTimeFields } from './isoFields'
import {
  dateTimeRegExp,
  monthDayRegExp,
  normalizeDashes,
  offsetRegExp,
  timeRegExp,
  yearMonthRegExp,
} from './parseRegExp'
import {
  nanoInHour,
  nanoInMinute,
  nanoInSecond,
} from './units'

export interface DateParseResults extends ISODateFields {
  calendar: string | undefined
}

export interface DateTimeParseResult extends ISODateTimeFields {
  calendar: string | undefined
}

export interface ZonedDateTimeParseResult extends DateTimeParseResult {
  timeZone: string | undefined
  offsetNanoseconds: number | undefined
  Z: boolean | undefined // whether ISO8601 specified with 'Z' as offset indicator
}

// hard functions (throw error on failure)

export function parseZonedDateTime(str: string): ZonedDateTimeParseResult {
  const res = tryParseZonedDateTime(str)
  if (!res) {
    throw createParseError('dateTime', str)
  }
  return res
}

export function parseDateTime(str: string): DateTimeParseResult {
  const res = tryParseDateTime(str)
  if (!res) {
    throw createParseError('dateTime', str)
  }
  return res
}

export function parseYearMonth(str: string): DateParseResults {
  const res = tryParseYearMonth(str) || tryParseDateTime(str)
  if (!res) {
    throw createParseError('yearMonth', str)
  }
  return res
}

export function parseMonthDay(str: string): DateParseResults {
  const res = tryParseMonthDay(str) || tryParseDateTime(str)
  if (!res) {
    throw createParseError('monthDay', str)
  }
  return res
}

export function parseOffsetNano(str: string): number {
  const res = tryParseOffsetNano(str)
  if (res === undefined) {
    throw createParseError('timeZone', str) // timeZone?
  }
  return res
}

export function parseTime(str: string): ISOTimeFields {
  let res = tryParseTime(str)

  if (res !== undefined) {
    // detect ambiguity in format
    if (str.charAt(0) !== 'T') {
      const tryOther = tryParseYearMonth(str) || tryParseMonthDay(str)
      if (tryOther && isValidDateISO(tryOther)) {
        res = undefined // invalid
      }
    }
  } else {
    res = tryParseDateTime(str, true)
  }

  if (res === undefined) {
    throw createParseError('time', str)
  }
  return res
}

// soft functions (return undefined on failure)

const zRE = /^Z$/i

export function tryParseZonedDateTime(str: string): ZonedDateTimeParseResult | undefined {
  const m = dateTimeRegExp.exec(normalizeDashes(str))
  if (m) {
    return parseZonedDateTimeParts(m.slice(1))
  }
}

export function tryParseDateTime(
  str: string,
  requireTime?: boolean,
  allowZ?: boolean,
): DateTimeParseResult | undefined {
  const m = dateTimeRegExp.exec(normalizeDashes(str))
  if (
    m &&
    (allowZ || !zRE.test(m[12])) && // don't allow Z (12 means index 11 when unsliced)
    (!requireTime || m[4]) // timeEverything (4 means index 3 when unsliced)
  ) {
    return parseDateTimeParts(m.slice(1))
  }
}

function tryParseYearMonth(str: string): DateParseResults | undefined {
  const m = yearMonthRegExp.exec(normalizeDashes(str))
  if (m) {
    return parseYearMonthParts(m.slice(1))
  }
}

function tryParseMonthDay(str: string): DateParseResults | undefined {
  const m = monthDayRegExp.exec(normalizeDashes(str))
  if (m) {
    return parseMonthDayParts(m.slice(1))
  }
}

function tryParseTime(str: string) {
  const m = timeRegExp.exec(normalizeDashes(str))
  if (m) {
    return parseTimeParts(m.slice(1))
  }
}

export function tryParseOffsetNano(str: string): number | undefined {
  const m = offsetRegExp.exec(normalizeDashes(str))
  if (m) {
    return parseOffsetParts(m.slice(1))
  }
}

// parsing of string parts
// TODO: don't need toInt1/toInt0 as much because parts are more guaranteed now
// TODO: combine the zoned/unzoned cases. will simplify caller functions?

function parseZonedDateTimeParts(parts: string[]): ZonedDateTimeParseResult {
  const zOrOffset = parts[11]
  let offsetNanoseconds: number | undefined
  let Z = false

  if (zOrOffset) {
    Z = zRE.test(zOrOffset)
    offsetNanoseconds = Z ? 0 : parseOffsetParts(parts.slice(12))
  }

  return {
    ...parseDateTimeParts(parts),
    timeZone: parts[21],
    offsetNanoseconds,
    Z,
  }
}

function parseDateTimeParts(parts: string[]): DateTimeParseResult {
  return {
    calendar: parts[23],
    isoYear: toInt1(parts[0]),
    isoMonth: toInt1(parts[1]),
    isoDay: toInt1(parts[2]),
    ...parseTimeParts(parts.slice(4)),
  }
}

function parseYearMonthParts(parts: string[]): DateParseResults {
  return {
    calendar: parts[14],
    isoYear: toInt1(parts[0]),
    isoMonth: toInt1(parts[1]),
    isoDay: 1,
  }
}

function parseMonthDayParts(parts: string[]): DateParseResults {
  return {
    calendar: parts[15],
    isoYear: isoEpochLeapYear,
    isoMonth: toInt1(parts[1]),
    isoDay: toInt1(parts[2]),
  }
}

function parseTimeParts(parts: string[]): ISOTimeFields {
  const isoSecond = toInt0(parts[4])

  return {
    ...nanoToISOTime(parseNanoAfterDecimal(parts[6] || ''))[0],
    isoHour: toInt0(parts[0]),
    isoMinute: toInt0(parts[2]),
    isoSecond: isoSecond === 60 ? 59 : isoSecond, // massage lead-second
  }
}

function parseOffsetParts(parts: string[]): number {
  return (parts[0] === '+' ? 1 : -1) * timePartsToNano(parts.slice(1))
}

// time parsing as nanoseconds

function timePartsToNano(parts: string[]): number {
  return toInt0(parts[0]) * nanoInHour +
    toInt0(parts[2]) * nanoInMinute +
    toInt0(parts[4]) * nanoInSecond +
    parseNanoAfterDecimal(parts[6] || '')
}

export function parseNanoAfterDecimal(str: string): number {
  return parseInt(padEnd(str, 9, '0'))
}

// general utils

function toInt0(input: string | undefined): number { // 0-based
  return parseInt(input || '0')
}

function toInt1(input: string | undefined): number { // 1-based
  return parseInt(input || '1')
}

export function toIntMaybe(input: string | undefined): number | undefined {
  return input === undefined ? undefined : parseInt(input)
}

export function createParseError(type: string, str: string): any {
  throw new RangeError(`Cannot parse ${type} '${str}'`)
}
