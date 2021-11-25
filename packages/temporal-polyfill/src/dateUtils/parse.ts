import { Calendar, isoCalendar } from '../public/calendar'
import { TimeZone } from '../public/timeZone'
import { DurationFields } from './duration'
import { TimeISOEssentials, partialSecondsToTimeFields } from './time'
import { nanoInMinute } from './units'
import { ZonedDateTimeISOMaybe } from './zonedDateTime'

/*
TODO: parse month-day ('06-01') needs own regex!!!
TODO: parse negative years "-002000-01-01" (has "-00" prefix?)
TODO: what about positive years like that "+00900" ?
*/
const dateTimeRegExp = /^(\d{4})-?(\d{2})?-?(\d{2})?T?(\d{2})?:?(\d{2})?:?(\d{2})?\.?(\d+)?([-+]?\d{2}:?\d{2})?(\[([^=\]]+)\])?(\[u-ca=([^\]]+)\])?$/
const timeRegExp = /^(\d{2}):?(\d{2})?:?(\d{2})?\.?(\d+)$/
const timeZoneOffsetRegExp = /^([-+])(\d{2}):?(\d{2})?$/
const durationRegExp = /^([-+])?P(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T(\d+H)?(\d+M)?(\d+(\.\d+)?S)?)?$/

export function parseDateTimeISO(str: string): ZonedDateTimeISOMaybe {
  return tryParseDateTimeISO(str) || throwNoParse(str)
}

export function parseTimeISO(str: string): TimeISOEssentials {
  return tryParseTimeISO(str) ||
    tryParseDateTimeISO(str) || // fallback to parsing a datetime
    throwNoParse(str)
}

export function parseDurationISO(str: string): DurationFields {
  return tryParseDurationISO(str) || throwNoParse(str)
}

function tryParseDateTimeISO(str: string): ZonedDateTimeISOMaybe | void {
  const match = dateTimeRegExp.exec(str)
  if (match) {
    const { millisecond, microsecond, nanosecond } = partialSecondsToTimeFields(
      toFloat(match[7]),
    )
    return {
      isoYear: toInt(match[1]),
      isoMonth: toInt(match[2]),
      isoDay: toInt(match[3]),
      isoHour: toInt(match[4]),
      isoMinute: toInt(match[5]),
      isoSecond: toInt(match[6]),
      isoMillisecond: millisecond,
      isoMicrosecond: microsecond,
      isoNanosecond: nanosecond,
      offset: match[8] || undefined,
      timeZone: match[10] ? new TimeZone(match[10]) : undefined,
      calendar: match[12] ? new Calendar(match[12]) : isoCalendar,
    }
  }
}

function tryParseTimeISO(str: string): TimeISOEssentials | void {
  const match = timeRegExp.exec(str)
  if (match) {
    const { millisecond, microsecond, nanosecond } = partialSecondsToTimeFields(
      toFloat(match[4]),
    )
    return {
      isoHour: toInt(match[1]),
      isoMinute: toInt(match[2]),
      isoSecond: toInt(match[3]),
      isoMillisecond: millisecond,
      isoMicrosecond: microsecond,
      isoNanosecond: nanosecond,
    }
  }
}

function tryParseDurationISO(str: string): DurationFields | void {
  const match = durationRegExp.exec(str)
  if (match) {
    const { millisecond, microsecond, nanosecond } = partialSecondsToTimeFields(
      toFloat(match[10]),
    )
    const fields: DurationFields = {
      years: toInt(match[2]),
      months: toInt(match[3]),
      weeks: toInt(match[4]),
      days: toInt(match[5]),
      hours: toInt(match[7]),
      minutes: toInt(match[8]),
      seconds: toInt(match[9]), // toInt will ignore after decimal point
      milliseconds: millisecond,
      microseconds: microsecond,
      nanoseconds: nanosecond,
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

export function parseOffsetNano(str: string): number {
  return tryParseOffsetNano(str) || throwNoParse('time zone' + str)
  // TODO: proper throwNoParse for bad time zones
}

export function tryParseOffsetNano(str: string): void | number {
  const match = timeZoneOffsetRegExp.exec(str)
  if (match) {
    return parseOffsetPartsNano(match[1], match[2], match[3])
  }
}

function parseOffsetPartsNano(sign: string, hours: string, minutes: string): number {
  return (sign === '-' ? -1 : 1) * (
    toInt(hours) * 60 + toInt(minutes)
  ) * nanoInMinute
}

function toInt(input: string | undefined): number {
  return parseInt(input || '0')
}

function toFloat(input: string | undefined): number {
  return parseFloat(input || '0')
}

function throwNoParse(str: string): any {
  throw new RangeError('Cannot parse ' + str)
}
