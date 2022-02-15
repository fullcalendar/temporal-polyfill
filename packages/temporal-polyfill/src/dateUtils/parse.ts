import { Calendar, createDefaultCalendar } from '../public/calendar'
import { TimeZone } from '../public/timeZone'
import { DateISOFields, DateTimeISOFields } from '../public/types'
import { excludeUndefined } from '../utils/obj'
import { DateISOEssentials } from './date'
import { DateTimeISOEssentials } from './dateTime'
import { nanoToDayTimeFields } from './dayTime'
import { DurationFields, negateFields } from './duration'
import { isoEpochLeapYear } from './isoMath'
import { TimeISOEssentials, timeLikeToISO } from './time'
import {
  HOUR,
  MILLISECOND,
  MINUTE,
  SECOND,
  TimeUnitInt,
  nanoIn,
  nanoInHour,
  nanoInMinute,
  nanoInSecond,
} from './units'
import { ZonedDateTimeISOEssentials } from './zonedDateTime'

export type DateTimeParseResult = DateTimeISOEssentials & {
  calendar: string | undefined
  timeZone: string | undefined
  offset: number | undefined
  Z?: boolean // whether ISO8601 specified with 'Z' as offset indicator
}

const dateRegExpStr = '([+-]\\d{6}|\\d{4})-?(\\d{2})?-?(\\d{2})?'
const monthDayRegExpStr = '(--)?(\\d{2})-?(\\d{2})?'
const timeRegExpStr = '(\\d{2})?:?(\\d{2})?:?(\\d{2})?([.,](\\d{1,9}))?' // all parts optional
const offsetRegExpStr = `([+-])${timeRegExpStr}` // hour onwards is optional
const endingRegExpStr =
  `(Z|${offsetRegExpStr})?` +
  '(\\[([^=\\]]+)\\])?(\\[u-ca=([^\\]]+)\\])?'
const offsetRegExp = createRegExp(offsetRegExpStr)
const timeRegExp = createRegExp(
  timeRegExpStr +
  endingRegExpStr, // values are ignored
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
const durationRegExp = /^([-+])?P(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T((\d+)([.,](\d{1,9}))?H)?((\d+)([.,](\d{1,9}))?M)?((\d+)([.,](\d{1,9}))?S)?)?$/i
const zuluRegExp = /Z/i
const unicodeDashRegExp = /\u2212/g

// refines DateTimeParseResult for high-level objects. TODO: rename/relocate?

export function refineDateTimeParse(parsed: DateTimeParseResult): DateTimeISOFields {
  return {
    ...parsed,
    calendar: parsed.calendar === undefined
      ? createDefaultCalendar()
      : new Calendar(parsed.calendar),
  }
}

export function refineZonedDateTimeParse(parsed: DateTimeParseResult): ZonedDateTimeISOEssentials {
  return {
    ...refineDateTimeParse(parsed),
    timeZone: new TimeZone(parsed.timeZone!), // will throw error if empty timeZone
  }
}

// hard functions (throw error on failure)

export function parseMonthDayISO(str: string): DateTimeParseResult {
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

// soft functions (return undefined on failure)

export function tryParseDateTimeISO(str: string): DateTimeParseResult | undefined {
  const match = dateTimeRegExp.exec(normalizeDashes(str))
  if (match) {
    const Z = zuluRegExp.test(match[10])
    return {
      ...parseDateParts(match.slice(1)),
      ...parseTimeParts(match.slice(5)),
      Z,
      offset: Z ? 0 : parseOffsetParts(match.slice(11)),
      timeZone: match[18], // a string. don't parse yet, might be unnecessary
      calendar: match[20], // a string. don't parse yet, might be unnecessary
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
  const match = offsetRegExp.exec(normalizeDashes(str))
  if (match) {
    return parseOffsetParts(match.slice(1))
  }
}

function tryParseDurationISO(str: string): Partial<DurationFields> | undefined {
  const match = durationRegExp.exec(normalizeDashes(str))
  if (match) {
    let hours: number | undefined
    let minutes: number | undefined
    let seconds: number | undefined
    let leftoverNano: number | undefined

    ([hours, leftoverNano] = parseDurationTimeUnit(match[8], match[10], HOUR, undefined));
    ([minutes, leftoverNano] = parseDurationTimeUnit(match[12], match[14], MINUTE, leftoverNano));
    ([seconds, leftoverNano] = parseDurationTimeUnit(match[16], match[18], SECOND, leftoverNano))

    let fields: Partial<DurationFields> = excludeUndefined({
      years: toIntMaybe(match[2]),
      months: toIntMaybe(match[3]),
      weeks: toIntMaybe(match[4]),
      days: toIntMaybe(match[5]),
      hours,
      minutes,
      seconds,
    })

    if (!Object.keys(fields).length) {
      throw new RangeError('Duration string must have at least one field')
    }

    const small = nanoToDayTimeFields(BigInt(leftoverNano || 0), MILLISECOND)
    fields.milliseconds = small.millisecond
    fields.microseconds = small.microsecond
    fields.nanoseconds = small.nanosecond

    if (match[1] === '-') {
      fields = negateFields(fields)
    }

    return fields
  }
}

function parseDurationTimeUnit(
  beforeDecimal: string | undefined,
  afterDecimal: string | undefined,
  unit: TimeUnitInt,
  leftoverNano: number | undefined,
): [number | undefined, number | undefined] { // [wholeUnits, leftoverNano]
  if (beforeDecimal !== undefined) {
    if (leftoverNano !== undefined) {
      throw new RangeError('Partial units must be last unit')
    }
    return [
      parseInt(beforeDecimal),
      afterDecimal !== undefined
        ? parseNanoAfterDecimal(afterDecimal) * (nanoIn[unit] / nanoInSecond) // mult by # of secs
        : undefined,
    ]
  } else if (leftoverNano !== undefined) {
    const wholeUnits = Math.trunc(leftoverNano / nanoIn[unit])
    return [wholeUnits, leftoverNano - (wholeUnits * nanoIn[unit])]
  } else {
    return [undefined, undefined]
  }
}

// parsing of string parts

function parseDateParts(parts: string[]): DateISOEssentials {
  return {
    isoYear: toInt1(parts[0]), // TODO: default to epoch year?
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
  const isoSecond = toInt0(parts[2])
  return {
    ...timeLikeToISO( // properties like isoMillisecond/isoMicrosecond
      nanoToDayTimeFields( // properties like millisecond/microsecond
        BigInt(parseNanoAfterDecimal(parts[4] || '')),
        MILLISECOND,
      ),
    ),
    isoHour: toInt0(parts[0]),
    isoMinute: toInt0(parts[1]),
    isoSecond: isoSecond === 60 ? 59 : isoSecond, // massage lead-second
  }
}

function parseOffsetParts(parts: string[]): number | undefined {
  const sign = parts[0]
  if (
    sign !== undefined &&
    parts[1] // has hour at least
  ) {
    return (sign === '+' ? 1 : -1) * timePartsToNano(parts.slice(1))
  }
}

// time-field utils

function timePartsToNano(parts: string[]): number {
  return toInt0(parts[0]) * nanoInHour +
    toInt0(parts[1]) * nanoInMinute +
    toInt0(parts[2]) * nanoInSecond +
    parseNanoAfterDecimal(parts[4] || '') // nanoseconds
}

// assumes 9 digits
function parseNanoAfterDecimal(str: string): number {
  return parseInt(str.padEnd(9, '0'))
}

// general utils

function toInt0(input: string | undefined): number { // 0-based
  return parseInt(input || '0')
}

function toInt1(input: string | undefined): number { // 1-based
  return parseInt(input || '1')
}

function toIntMaybe(input: string | undefined): number | undefined {
  return input === undefined ? undefined : parseInt(input)
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
