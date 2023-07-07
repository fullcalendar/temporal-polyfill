import { isoCalendarId } from './calendarConfig'
import { absDurationInternals, durationFieldsToNano } from './durationFields'
import { autoI, criticalI, neverI, refineDateDisplayOptions } from './options'
import {
  nanoInHour,
  nanoInMicro,
  nanoInMilli,
  nanoInMinute,
  nanoInSec,
  secondsIndex,
} from './units'
import { divFloorMod, padNumber, padNumber2 } from './utils'

/*
High-level. Refined options
*/
export function formatPossibleDate(formatSimple, internals, options) {
  const calendarDisplayI = refineDateDisplayOptions(options)
  const showCalendar =
    calendarDisplayI > neverI || // critical or always
    (calendarDisplayI === autoI && internals.calendar.id !== isoCalendarId)

  if (showCalendar) {
    return formatIsoDateFields(internals) + formatCalendar(internals.calendar, calendarDisplayI)
  } else {
    return formatSimple(internals)
  }
}

/*
Rounding already happened with these...
*/

export function formatIsoDateTimeFields(
  isoDateTimeFields,
  subsecDigits,
) {
  return formatIsoDateFields(isoDateTimeFields) +
    'T' + formatIsoTimeFields(isoDateTimeFields, subsecDigits)
}

export function formatIsoDateFields(isoDateFields) {
  return formatIsoYearMonthFields(isoDateFields) + '-' + padNumber2(isoDateFields.isoDay)
}

export function formatIsoYearMonthFields(isoDateFields) {
  const { isoYear } = isoDateFields
  return (
    (isoYear < 0 || isoYear > 9999)
      ? getSignStr(isoYear) + padNumber(6, Math.abs(isoYear))
      : padNumber(4, isoYear)
  ) + '-' + padNumber2(isoDateFields.isoMonth)
}

export function formatIsoMonthDayFields(isoDateFields) {
  return padNumber2(isoDateFields.isoMonth) + '-' + padNumber2(isoDateFields.isoDay)
}

export function formatIsoTimeFields(
  isoTimeFields,
  subsecDigits, // undefined/-1/#
) {
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
  offsetNano,
  offsetDisplayI = autoI, // auto/never
) {
  if (offsetDisplayI === neverI) {
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
  durationInternals,
  subsecDigits, // undefined/-1/#
) {
  const { sign } = durationInternals
  const abs = absDurationInternals(durationInternals)
  const { hours, minutes } = abs
  const secondsNano = durationFieldsToNano(abs, secondsIndex)
  const [wholeSeconds, subsecNano] = divFloorMod(secondsNano, nanoInSec)
  const forceSeconds =
    subsecDigits > 0 || // # of subsecond digits being forced?
    !sign // completely empty? display 'PT0S'

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
          (forceSeconds ? '' : 0) // string concatenation will force truthiness
        ),
      })
      : ''
  )
}

/*
Values are guaranteed to be non-negative
*/
function formatDurationFragments(fragObj) {
  const parts = []

  for (const fragName in fragObj) {
    const fragVal = fragObj[fragName]
    if (fragVal) {
      parts.push(formatNumberNoSciNot(fragVal) + fragName)
    }
  }

  return parts.join('')
}

//
// complex objs
//

export function formatTimeZone(
  timeZoneOps,
  timeZoneDisplayI,
) {
  if (timeZoneDisplayI !== neverI) {
    return '[' +
      (timeZoneDisplayI === criticalI ? '!' : '') +
      timeZoneOps.id +
      ']'
  }
  return ''
}

export function formatCalendar(
  calendarOps,
  calendarDisplayI,
) {
  if (
    calendarDisplayI > neverI || // critical or always
    (calendarDisplayI === autoI && calendarOps.id !== isoCalendarId)
  ) {
    return '[' +
      (calendarDisplayI === criticalI ? '!' : '') +
      calendarOps.id +
      ']'
  }
  return ''
}

//
// utils
//

function formatSubsec(
  isoMillisecond,
  isoMicrosecond,
  isoNanosecond,
  subsecDigits, // undefined/#
) {
  return formatSubsecNano(
    isoMillisecond * nanoInMilli +
    isoMicrosecond * nanoInMicro +
    isoNanosecond,
    subsecDigits,
  )
}

const trailingZerosRE = /0+$/

function formatSubsecNano(totalNano, subsecDigits) { // subsecDigits can be undefined
  let s = padNumber(9, totalNano)
  s = subsecDigits === undefined
    ? s.replace(trailingZerosRE, '')
    : s.slice(0, subsecDigits)

  return s ? '.' + s : ''
}

function getSignStr(num) {
  return num < 0 ? '-' : '+'
}

function formatNumberNoSciNot(n) {
  // avoid outputting scientific notation
  // https://stackoverflow.com/a/50978675/96342
  return n.toLocaleString('fullwide', { useGrouping: false })
}
