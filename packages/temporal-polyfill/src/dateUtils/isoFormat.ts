import {
  CALENDAR_DISPLAY_ALWAYS,
  CALENDAR_DISPLAY_NEVER,
  CalendarDisplayInt,
} from '../argParse/calendarDisplay'
import { DurationToStringConfig, TimeToStringConfig } from '../argParse/isoFormatOptions'
import { TIME_ZONE_DISPLAY_NEVER, TimeZoneDisplayInt } from '../argParse/timeZoneDisplay'
import { isoCalendarID } from '../calendarImpl/isoCalendarImpl'
import { createLargeInt } from '../utils/largeInt'
import { RoundingFunc, roundToIncrementBI } from '../utils/math'
import { getSignStr, padZeros } from '../utils/string'
import { nanoToISOTime } from './dayAndTime'
import { DurationFields } from './durationFields'
import { ISODateFields, ISODateTimeFields, ISOTimeFields } from './isoFields'
import {
  MINUTE,
  SECOND,
  TimeUnitInt,
  nanoIn,
  nanoInMicro,
  nanoInMilli,
  nanoInSecond,
} from './units'

// given ISO fields should already be rounded
export function formatDateTimeISO(
  fields: ISODateTimeFields,
  formatConfig: TimeToStringConfig,
): string {
  return formatDateISO(fields) + 'T' + formatTimeISO(fields, formatConfig)
}

export function formatDateISO(fields: ISODateFields): string {
  return formatYearMonthISO(fields) + '-' + padZeros(fields.isoDay, 2)
}

export function formatYearMonthISO(fields: ISODateFields): string {
  const { isoYear } = fields
  return (
    (isoYear < 1000 || isoYear > 9999)
      ? getSignStr(isoYear) + padZeros(Math.abs(isoYear), 6)
      : padZeros(isoYear, 4)
  ) + '-' + padZeros(fields.isoMonth, 2)
}

export function formatMonthDayISO(fields: ISODateFields): string {
  return padZeros(fields.isoMonth, 2) + '-' + padZeros(fields.isoDay, 2)
}

// given ISO fields should already be rounded
// formatConfig is NOT for rounding. only for smallestUnit/fractionalSecondDigits
export function formatTimeISO(
  fields: ISOTimeFields,
  formatConfig: TimeToStringConfig, // tighten type? remove roundingMode?
): string {
  const parts: string[] = [padZeros(fields.isoHour, 2)]

  if (formatConfig.smallestUnit <= MINUTE) {
    parts.push(padZeros(fields.isoMinute, 2))

    if (formatConfig.smallestUnit <= SECOND) {
      parts.push(
        padZeros(fields.isoSecond, 2) +
          formatPartialSeconds(
            fields.isoMillisecond,
            fields.isoMicrosecond,
            fields.isoNanosecond,
            formatConfig.fractionalSecondDigits,
          )[0],
      )
    }
  }

  return parts.join(':')
}

// TODO: combine with formatTimeISO
export function formatOffsetISO(offsetNano: number): string {
  const [fields, dayDelta] = nanoToISOTime(Math.abs(offsetNano))
  const partialSecondsStr = formatPartialSeconds(
    fields.isoMillisecond,
    fields.isoMicrosecond,
    fields.isoNanosecond,
    undefined,
  )[0]

  return getSignStr(offsetNano) +
    // format beyond 24:00 (TODO: somehow convince nanoToISOTime to have topheavy hours?)
    padZeros(fields.isoHour + dayDelta * 24, 2) + ':' +
    padZeros(fields.isoMinute, 2) +
    ((fields.isoSecond || partialSecondsStr)
      ? ':' + padZeros(fields.isoSecond, 2) + partialSecondsStr
      : '')
}

// you MUST pass in Calendar::toString()
// this is WEIRD. proper solution: have a proper CalendarProtocol object
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
  fields: DurationFields,
  formatConfig: DurationToStringConfig,
): string {
  const { smallestUnit, fractionalSecondDigits, roundingFunc } = formatConfig
  const { sign } = fields
  const hours = fields.hours
  const minutes = fields.minutes
  let seconds = fields.seconds
  let partialSecondsStr = ''

  if (smallestUnit <= SECOND) { // should be just less-than!!?
    const res = formatPartialSeconds(
      fields.milliseconds,
      fields.microseconds,
      fields.nanoseconds,
      fractionalSecondDigits,
      roundingFunc,
      smallestUnit,
    )
    partialSecondsStr = res[0]
    seconds += res[1]
  }

  // guarantee display of seconds if...
  const forceSeconds =
    fractionalSecondDigits !== undefined || // fractionalSecondDigits explicitly specified
    partialSecondsStr || // partial seconds, either via fractionalSecondDigits or default
    !sign // duration is completely empty, display 'PT0S'

  return (sign < 0 ? '-' : '') + 'P' +
    collapseDurationTuples([
      [fields.years, 'Y'],
      [fields.months, 'M'],
      [fields.weeks, 'W'],
      [fields.days, 'D'],
    ]) +
    (hours || minutes || seconds || forceSeconds
      ? 'T' +
      collapseDurationTuples([
        [hours, 'H'],
        [minutes, 'M'],
        [
          smallestUnit <= SECOND ? seconds : 0,
          partialSecondsStr + 'S',
          forceSeconds,
        ],
      ])
      : '')
}

// use BigInts, because less likely to overflow and formatting never does scientific notation
function collapseDurationTuples(tuples: [number, string, unknown?][]): string {
  return tuples.map(([num, postfix, forceShow]) => {
    if (forceShow || num) {
      // avoid outputting scientific notation
      // https://stackoverflow.com/a/50978675/96342
      const numStr = Math.abs(num).toLocaleString('fullwide', { useGrouping: false })
      return numStr + postfix
    }
    return ''
  }).join('')
}

function formatPartialSeconds(
  milliseconds: number,
  microseconds: number,
  nanoseconds: number,
  fractionalSecondDigits: number | undefined,
  roundingFunc?: RoundingFunc, // HACK for forcing this func to do rounding
  smallestUnit?: TimeUnitInt, // HACK for forcing this func to do rounding
): [string, number] { // [afterDecimalStr, secondsOverflow]
  let totalNano = createLargeInt(milliseconds).mult(nanoInMilli)
    .add(createLargeInt(microseconds).mult(nanoInMicro))
    .add(nanoseconds)

  // HACK. sometimes input is pre-rounded, other times not
  // not DRY. search for Math.pow
  if (roundingFunc) {
    totalNano = roundToIncrementBI(
      totalNano,
      fractionalSecondDigits === undefined
        ? nanoIn[smallestUnit!] // not needed anymore I don't think
        : Math.pow(10, 9 - fractionalSecondDigits),
      roundingFunc,
    )
  }

  const totalNanoAbs = totalNano.abs()
  const seconds = totalNanoAbs.div(nanoInSecond)
  const leftoverNano = totalNanoAbs.sub(seconds.mult(nanoInSecond))

  let afterDecimal = padZeros(leftoverNano.toNumber(), 9)
  afterDecimal = fractionalSecondDigits === undefined
    ? afterDecimal.replace(/0+$/, '') // strip trailing zeros
    : afterDecimal.substr(0, fractionalSecondDigits)

  return [
    afterDecimal ? '.' + afterDecimal : '',
    seconds.toNumber() * (totalNano.sign() || 1), // restore sign
  ]
}
