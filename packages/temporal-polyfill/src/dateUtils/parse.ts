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
const dateTimeRegExp = /^(\d{4})-?(\d{2})?-?(\d{2})?T?(\d{2})?:?(\d{2})?:?(\d{2})?\.?(\d+)?([-+]?\d{2}:?\d{2})(\[([^=\]]+)\])?(\[u-ca=([^\]]+)\])?$/
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
      parseFloat(match[7]),
    )
    return {
      isoYear: parseInt(match[1]),
      isoMonth: parseInt(match[2]),
      isoDay: parseInt(match[3]),
      isoHour: parseInt(match[4]),
      isoMinute: parseInt(match[5]),
      isoSecond: parseInt(match[6]),
      isoMillisecond: millisecond,
      isoMicrosecond: microsecond,
      isoNanosecond: nanosecond,
      offset: match[8] || undefined,
      calendar: match[10] ? new Calendar(match[10]) : isoCalendar,
      timeZone: match[12] ? new TimeZone(match[12]) : undefined,
    }
  }
}

function tryParseTimeISO(str: string): TimeISOEssentials | void {
  const match = timeRegExp.exec(str)
  if (match) {
    const { millisecond, microsecond, nanosecond } = partialSecondsToTimeFields(
      parseFloat(match[4]),
    )
    return {
      isoHour: parseInt(match[1]),
      isoMinute: parseInt(match[2]),
      isoSecond: parseInt(match[3]),
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
      parseFloat(match[10]),
    )
    const fields: DurationFields = {
      years: parseInt(match[2]),
      months: parseInt(match[3]),
      weeks: parseInt(match[4]),
      days: parseInt(match[5]),
      hours: parseInt(match[7]),
      minutes: parseInt(match[8]),
      seconds: parseInt(match[9]), // parseInt will ignore after decimal point
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
  const match = timeZoneOffsetRegExp.exec(str)
  if (!match) {
    throw new Error('Invalid timezone offset')
  }
  return parseOffsetPartsNano(match[1], match[2], match[3])
}

function parseOffsetPartsNano(sign: string, hours: string, minutes: string): number {
  return (sign === '-' ? -1 : 1) * (
    parseInt(hours) * 60 + parseInt(minutes)
  ) * nanoInMinute
}

function throwNoParse(str: string): any {
  throw new RangeError('Cannot parse ' + str)
}
