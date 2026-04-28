import { BigNano, divModBigNano } from './bigNano'
import { isoCalendarId } from './calendarConfig'
import {
  checkDurationTimeUnit,
  checkDurationUnits,
  durationFieldsToBigNano,
  negateDurationFields,
} from './durationMath'
import { IsoDateFields, IsoDateTimeFields, IsoTimeFields } from './isoFields'
import {
  CalendarDisplay,
  OffsetDisplay,
  RoundingMode,
  SubsecDigits,
  TimeZoneDisplay,
} from './options'
import {
  CalendarDisplayOptions,
  DateTimeDisplayOptions,
  InstantDisplayOptions,
  TimeDisplayOptions,
  ZonedDateTimeDisplayOptions,
  refineDateDisplayOptions,
  refineDateTimeDisplayOptions,
  refineInstantDisplayOptions,
  refineTimeDisplayOptions,
  refineZonedDateTimeDisplayOptions,
} from './optionsRefine'
import {
  roundBigNanoByInc,
  roundDateTimeToNano,
  roundDayTimeDurationByInc,
  roundTimeToNano,
  roundToMinute,
} from './round'
import {
  DurationSlots,
  InstantSlots,
  PlainDateSlots,
  PlainDateTimeSlots,
  PlainMonthDaySlots,
  PlainTimeSlots,
  PlainYearMonthSlots,
  ZonedDateTimeSlots,
} from './slots'
import { epochNanoToIso } from './timeMath'
import { utcTimeZoneId } from './timeZoneConfig'
import { NativeTimeZone, queryNativeTimeZone } from './timeZoneNative'
import {
  Unit,
  nanoInHour,
  nanoInMicro,
  nanoInMilli,
  nanoInMinute,
  nanoInSec,
} from './units'
import { divModFloor, divModTrunc, padNumber, padNumber2 } from './utils'

// High-level
// -----------------------------------------------------------------------------

export function formatInstantIso(
  refineTimeZoneString: (timeZoneString: string) => string, // to timeZoneId
  instantSlots: InstantSlots,
  options?: InstantDisplayOptions,
): string {
  const displayOptions = refineInstantDisplayOptions(options)
  // Avoid tuple destructuring; it observes Array.prototype[Symbol.iterator].
  const timeZoneArg = displayOptions[0]
  const roundingMode = displayOptions[1]
  const nanoInc = displayOptions[2]
  const subsecDigits = displayOptions[3]

  const providedTimeZone = timeZoneArg !== undefined
  const nativeTimeZone = queryNativeTimeZone(
    providedTimeZone
      ? refineTimeZoneString(timeZoneArg)
      : (utcTimeZoneId as any),
  )

  return formatEpochNanoIso(
    providedTimeZone,
    nativeTimeZone,
    instantSlots.epochNanoseconds,
    roundingMode,
    nanoInc,
    subsecDigits,
  )
}

export function formatZonedDateTimeIso(
  zonedDateTimeSlots0: ZonedDateTimeSlots,
  options?: ZonedDateTimeDisplayOptions,
): string {
  const displayOptions = refineZonedDateTimeDisplayOptions(options)
  return formatZonedEpochNanoIso(
    zonedDateTimeSlots0.calendar,
    zonedDateTimeSlots0.timeZone,
    zonedDateTimeSlots0.epochNanoseconds,
    // workaround for https://github.com/swc-project/swc/issues/8806
    // Avoid tuple spread; it observes Array.prototype[Symbol.iterator].
    displayOptions[0],
    displayOptions[1],
    displayOptions[2],
    displayOptions[3],
    displayOptions[4],
    displayOptions[5],
  )
}

export function formatPlainDateTimeIso(
  plainDateTimeSlots0: PlainDateTimeSlots,
  options?: DateTimeDisplayOptions,
): string {
  const displayOptions = refineDateTimeDisplayOptions(options)
  return formatDateTimeIso(
    plainDateTimeSlots0.calendar,
    plainDateTimeSlots0,
    // workaround for https://github.com/swc-project/swc/issues/8806
    // Avoid tuple spread; it observes Array.prototype[Symbol.iterator].
    displayOptions[0],
    displayOptions[1],
    displayOptions[2],
    displayOptions[3],
  )
}

export function formatPlainDateIso(
  plainDateSlots: PlainDateSlots,
  options?: CalendarDisplayOptions,
): string {
  return formatDateIso(
    plainDateSlots.calendar,
    plainDateSlots,
    refineDateDisplayOptions(options),
  )
}

export function formatPlainYearMonthIso(
  plainYearMonthSlots: PlainYearMonthSlots,
  options?: CalendarDisplayOptions,
): string {
  return formatDateLikeIso(
    plainYearMonthSlots.calendar,
    formatIsoYearMonthFields,
    plainYearMonthSlots,
    refineDateDisplayOptions(options),
  )
}

export function formatPlainMonthDayIso(
  plainMonthDaySlots: PlainMonthDaySlots,
  options?: CalendarDisplayOptions,
): string {
  return formatDateLikeIso(
    plainMonthDaySlots.calendar,
    formatIsoMonthDayFields,
    plainMonthDaySlots,
    refineDateDisplayOptions(options),
  )
}

export function formatPlainTimeIso(
  slots: PlainTimeSlots,
  options?: TimeDisplayOptions,
): string {
  const displayOptions = refineTimeDisplayOptions(options)
  return formatTimeIso(
    slots,
    // workaround for https://github.com/swc-project/swc/issues/8806
    // Avoid tuple spread; it observes Array.prototype[Symbol.iterator].
    displayOptions[0],
    displayOptions[1],
    displayOptions[2],
  )
}

export function formatDurationIso(
  slots: DurationSlots,
  options?: TimeDisplayOptions,
): string {
  const displayOptions = refineTimeDisplayOptions(options, Unit.Second)
  // Avoid tuple destructuring; it observes Array.prototype[Symbol.iterator].
  const roundingMode = displayOptions[0]
  const nanoInc = displayOptions[1]
  const subsecDigits = displayOptions[2]

  // for performance AND for not losing precision when no rounding
  if (nanoInc > 1) {
    slots = {
      ...slots,
      ...roundDayTimeDurationByInc(slots, nanoInc, roundingMode),
    }

    // Check out-of-bounds
    checkDurationUnits(slots)
  }

  return formatDurationSlots(
    slots,
    subsecDigits as SubsecDigits | undefined, // -1 won't happen (units can't be minutes)
  )
}

// Medium-Level (receives refined options, also for formatDateLikeIso meta)
// -----------------------------------------------------------------------------

function formatEpochNanoIso(
  providedTimeZone: boolean,
  nativeTimeZone: NativeTimeZone,
  epochNano: BigNano,
  roundingMode: RoundingMode,
  nanoInc: number,
  subsecDigits: SubsecDigits | -1 | undefined,
): string {
  epochNano = roundBigNanoByInc(
    epochNano,
    nanoInc,
    roundingMode,
    true, // useDayOrigin
  )

  const offsetNano = nativeTimeZone.getOffsetNanosecondsFor(epochNano)
  const isoFields = epochNanoToIso(epochNano, offsetNano)

  return (
    formatIsoDateTimeFields(isoFields, subsecDigits) +
    (providedTimeZone ? formatOffsetNano(roundToMinute(offsetNano)) : 'Z')
  )
}

function formatZonedEpochNanoIso(
  calendarId: string,
  timeZoneId: string,
  epochNano: BigNano,
  calendarDisplay: CalendarDisplay,
  timeZoneDisplay: TimeZoneDisplay,
  offsetDisplay: OffsetDisplay,
  roundingMode: RoundingMode,
  nanoInc: number,
  subsecDigits: SubsecDigits | -1 | undefined,
): string {
  epochNano = roundBigNanoByInc(epochNano, nanoInc, roundingMode, true)
  const nativeTimeZone = queryNativeTimeZone(timeZoneId)
  const offsetNano = nativeTimeZone.getOffsetNanosecondsFor(epochNano)
  const isoFields = epochNanoToIso(epochNano, offsetNano)

  return (
    formatIsoDateTimeFields(isoFields, subsecDigits) +
    formatOffsetNano(roundToMinute(offsetNano), offsetDisplay) +
    formatTimeZone(timeZoneId, timeZoneDisplay) +
    formatCalendar(calendarId, calendarDisplay)
  )
}

function formatDateTimeIso(
  calendarId: string,
  isoFields: IsoDateTimeFields,
  calendarDisplay: CalendarDisplay,
  roundingMode: RoundingMode,
  nanoInc: number,
  subsecDigits: SubsecDigits | -1 | undefined,
): string {
  const roundedIsoFields = roundDateTimeToNano(isoFields, nanoInc, roundingMode)

  return (
    formatIsoDateTimeFields(roundedIsoFields, subsecDigits) +
    formatCalendar(calendarId, calendarDisplay)
  )
}

function formatDateIso(
  calendarId: string,
  isoFields: IsoDateFields,
  calendarDisplay: CalendarDisplay,
): string {
  return (
    formatIsoDateFields(isoFields) + formatCalendar(calendarId, calendarDisplay)
  )
}

function formatDateLikeIso(
  calendarId: string,
  formatSimple: (isoFields: IsoDateFields) => string,
  isoFields: IsoDateFields,
  calendarDisplay: CalendarDisplay,
) {
  const showCalendar =
    calendarDisplay > CalendarDisplay.Never || // critical or always
    (calendarDisplay === CalendarDisplay.Auto && calendarId !== isoCalendarId)

  if (calendarDisplay === CalendarDisplay.Never) {
    if (calendarId === isoCalendarId) {
      return formatSimple(isoFields)
    }
    return formatIsoDateFields(isoFields)
  }

  if (showCalendar) {
    return (
      formatIsoDateFields(isoFields) +
      formatCalendarId(calendarId, calendarDisplay === CalendarDisplay.Critical)
    )
  }

  return formatSimple(isoFields)
}

function formatTimeIso(
  fields: IsoTimeFields,
  roundingMode: RoundingMode,
  nanoInc: number,
  subsecDigits: SubsecDigits | -1 | undefined,
): string {
  return formatIsoTimeFields(
    roundTimeToNano(fields, nanoInc, roundingMode)[0],
    subsecDigits,
  )
}

function formatDurationSlots(
  durationSlots: DurationSlots,
  subsecDigits: SubsecDigits | undefined,
): string {
  const { sign } = durationSlots
  const abs = sign === -1 ? negateDurationFields(durationSlots) : durationSlots
  const { hours, minutes } = abs

  const secondParts = divModBigNano(
    durationFieldsToBigNano(abs, Unit.Second),
    nanoInSec,
    divModTrunc,
  )
  // Avoid tuple destructuring; it observes Array.prototype[Symbol.iterator].
  const wholeSec = secondParts[0]
  const subsecNano = secondParts[1]
  checkDurationTimeUnit(wholeSec)

  const subsecNanoString = formatSubsecNano(subsecNano, subsecDigits)
  const forceSec =
    // a numeric subsecDigits specified?
    // allow `undefined` in comparison - will evaluate to false
    (subsecDigits as number) >= 0 ||
    // completely empty? display 'PT0S'
    !sign ||
    // subseconds require seconds to be displayed
    subsecNanoString

  return (
    (sign < 0 ? '-' : '') +
    'P' +
    formatDurationFragments({
      'Y': formatDurationNumber(abs.years),
      'M': formatDurationNumber(abs.months),
      'W': formatDurationNumber(abs.weeks),
      'D': formatDurationNumber(abs.days),
    }) +
    (hours || minutes || wholeSec || forceSec
      ? 'T' +
        formatDurationFragments({
          'H': formatDurationNumber(hours),
          'M': formatDurationNumber(minutes),
          'S': formatDurationNumber(wholeSec, forceSec) + subsecNanoString,
        })
      : '')
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

// Low-Level (Rounding already happened. Just fields)
// -----------------------------------------------------------------------------

function formatIsoDateTimeFields(
  isoDateTimeFields: IsoDateTimeFields,
  subsecDigits: SubsecDigits | -1 | undefined,
) {
  return (
    formatIsoDateFields(isoDateTimeFields) +
    'T' +
    formatIsoTimeFields(isoDateTimeFields, subsecDigits)
  )
}

function formatIsoDateFields(isoDateFields: IsoDateFields): string {
  return (
    formatIsoYearMonthFields(isoDateFields) +
    '-' +
    padNumber2(isoDateFields.isoDay)
  )
}

function formatIsoYearMonthFields(isoDateFields: IsoDateFields): string {
  const { isoYear } = isoDateFields
  return (
    (isoYear < 0 || isoYear > 9999
      ? getSignStr(isoYear) + padNumber(6, Math.abs(isoYear))
      : padNumber(4, isoYear)) +
    '-' +
    padNumber2(isoDateFields.isoMonth)
  )
}

function formatIsoMonthDayFields(isoDateFields: IsoDateFields): string {
  return (
    padNumber2(isoDateFields.isoMonth) + '-' + padNumber2(isoDateFields.isoDay)
  )
}

function formatIsoTimeFields(
  isoTimeFields: IsoTimeFields,
  subsecDigits: SubsecDigits | -1 | undefined,
): string {
  const parts = [
    padNumber2(isoTimeFields.isoHour),
    padNumber2(isoTimeFields.isoMinute),
  ]

  if (subsecDigits !== -1) {
    // show seconds?
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

  const hourParts = divModFloor(Math.abs(offsetNano), nanoInHour)
  // Avoid tuple destructuring; it observes Array.prototype[Symbol.iterator].
  const hour = hourParts[0]
  const nanoRemainder0 = hourParts[1]
  const minuteParts = divModFloor(nanoRemainder0, nanoInMinute)
  const minute = minuteParts[0]
  const nanoRemainder1 = minuteParts[1]
  const secondParts = divModFloor(nanoRemainder1, nanoInSec)
  const second = secondParts[0]
  const nanoRemainder2 = secondParts[1]

  return (
    getSignStr(offsetNano) +
    padNumber2(hour) +
    ':' +
    padNumber2(minute) +
    (second || nanoRemainder2
      ? ':' + padNumber2(second) + formatSubsecNano(nanoRemainder2)
      : '')
  )
}

// TimeZone / Calendar
// -----------------------------------------------------------------------------

function formatTimeZone(
  timeZoneId: string,
  timeZoneDisplay: TimeZoneDisplay,
): string {
  if (timeZoneDisplay !== TimeZoneDisplay.Never) {
    return (
      '[' +
      (timeZoneDisplay === TimeZoneDisplay.Critical ? '!' : '') +
      timeZoneId +
      ']'
    )
  }
  return ''
}

function formatCalendar(
  calendarId: string,
  calendarDisplay: CalendarDisplay,
): string {
  if (calendarDisplay !== CalendarDisplay.Never) {
    if (
      calendarDisplay > CalendarDisplay.Never || // critical or always
      (calendarDisplay === CalendarDisplay.Auto && calendarId !== isoCalendarId)
    ) {
      return formatCalendarId(
        calendarId,
        calendarDisplay === CalendarDisplay.Critical,
      )
    }
  }

  return ''
}

function formatCalendarId(calendarId: string, isCritical: boolean): string {
  return '[' + (isCritical ? '!' : '') + 'u-ca=' + calendarId + ']'
}

// Utils
// -----------------------------------------------------------------------------

function formatSubsec(
  isoMillisecond: number,
  isoMicrosecond: number,
  isoNanosecond: number,
  subsecDigits: SubsecDigits | undefined,
): string {
  return formatSubsecNano(
    isoMillisecond * nanoInMilli + isoMicrosecond * nanoInMicro + isoNanosecond,
    subsecDigits,
  )
}

const trailingZerosRE = /0+$/

function formatSubsecNano(
  totalNano: number,
  subsecDigits?: SubsecDigits,
): string {
  let s = padNumber(9, totalNano)

  s =
    subsecDigits === undefined
      ? s.replace(trailingZerosRE, '')
      : s.slice(0, subsecDigits)

  return s ? '.' + s : ''
}

function getSignStr(num: number): string {
  return num < 0 ? '-' : '+'
}

/*
Only accepts non-negative numbers
*/
function formatDurationNumber(n: number, force?: any): string {
  if (!n && !force) {
    return ''
  }
  // avoid outputting scientific notation
  // https://stackoverflow.com/a/50978675/96342
  // Avoid inherited options from Object.prototype pollution.
  const options = Object.create(null)
  options.useGrouping = false
  return n.toLocaleString('fullwide', options)
}
