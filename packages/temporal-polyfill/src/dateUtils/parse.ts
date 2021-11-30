import { Calendar, isoCalendar } from '../public/calendar'
import { TimeZone } from '../public/timeZone'
import { DateISOEssentials } from './date'
import { nanoToDayTimeFields } from './dayTime'
import { DurationFields } from './duration'
import { TimeISOEssentials, timeLikeToISO } from './time'
import { SECOND, nanoInHour, nanoInMinute, nanoInSecond } from './units'
import { ZonedDateTimeISOMaybe } from './zonedDateTime'

/*
TODO: parse month-day ('06-01') needs own regex!!!
TODO: parse negative years "-002000-01-01" (has "-00" prefix?)
TODO: what about positive years like that "+00900" ?
*/
const dateRegExpStr = '(\\d{4})-?(\\d{2})?-?(\\d{2})'
const timeRegExpStr = '(\\d{2}):?(\\d{2})?:?(\\d{2}(\\.\\d+)?)?'
const timeRegExp = createRegExp(timeRegExpStr)
const offsetRegExpStr = `(Z|([-+])${timeRegExpStr})?` // Z:1 - sign:2 - offsetTime:3,4,5,6
const offsetRegExp = createRegExp(timeRegExpStr)
const dateTimeRegExp = createRegExp(
  dateRegExpStr + // date:1,2,3
  '[Tt ]?' +
  timeRegExpStr // time:4,5,6,7
    .replace(':', '?:') + // makes the hour capture group optional
  offsetRegExpStr + // Z:8 - sign:9 - offsetTime:10,11,12,13
  '(\\[([^=\\]]+)\\])?(\\[u-ca=([^\\]]+)\\])', // timeZone:15 - calendar:17
)
const durationRegExp = /^([-+])?P(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T(\d+H)?(\d+M)?(\d+(\.\d+)?S)?)?$/i

// hard functions (throw error on failure)

export function parseDateTimeISO(str: string): ZonedDateTimeISOMaybe {
  return tryParseDateTimeISO(str) || throwNoParse('dateTime', str)
}

export function parseOffsetNano(str: string): number {
  return tryParseOffsetNano(str) ?? throwNoParse('timeZone', str)
}

export function parseTimeISO(str: string): TimeISOEssentials {
  const match = timeRegExp.exec(str)
  if (match) {
    return parseTimeParts(match)
  }
  return tryParseDateTimeISO(str) || // fallback to parsing a datetime
    throwNoParse('time', str)
}

export function parseDurationISO(str: string): DurationFields {
  return tryParseDurationISO(str) || throwNoParse('duration', str)
}

// soft functions (return null on failure)

export function tryParseDateTimeISO(str: string): ZonedDateTimeISOMaybe | void {
  const match = dateTimeRegExp.exec(str)
  if (match) {
    return {
      ...parseDateParts(match.slice(1)),
      ...parseTimeParts(match.slice(4)),
      offset: parseOffsetParts(match.slice(8)),
      timeZone: match[15] ? new TimeZone(match[15]) : null,
      calendar: match[17] ? new Calendar(match[17]) : isoCalendar,
    }
  }
}

export function tryParseOffsetNano(str: string): number | void {
  return parseOffsetParts((offsetRegExp.exec(str) || []).slice(1))
}

function tryParseDurationISO(str: string): DurationFields | void {
  const match = durationRegExp.exec(str)
  if (match) {
    const smallFields = nanoToDayTimeFields(
      floatSecondsToNano(toFloat(match[9])),
      SECOND,
    )
    const fields: DurationFields = {
      years: toInt(match[2]),
      months: toInt(match[3]),
      weeks: toInt(match[4]),
      days: toInt(match[5]),
      hours: toInt(match[7]),
      minutes: toInt(match[8]),
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
    isoYear: toInt(parts[0]),
    isoMonth: toInt(parts[1]),
    isoDay: toInt(parts[2]),
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
    isoHour: toInt(parts[0]),
    isoMinute: toInt(parts[1]),
  }
}

function parseOffsetParts(parts: string[]): number | void {
  const first = parts[0]
  if (first != null) {
    if (first === 'Z') {
      return 0
    }
    return (parts[1] === '-' ? -1 : 1) * timePartsToNano(parts.slice(2))
  }
}

// time-field utils

function timePartsToNano(parts: string[]): number {
  return toInt(parts[0]) * nanoInHour +
    toInt(parts[1]) * nanoInMinute +
    floatSecondsToNano(toFloat(parts[2]))
}

function floatSecondsToNano(floatSeconds: number): number {
  return Math.trunc(floatSeconds * nanoInSecond)
}

// general utils

function toInt(input: string | undefined): number {
  return parseInt(input || '0')
}

function toFloat(input: string | undefined): number {
  return parseFloat(input || '0')
}

function createRegExp(meat: string): RegExp {
  return new RegExp(`^${meat}$`)
}

function throwNoParse(type: string, str: string): any {
  throw new RangeError(`Cannot parse ${type} '${str}'`)
}
