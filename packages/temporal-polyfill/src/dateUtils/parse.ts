import { Calendar, createDefaultCalendar } from '../public/calendar'
import { DateISOFields, DateTimeISOFields } from '../public/types'
import { DateISOEssentials } from './date'
import { nanoToDayTimeFields } from './dayTime'
import { DurationFields } from './duration'
import { isoEpochLeapYear } from './isoMath'
import { TimeISOEssentials, timeLikeToISO } from './time'
import { SECOND, nanoInHour, nanoInMinute, nanoInSecond } from './units'

export type DateTimeParseResult = DateTimeISOFields & {
  timeZone: string | undefined
  offset: number | undefined
}

const dateRegExpStr = '([+-]\\d{6}|\\d{4})-?(\\d{2})?-?(\\d{2})?'
const monthDayRegExpStr = '(--)?(\\d{2})-?(\\d{2})?'
const timeRegExpStr = '(\\d{2}):?(\\d{2})?:?(\\d{2}([.,]\\d+)?)?'
const offsetRegExpStr = `([+-])${timeRegExpStr}`
const endingRegExpStr =
  `(Z|${offsetRegExpStr})?` +
  '(\\[([^=\\]]+)\\])?(\\[u-ca=([^\\]]+)\\])?'
const offsetRegExp = createRegExp(offsetRegExpStr)
const timeRegExp = createRegExp(
  timeRegExpStr +
  endingRegExpStr, // ignored
)
const dateTimeRegExp = createRegExp(
  dateRegExpStr +
  `([T ]${timeRegExpStr})?` +
  endingRegExpStr,
)
const monthDayRegExp = createRegExp(
  monthDayRegExpStr +
  endingRegExpStr,
)
const durationRegExp = /^([-+])?P(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?$/i
const zuluRegExp = /Z/i
const unicodeDashRegExp = /\u2212/g

// hard functions (throw error on failure)

export function parseMonthDayISO(str: string): DateISOFields {
  return tryParseMonthDayISO(str) ||
    tryParseDateTimeISO(str) || // fallback to parsing a datetime
    throwNoParse('monthDay', str)
}

export function parseDateTimeISO(str: string): DateTimeParseResult {
  return tryParseDateTimeISO(str) || throwNoParse('dateTime', str)
}

export function parseOffsetNano(str: string): number {
  return tryParseOffsetNano(str) ?? throwNoParse('timeZone', str)
}

export function parseTimeISO(str: string): TimeISOEssentials {
  return tryParseTimeISO(str) ||
    tryParseDateTimeISO(str) || // fallback to parsing a datetime
    throwNoParse('time', str)
}

export function parseDurationISO(str: string): DurationFields {
  return tryParseDurationISO(str) || throwNoParse('duration', str)
}

// soft functions (return null on failure)

export function tryParseDateTimeISO(str: string): DateTimeParseResult | undefined {
  const match = dateTimeRegExp.exec(normalizeDashes(str))
  if (match) {
    const isZulu = zuluRegExp.test(match[9])
    return {
      ...parseDateParts(match.slice(1)),
      ...parseTimeParts(match.slice(5)),
      offset: isZulu ? 0 : parseOffsetParts(match.slice(10)),
      timeZone: isZulu ? 'UTC' : match[16], // a string. don't parse yet, might be unnecessary
      calendar: match[18] ? new Calendar(match[18]) : createDefaultCalendar(),
    }
  }
}

function tryParseMonthDayISO(str: string): DateISOFields | undefined {
  const match = monthDayRegExp.exec(normalizeDashes(str))
  if (match) {
    return {
      ...parseMonthDayParts(match),
      calendar: match[6] ? new Calendar(match[6]) : createDefaultCalendar(),
    }
  }
}

function tryParseTimeISO(str: string): TimeISOEssentials | undefined {
  const match = timeRegExp.exec(str)
  if (match && match[1]) { // has hour at least
    return parseTimeParts(match.slice(1))
  }
}

export function tryParseOffsetNano(str: string): number | undefined {
  return parseOffsetParts((offsetRegExp.exec(normalizeDashes(str)) || []).slice(1))
}

function tryParseDurationISO(str: string): DurationFields | undefined {
  const match = durationRegExp.exec(str)
  if (match) {
    const smallFields = nanoToDayTimeFields(
      floatSecondsToNano(toFloat(match[9])),
      SECOND,
    )
    const fields: DurationFields = {
      years: toInt0(match[2]),
      months: toInt0(match[3]),
      weeks: toInt0(match[4]),
      days: toInt0(match[5]),
      hours: toInt0(match[7]),
      minutes: toInt0(match[8]),
      seconds: smallFields.second!,
      milliseconds: smallFields.millisecond!,
      microseconds: smallFields.microsecond!,
      nanoseconds: smallFields.nanosecond!,
    }
    if (match[1] === '-') {
      // flip the signs
      for (const fieldName of Object.keys(fields)) { // guarantees own properties
        fields[fieldName as keyof DurationFields] *= -1
      }
    }
    return fields
  }
}

// parsing of string parts

function parseDateParts(parts: string[]): DateISOEssentials {
  return {
    isoYear: toInt1(parts[0]),
    isoMonth: toInt1(parts[1]),
    isoDay: toInt1(parts[2]),
  }
}

function parseMonthDayParts(parts: string[]): DateISOEssentials {
  return {
    isoYear: isoEpochLeapYear,
    isoMonth: toInt1(parts[2]),
    isoDay: toInt1(parts[3]),
  }
}

function parseTimeParts(parts: string[]): TimeISOEssentials {
  return {
    ...timeLikeToISO(
      nanoToDayTimeFields(
        floatSecondsToNano(toFloat(parts[2])),
        SECOND,
      ),
    ),
    isoHour: toInt0(parts[0]),
    isoMinute: toInt0(parts[1]),
  }
}

function parseOffsetParts(parts: string[]): number | undefined {
  const sign = parts[0]
  if (sign != null) {
    return (sign === '+' ? 1 : -1) * timePartsToNano(parts.slice(1))
  }
}

// time-field utils

function timePartsToNano(parts: string[]): number {
  return toInt0(parts[0]) * nanoInHour +
    toInt0(parts[1]) * nanoInMinute +
    floatSecondsToNano(toFloat(parts[2]))
}

function floatSecondsToNano(floatSeconds: number): number {
  return Math.trunc(floatSeconds * nanoInSecond)
}

// general utils

function toInt0(input: string | undefined): number { // 0-based
  return parseInt(input || '0')
}

function toInt1(input: string | undefined): number { // 1-based
  return parseInt(input || '1')
}

function toFloat(input: string | undefined): number {
  return parseFloat((input || '0').replace(',', '.'))
}

function normalizeDashes(str: string): string {
  return str.replace(unicodeDashRegExp, '-')
}

function createRegExp(meat: string): RegExp {
  return new RegExp(`^${meat}$`, 'i')
}

function throwNoParse(type: string, str: string): any {
  throw new RangeError(`Cannot parse ${type} '${str}'`)
}
