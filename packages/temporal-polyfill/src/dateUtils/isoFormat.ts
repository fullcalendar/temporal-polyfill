import {
  CALENDAR_DISPLAY_ALWAYS,
  CALENDAR_DISPLAY_NEVER,
  CalendarDisplayInt,
} from '../argParse/calendarDisplay'
import { DurationToStringConfig, TimeToStringConfig } from '../argParse/isoFormatOptions'
import { TIME_ZONE_DISPLAY_NEVER, TimeZoneDisplayInt } from '../argParse/timeZoneDisplay'
import { DateISOFields, DateTimeISOFields, TimeISOFields } from '../args'
import { nanoToTimeFields } from '../dateUtils/time'
import { padZeros } from '../utils/string'
import { addWholeDays } from './add'
import { isoCalendarID } from './calendar'
import { SignedDurationFields } from './duration'
import { isoFieldsToEpochNano } from './isoMath'
import { roundNano } from './round'
import { SECOND, nanoInMicro, nanoInMilli, nanoInMinute } from './units'

export function formatDateTimeISO(
  fields: DateTimeISOFields,
  formatConfig: TimeToStringConfig,
): string {
  const [timePart, dayDelta] = formatTimeISO(fields, formatConfig)
  return formatDateISO(addWholeDays(fields, dayDelta)) + 'T' + timePart
}

export function formatDateISO(fields: DateISOFields): string {
  return formatYearMonthISO(fields) + '-' + padZeros(fields.isoDay, 2)
}

export function formatYearMonthISO(fields: DateISOFields): string {
  return padZeros(fields.isoYear, 4) + '-' + padZeros(fields.isoMonth, 2)
}

export function formatMonthDayISO(fields: DateISOFields): string {
  return padZeros(fields.isoMonth, 2) + '-' + padZeros(fields.isoDay, 2)
}

export function formatTimeISO(
  fields: TimeISOFields,
  formatConfig: TimeToStringConfig,
): [string, number] {
  const nano = roundNano(
    Number(isoFieldsToEpochNano(fields)), // HACK, because timeFieldsToNano doesn't accept ISO
    formatConfig,
  )
  const [roundedFields, dayDelta] = nanoToTimeFields(nano, 1)
  const s = padZeros(roundedFields.hour, 2) + ':' +
    padZeros(roundedFields.minute, 2) + ':' +
    padZeros(roundedFields.second, 2) +
    formatPartialSeconds(
      roundedFields.millisecond,
      roundedFields.microsecond,
      roundedFields.nanosecond,
      formatConfig.fractionalSecondDigits,
    )
  return [s, dayDelta]
}

export function formatOffsetISO(offsetNanoseconds: number): string {
  const totalMins = Math.abs(Math.trunc(offsetNanoseconds / nanoInMinute))
  const hours = Math.trunc(totalMins / 60)
  const mins = totalMins % 60
  return (offsetNanoseconds < 0 ? '-' : '+') +
    padZeros(hours, 2) +
    padZeros(mins, 2)
}

export function formatCalendarID(
  calendarID: string | undefined,
  display: CalendarDisplayInt,
): string {
  if (
    calendarID && ( // might be blank if custom calendar implementation
      display === CALENDAR_DISPLAY_ALWAYS ||
      (display !== CALENDAR_DISPLAY_NEVER && calendarID !== isoCalendarID)
    )
  ) {
    return `[u-ca=${calendarID}]`
  }
  return ''
}

export function formatTimeZoneID(timeZoneID: string, display: TimeZoneDisplayInt): string {
  if (display !== TIME_ZONE_DISPLAY_NEVER) {
    return `[${timeZoneID}]`
  }
  return ''
}

export function formatDurationISO(
  fields: SignedDurationFields,
  formatConfig: DurationToStringConfig,
): string {
  const { smallestUnit, fractionalSecondDigits } = formatConfig
  const { sign, hours, minutes, seconds } = fields
  const partialSecondsStr = smallestUnit < SECOND
    ? formatPartialSeconds(
      fields.milliseconds,
      fields.microseconds,
      fields.nanoseconds,
      fractionalSecondDigits,
    )
    : ''
  return (sign < 0 ? '-' : '') + 'P' +
    collapseDurationTuples([
      ['Y', fields.years],
      ['M', fields.months],
      ['W', fields.weeks],
      ['D', fields.days, !sign], // ensures 'P0D' if empty duration
    ]) +
    (hours || minutes || seconds || partialSecondsStr
      ? 'T' +
      collapseDurationTuples([
        ['H', hours],
        ['M', minutes],
        ['S',
          smallestUnit <= SECOND ? seconds : 0,
          partialSecondsStr, // ensures seconds if partialSecondsStr
        ],
      ]) +
      partialSecondsStr
      : '')
}

function collapseDurationTuples(tuples: [string, number, unknown?][]): string {
  return tuples.map(([char, num, forceShow]) => {
    if (forceShow || num) {
      return Math.abs(num) + char
    }
    return ''
  }).join('')
}

function formatPartialSeconds(
  milliseconds: number,
  microseconds: number,
  nanoseconds: number,
  fractionalSecondDigits: number,
): string {
  const totalNano = nanoseconds +
    microseconds * nanoInMicro +
    milliseconds * nanoInMilli

  if (totalNano && fractionalSecondDigits) {
    return '.' + ensureDecimalDigits(totalNano, fractionalSecondDigits)
  }

  return ''
}

function ensureDecimalDigits(num: number, length: number): string {
  return padZeros(num, length).substr(0, length)
}
