import { isoCalendarId } from './calendarConfig'
import { CalendarSlot, getCalendarSlotId } from './calendarSlot'
import { DayTimeNano, dayTimeNanoToNumberRemainder } from './dayTimeNano'
import { DurationInternals, absDurationInternals, durationFieldNamesAsc } from './durationFields'
import { IsoDateFields, IsoTimeFields, IsoDateTimeFields } from './isoFields'
import { epochNanoToIso } from './isoMath'
import { CalendarDisplay, DateTimeDisplayOptions, InstantDisplayOptions, OffsetDisplay, refineDateDisplayOptions, refineDateTimeDisplayOptions, refineInstantDisplayOptions, refineTimeDisplayOptions, refineZonedDateTimeDisplayOptions, SubsecDigits, TimeDisplayOptions, TimeZoneDisplay, ZonedDateTimeDisplayOptions } from './options'
import { roundDateTimeToNano, roundDayTimeNanoByInc, roundTimeToNano, roundToMinute } from './round'
import { IsoDateSlots, IsoDateTimeSlots, ZonedEpochSlots } from './slots'
import { TimeZoneSlot, getTimeZoneSlotId, refineTimeZoneSlot, timeZoneGetOffsetNanosecondsFor, utcTimeZoneId } from './timeZoneSlot'
import {
  givenFieldsToDayTimeNano,
  nanoInHour,
  nanoInMicro,
  nanoInMilli,
  nanoInMinute,
  nanoInSec,
  Unit,
} from './units'
import { divModFloor, padNumber, padNumber2 } from './utils'

/*
This files relies on TimeZoneSlot/refineTimeZoneSlot
Caller will need to pre-convert to a `timeZoneGetOffsetNanosecondsFor`-like function
and other tricks for formatting TimeZone and Calendar as string
(see formatZonedDateTimeIso)
DO LAST!!!
*/

// High-level
// -------------------------------------------------------------------------------------------------

export function formatPlainDateTimeIso(
  internals: IsoDateTimeSlots,
  options?: DateTimeDisplayOptions,
): string {
  const [
    calendarDisplay,
    nanoInc,
    roundingMode,
    subsecDigits,
  ] = refineDateTimeDisplayOptions(options)

  const roundedIsoFields = roundDateTimeToNano(internals, nanoInc, roundingMode)

  return formatIsoDateTimeFields(roundedIsoFields, subsecDigits) +
    formatCalendar(internals.calendar, calendarDisplay)
}

export function formatPlainDateIso(
  internals: IsoDateSlots,
  options?: DateTimeDisplayOptions
): string {
  return formatIsoDateFields(internals) +
    formatCalendar(internals.calendar, refineDateDisplayOptions(options))
}

export function formatZonedDateTimeIso(
  internals: ZonedEpochSlots,
  options?: ZonedDateTimeDisplayOptions,
): string {
  let { epochNanoseconds: epochNano, timeZone, calendar } = internals
  const [
    calendarDisplay,
    timeZoneDisplay,
    offsetDisplay,
    nanoInc,
    roundingMode,
    subsecDigits,
  ] = refineZonedDateTimeDisplayOptions(options)

  epochNano = roundDayTimeNanoByInc(epochNano, nanoInc, roundingMode, true)
  const offsetNano = timeZoneGetOffsetNanosecondsFor(timeZone, epochNano)
  const isoFields = epochNanoToIso(epochNano, offsetNano)

  return formatIsoDateTimeFields(isoFields, subsecDigits) +
    formatOffsetNano(roundToMinute(offsetNano), offsetDisplay) +
    formatTimeZone(timeZone, timeZoneDisplay) +
    formatCalendar(calendar, calendarDisplay)
}

export function formatInstantIso(
  epochNano: DayTimeNano,
  options?: InstantDisplayOptions,
): string {
  const [
    timeZoneArg,
    nanoInc,
    roundingMode,
    subsecDigits,
  ] = refineInstantDisplayOptions(options)
  const timeZone = timeZoneArg !== undefined ? refineTimeZoneSlot(timeZoneArg) : utcTimeZoneId

  epochNano = roundDayTimeNanoByInc(
    epochNano,
    nanoInc,
    roundingMode,
    true, // useDayOrigin
  )

  let offsetNano = timeZoneGetOffsetNanosecondsFor(timeZone, epochNano)
  const isoFields = epochNanoToIso(epochNano, offsetNano)

  return formatIsoDateTimeFields(isoFields, subsecDigits) +
    (timeZoneArg
      ? formatOffsetNano(roundToMinute(offsetNano))
      : 'Z'
    )
}

export function formatPlainTimeIso(fields: IsoTimeFields, options?: TimeDisplayOptions): string {
  const [nanoInc, roundingMode, subsecDigits] = refineTimeDisplayOptions(options)

  return formatIsoTimeFields(
    roundTimeToNano(fields, nanoInc, roundingMode)[0],
    subsecDigits,
  )
}

// Other Stuff
// -------------------------------------------------------------------------------------------------

/*
High-level. Refined options.
TODO: possible to simplify this function
*/
export function formatPossibleDate(
  formatSimple: (internals: IsoDateSlots) => string,
  internals: IsoDateSlots,
  options?: DateTimeDisplayOptions,
) {
  const calendarDisplay = refineDateDisplayOptions(options)
  const calendarId = getCalendarSlotId(internals.calendar)
  const showCalendar =
    calendarDisplay > CalendarDisplay.Never || // critical or always
    (calendarDisplay === CalendarDisplay.Auto && calendarId !== isoCalendarId)

  if (calendarDisplay === CalendarDisplay.Never) {
    if (calendarId === isoCalendarId) {
      return formatSimple(internals)
    } else {
      return formatIsoDateFields(internals)
    }
  } else if (showCalendar) {
    return formatIsoDateFields(internals) + formatCalendarId(calendarId, calendarDisplay === CalendarDisplay.Critical)
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

  const [hour, nanoRemainder0] = divModFloor(Math.abs(offsetNano), nanoInHour)
  const [minute, nanoRemainder1] = divModFloor(nanoRemainder0, nanoInMinute)
  const [second, nanoRemainder2] = divModFloor(nanoRemainder1, nanoInSec)

  return getSignStr(offsetNano) +
    padNumber2(hour) + ':' +
    padNumber2(minute) +
    ((second || nanoRemainder2)
      ? ':' + padNumber2(second) + formatSubsecNano(nanoRemainder2)
      : '')
}

export function formatDurationInternals(
  durationInternals: DurationInternals, // already balanced
  subsecDigits: SubsecDigits | undefined,
): string {
  const { sign } = durationInternals
  const abs = absDurationInternals(durationInternals)
  const { hours, minutes } = abs

  const [wholeSeconds, subsecNano] = dayTimeNanoToNumberRemainder(
    givenFieldsToDayTimeNano(abs, Unit.Second, durationFieldNamesAsc),
    nanoInSec,
  )

  const subsecNanoString = formatSubsecNano(subsecNano, subsecDigits)

  const forceSeconds =
    // a numeric subsecDigits specified?
    // allow `undefined` in comparison - will evaluate to false
    (subsecDigits as number) >= 0 ||
    // completely empty? display 'PT0S'
    !sign ||
    subsecNanoString

  return (sign < 0 ? '-' : '') + 'P' + formatDurationFragments({
    Y: formatNumberUnscientific(abs.years),
    M: formatNumberUnscientific(abs.months),
    W: formatNumberUnscientific(abs.weeks),
    D: formatNumberUnscientific(abs.days),
  }) + (
    (hours || minutes || wholeSeconds || forceSeconds)
      ? 'T' + formatDurationFragments({
        H: formatNumberUnscientific(hours),
        M: formatNumberUnscientific(minutes),
        S: formatNumberUnscientific(wholeSeconds, forceSeconds) + subsecNanoString
      })
      : ''
  )
}

/*
Values are guaranteed to be non-negative
*/
function formatDurationFragments(fragObj: Record<string, string>): string {
  const parts = []

  for (const fragName in fragObj) {
    const fragVal = fragObj[fragName]
    if (fragVal) {
      parts.push(fragVal, fragName)
    }
  }

  return parts.join('')
}

//
// complex objs
//

export function formatTimeZone(
  timeZoneSlot: TimeZoneSlot,
  timeZoneDisplay: TimeZoneDisplay,
): string {
  if (timeZoneDisplay !== TimeZoneDisplay.Never) {
    return '[' +
      (timeZoneDisplay === TimeZoneDisplay.Critical ? '!' : '') +
      getTimeZoneSlotId(timeZoneSlot) +
      ']'
  }
  return ''
}

export function formatCalendar(
  calendar: CalendarSlot,
  calendarDisplay: CalendarDisplay,
): string {
  if (calendarDisplay !== CalendarDisplay.Never) {
    const calendarId = getCalendarSlotId(calendar)

    if (
      calendarDisplay > CalendarDisplay.Never || // critical or always
      (calendarDisplay === CalendarDisplay.Auto && calendarId !== isoCalendarId)
    ) {
      return formatCalendarId(calendarId, calendarDisplay === CalendarDisplay.Critical)
    }
  }

  return ''
}

function formatCalendarId(calendarId: string, isCritical: boolean): string {
  return '[' +
    (isCritical ? '!' : '') +
    'u-ca=' + calendarId +
    ']'
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

/*
Only good at non-negative numbers, because of HACK
*/
function formatNumberUnscientific(n: number, force?: any): string {
  if (!n && !force) {
    return '' // TODO: rename this whole func
  }

  // avoid outputting scientific notation
  // https://stackoverflow.com/a/50978675/96342
  return n.toLocaleString('fullwide', { useGrouping: false })
}
