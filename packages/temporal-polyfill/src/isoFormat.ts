import { isoCalendarId } from './calendarConfig'
import { CalendarOps } from './calendarOps'
import { DurationInternals, absDurationInternals, durationFieldsToTimeNano } from './durationFields'
import { IsoDateFields, IsoTimeFields, IsoDateTimeFields } from './isoFields'
import { IsoDateInternals } from './isoInternals'
import { CalendarDisplay, DateTimeDisplayOptions, OffsetDisplay, refineDateDisplayOptions, SubsecDigits, TimeZoneDisplay } from './options'
import { TimeZoneOps } from './timeZoneOps'
import {
  nanoInHour,
  nanoInMicro,
  nanoInMilli,
  nanoInMinute,
  nanoInSec,
  Unit,
} from './units'
import { divFloorMod, padNumber, padNumber2 } from './utils'

/*
High-level. Refined options
*/
export function formatPossibleDate(
  formatSimple: (internals: IsoDateInternals) => string,
  internals: IsoDateInternals,
  options?: DateTimeDisplayOptions,
) {
  const calendarDisplay = refineDateDisplayOptions(options)
  const showCalendar =
    calendarDisplay > CalendarDisplay.Never || // critical or always
    (calendarDisplay === CalendarDisplay.Auto && internals.calendar.id !== isoCalendarId)

  if (showCalendar) {
    return formatIsoDateFields(internals) + formatCalendar(internals.calendar, calendarDisplay)
  } else {
    return formatSimple(internals)
  }
}

/*
Rounding already happened with these...
*/

export function formatIsoDateTimeFields(
  isoDateTimeFields: IsoDateTimeFields,
  subsecDigits: SubsecDigits | -1 | undefined,
) {
  return formatIsoDateFields(isoDateTimeFields) +
    'T' + formatIsoTimeFields(isoDateTimeFields, subsecDigits)
}

export function formatIsoDateFields(isoDateFields: IsoDateFields): string {
  return formatIsoYearMonthFields(isoDateFields) + '-' + padNumber2(isoDateFields.isoDay)
}

export function formatIsoYearMonthFields(isoDateFields: IsoDateFields): string {
  const { isoYear } = isoDateFields
  return (
    (isoYear < 0 || isoYear > 9999)
      ? getSignStr(isoYear) + padNumber(6, Math.abs(isoYear))
      : padNumber(4, isoYear)
  ) + '-' + padNumber2(isoDateFields.isoMonth)
}

export function formatIsoMonthDayFields(isoDateFields: IsoDateFields): string {
  return padNumber2(isoDateFields.isoMonth) + '-' + padNumber2(isoDateFields.isoDay)
}

export function formatIsoTimeFields(
  isoTimeFields: IsoTimeFields,
  subsecDigits: SubsecDigits | -1 | undefined,
): string {
  const parts = [
    padNumber2(isoTimeFields.isoHour),
    padNumber2(isoTimeFields.isoMinute),
  ]

  if (subsecDigits !== -1) { // show seconds?
    parts.push(
      padNumber2(isoTimeFields.isoSecond) +
      formatSubsec(
        isoTimeFields.isoMillisecond,
        isoTimeFields.isoMicrosecond,
        isoTimeFields.isoNanosecond,
        subsecDigits,
      ),
    )
  }

  return parts.join(':')
}

export function formatOffsetNano(
  offsetNano: number,
  offsetDisplay: OffsetDisplay = OffsetDisplay.Auto,
): string {
  if (offsetDisplay === OffsetDisplay.Never) {
    return ''
  }

  const [hour, nanoRemainder0] = divFloorMod(Math.abs(offsetNano), nanoInHour)
  const [minute, nanoRemainder1] = divFloorMod(nanoRemainder0, nanoInMinute)
  const [second, nanoRemainder2] = divFloorMod(nanoRemainder1, nanoInSec)

  return getSignStr(offsetNano) +
    padNumber2(hour) +
    padNumber2(minute) +
    ((second || nanoRemainder2)
      ? ':' + padNumber2(second) + formatSubsecNano(nanoRemainder2)
      : '')
}

export function formatDurationInternals(
  durationInternals: DurationInternals,
  subsecDigits: SubsecDigits | undefined,
): string {
  const { sign } = durationInternals
  const abs = absDurationInternals(durationInternals)
  const { hours, minutes } = abs
  const secondsNano = durationFieldsToTimeNano(abs, Unit.Second)
  const [wholeSeconds, subsecNano] = divFloorMod(secondsNano, nanoInSec)
  const forceSeconds =
    // at least one subsecond digit being forced?
    // allow `undefined` in comparison - will evaluate to false
    (subsecDigits as number) > 0 ||
    // completely empty? display 'PT0S'
    !sign

  return (sign < 0 ? '-' : '') + 'P' + formatDurationFragments({
    Y: abs.years,
    M: abs.months,
    W: abs.weeks,
    D: abs.days,
  }) + (
    (hours || minutes || wholeSeconds || subsecNano || forceSeconds)
      ? 'T' + formatDurationFragments({
        H: hours,
        M: minutes,
        S: wholeSeconds + (
          formatSubsecNano(subsecNano, subsecDigits) ||
          (forceSeconds
            ? '' // will force truthiness ('0')
            : 0 as unknown as string) // will leave wholeSeconds as number
        ),
      })
      : ''
  )
}

/*
Values are guaranteed to be non-negative
*/
function formatDurationFragments(fragObj: Record<string, string | number>): string {
  const parts = []

  for (const fragName in fragObj) {
    const fragVal = fragObj[fragName]
    if (fragVal) {
      parts.push(
        (typeof fragVal === 'number' ? formatNumberUnscientific(fragVal) : fragVal) +
        fragName
      )
    }
  }

  return parts.join('')
}

//
// complex objs
//

export function formatTimeZone(
  timeZoneOps: TimeZoneOps,
  timeZoneDisplay: TimeZoneDisplay,
): string {
  if (timeZoneDisplay !== TimeZoneDisplay.Never) {
    return '[' +
      (timeZoneDisplay === TimeZoneDisplay.Critical ? '!' : '') +
      timeZoneOps.id +
      ']'
  }
  return ''
}

export function formatCalendar(
  calendarOps: CalendarOps,
  calendarDisplay: CalendarDisplay,
): string {
  if (
    calendarDisplay > CalendarDisplay.Never || // critical or always
    (calendarDisplay === CalendarDisplay.Auto && calendarOps.id !== isoCalendarId)
  ) {
    return '[' +
      (calendarDisplay === CalendarDisplay.Critical ? '!' : '') +
      calendarOps.id +
      ']'
  }
  return ''
}

//
// utils
//



function formatSubsec(
  isoMillisecond: number,
  isoMicrosecond: number,
  isoNanosecond: number,
  subsecDigits: SubsecDigits | undefined,
): string {
  return formatSubsecNano(
    isoMillisecond * nanoInMilli +
    isoMicrosecond * nanoInMicro +
    isoNanosecond,
    subsecDigits,
  )
}

const trailingZerosRE = /0+$/

function formatSubsecNano(
  totalNano: number,
  subsecDigits?: SubsecDigits,
): string {
  let s = padNumber(9, totalNano)

  s = subsecDigits === undefined
    ? s.replace(trailingZerosRE, '')
    : s.slice(0, subsecDigits)

  return s ? '.' + s : ''
}

function getSignStr(num: number): string {
  return num < 0 ? '-' : '+'
}

function formatNumberUnscientific(n: number): string {
  // avoid outputting scientific notation
  // https://stackoverflow.com/a/50978675/96342
  return n.toLocaleString('fullwide', { useGrouping: false })
}
