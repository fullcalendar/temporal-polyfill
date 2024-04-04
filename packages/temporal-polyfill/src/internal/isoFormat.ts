import { BigNano, divModBigNano } from './bigNano'
import { isoCalendarId } from './calendarConfig'
import {
  checkDurationTimeUnit,
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
  IdLike,
  InstantSlots,
  PlainDateSlots,
  PlainDateTimeSlots,
  PlainMonthDaySlots,
  PlainTimeSlots,
  PlainYearMonthSlots,
  ZonedDateTimeSlots,
  getId,
} from './slots'
import { epochNanoToIso } from './timeMath'
import { utcTimeZoneId } from './timeZoneConfig'
import { TimeZoneOffsetOps } from './timeZoneOps'
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

export function formatInstantIso<TA, T>(
  refineTimeZoneArg: (timeZoneArg: TA) => T,
  getTimeZoneOps: (timeSlotSlot: T) => TimeZoneOffsetOps,
  instantSlots: InstantSlots,
  options?: InstantDisplayOptions<TA>,
): string {
  const [timeZoneArg, roundingMode, nanoInc, subsecDigits] =
    refineInstantDisplayOptions(options)

  const providedTimeZone = timeZoneArg !== undefined
  const timeZoneOps = getTimeZoneOps(
    providedTimeZone ? refineTimeZoneArg(timeZoneArg) : (utcTimeZoneId as any),
  )

  return formatEpochNanoIso(
    providedTimeZone,
    timeZoneOps,
    instantSlots.epochNanoseconds,
    roundingMode,
    nanoInc,
    subsecDigits,
  )
}

export function formatZonedDateTimeIso<C extends IdLike, T extends IdLike>(
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOffsetOps,
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, T>,
  options?: ZonedDateTimeDisplayOptions,
): string {
  const [a, b, c, d, e, f] = refineZonedDateTimeDisplayOptions(options)
  return formatZonedEpochNanoIso(
    getTimeZoneOps,
    zonedDateTimeSlots0.calendar,
    zonedDateTimeSlots0.timeZone,
    zonedDateTimeSlots0.epochNanoseconds,
    // workaround for https://github.com/swc-project/swc/issues/8806
    a,
    b,
    c,
    d,
    e,
    f,
  )
}

export function formatPlainDateTimeIso<C extends IdLike>(
  plainDateTimeSlots0: PlainDateTimeSlots<C>,
  options?: DateTimeDisplayOptions,
): string {
  const [a, b, c, d] = refineDateTimeDisplayOptions(options)
  return formatDateTimeIso(
    plainDateTimeSlots0.calendar,
    plainDateTimeSlots0,
    // workaround for https://github.com/swc-project/swc/issues/8806
    a,
    b,
    c,
    d,
  )
}

export function formatPlainDateIso<C extends IdLike>(
  plainDateSlots: PlainDateSlots<C>,
  options?: CalendarDisplayOptions,
): string {
  return formatDateIso(
    plainDateSlots.calendar,
    plainDateSlots,
    refineDateDisplayOptions(options),
  )
}

export function formatPlainYearMonthIso<C extends IdLike>(
  plainYearMonthSlots: PlainYearMonthSlots<C>,
  options?: CalendarDisplayOptions,
): string {
  return formatDateLikeIso(
    plainYearMonthSlots.calendar,
    formatIsoYearMonthFields,
    plainYearMonthSlots,
    refineDateDisplayOptions(options),
  )
}

export function formatPlainMonthDayIso<C extends IdLike>(
  plainMonthDaySlots: PlainMonthDaySlots<C>,
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
  const [a, b, c] = refineTimeDisplayOptions(options)
  return formatTimeIso(
    slots,
    // workaround for https://github.com/swc-project/swc/issues/8806
    a,
    b,
    c,
  )
}

export function formatDurationIso(
  slots: DurationSlots,
  options?: TimeDisplayOptions,
): string {
  const [roundingMode, nanoInc, subsecDigits] = refineTimeDisplayOptions(
    options,
    Unit.Second,
  )

  // for performance AND for not losing precision when no rounding
  if (nanoInc > 1) {
    slots = {
      ...slots,
      ...roundDayTimeDurationByInc(slots, nanoInc, roundingMode),
    }
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
  timeZoneOps: TimeZoneOffsetOps,
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

  const offsetNano = timeZoneOps.getOffsetNanosecondsFor(epochNano)
  const isoFields = epochNanoToIso(epochNano, offsetNano)

  return (
    formatIsoDateTimeFields(isoFields, subsecDigits) +
    (providedTimeZone ? formatOffsetNano(roundToMinute(offsetNano)) : 'Z')
  )
}

function formatZonedEpochNanoIso<T extends IdLike>(
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOffsetOps,
  calendarSlot: IdLike,
  timeZoneSlot: T,
  epochNano: BigNano,
  calendarDisplay: CalendarDisplay,
  timeZoneDisplay: TimeZoneDisplay,
  offsetDisplay: OffsetDisplay,
  roundingMode: RoundingMode,
  nanoInc: number,
  subsecDigits: SubsecDigits | -1 | undefined,
): string {
  epochNano = roundBigNanoByInc(epochNano, nanoInc, roundingMode, true)
  const timeZoneOps = getTimeZoneOps(timeZoneSlot)
  const offsetNano = timeZoneOps.getOffsetNanosecondsFor(epochNano)
  const isoFields = epochNanoToIso(epochNano, offsetNano)

  return (
    formatIsoDateTimeFields(isoFields, subsecDigits) +
    formatOffsetNano(roundToMinute(offsetNano), offsetDisplay) +
    formatTimeZone(timeZoneSlot, timeZoneDisplay) +
    formatCalendar(calendarSlot, calendarDisplay)
  )
}

function formatDateTimeIso(
  calendarIdLike: IdLike,
  isoFields: IsoDateTimeFields,
  calendarDisplay: CalendarDisplay,
  roundingMode: RoundingMode,
  nanoInc: number,
  subsecDigits: SubsecDigits | -1 | undefined,
): string {
  const roundedIsoFields = roundDateTimeToNano(isoFields, nanoInc, roundingMode)

  return (
    formatIsoDateTimeFields(roundedIsoFields, subsecDigits) +
    formatCalendar(calendarIdLike, calendarDisplay)
  )
}

function formatDateIso(
  calendarIdLike: IdLike,
  isoFields: IsoDateFields,
  calendarDisplay: CalendarDisplay,
): string {
  return (
    formatIsoDateFields(isoFields) +
    formatCalendar(calendarIdLike, calendarDisplay)
  )
}

function formatDateLikeIso(
  calendarIdLike: IdLike,
  formatSimple: (isoFields: IsoDateFields) => string,
  isoFields: IsoDateFields,
  calendarDisplay: CalendarDisplay,
) {
  const calendarId = getId(calendarIdLike)
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

  const [wholeSec, subsecNano] = divModBigNano(
    durationFieldsToBigNano(abs, Unit.Second),
    nanoInSec,
    divModTrunc,
  )
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

  const [hour, nanoRemainder0] = divModFloor(Math.abs(offsetNano), nanoInHour)
  const [minute, nanoRemainder1] = divModFloor(nanoRemainder0, nanoInMinute)
  const [second, nanoRemainder2] = divModFloor(nanoRemainder1, nanoInSec)

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
  timeZoneNative: IdLike,
  timeZoneDisplay: TimeZoneDisplay,
): string {
  if (timeZoneDisplay !== TimeZoneDisplay.Never) {
    return (
      '[' +
      (timeZoneDisplay === TimeZoneDisplay.Critical ? '!' : '') +
      getId(timeZoneNative) +
      ']'
    )
  }
  return ''
}

function formatCalendar(
  calendarIdLike: IdLike,
  calendarDisplay: CalendarDisplay,
): string {
  if (calendarDisplay !== CalendarDisplay.Never) {
    const calendarId = getId(calendarIdLike)

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
  return n.toLocaleString('fullwide', { useGrouping: false })
}
