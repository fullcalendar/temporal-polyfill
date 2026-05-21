import { bigNanoInSec } from './bigNano'
import {
  type CalendarSlot,
  getCalendarSlotId,
  isoCalendar,
} from './calendarSlot'
import { DurationFields } from './durationFields'
import {
  checkDurationTimeUnit,
  checkDurationUnits,
  durationFieldsToBigNano,
  negateDurationFields,
} from './durationMath'
import { epochNanoToIso } from './epochMath'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  TimeFields,
} from './fieldTypes'
import {
  refineDateDisplayOptions,
  refineDateTimeDisplayOptions,
  refineInstantDisplayOptions,
  refineTimeDisplayOptions,
  refineZonedDateTimeDisplayOptions,
} from './optionsDisplayRefine'
import {
  CalendarDisplay,
  CalendarDisplayOptions,
  DateTimeDisplayOptions,
  InstantDisplayOptions,
  OffsetDisplay,
  RoundingMode,
  SubsecDigits,
  TimeDisplayOptions,
  TimeZoneDisplay,
  ZonedDateTimeDisplayOptions,
} from './optionsModel'
import {
  roundBigNanoToDayOriginInc,
  roundDateTimeToNano,
  roundDayTimeDurationByInc,
  roundTimeToNano,
  roundToMinute,
} from './round'
import { EpochNanoFields, ZonedEpochNanoFields } from './slots'
import { TimeZone, queryTimeZone } from './timeZone'
import { utcTimeZoneId } from './timeZoneConfig'
import {
  Unit,
  nanoInHour,
  nanoInMicro,
  nanoInMilli,
  nanoInMinute,
  nanoInSec,
} from './units'
import { NumberSign, divModFloor, padNumber, padNumber2 } from './utils'

// High-level
// -----------------------------------------------------------------------------

export function formatInstantIso(
  refineTimeZoneString: (timeZoneString: string) => string, // to timeZoneId
  instantSlots: EpochNanoFields,
  options?: InstantDisplayOptions,
): string {
  const [timeZoneArg, roundingMode, nanoInc, subsecDigits] =
    refineInstantDisplayOptions(options)

  const providedTimeZone = timeZoneArg !== undefined
  const timeZone = queryTimeZone(
    providedTimeZone
      ? refineTimeZoneString(timeZoneArg)
      : (utcTimeZoneId as any),
  )

  return formatEpochNanoIso(
    providedTimeZone,
    timeZone,
    instantSlots.epochNanoseconds,
    roundingMode,
    nanoInc,
    subsecDigits,
  )
}

export function formatZonedDateTimeIso(
  zonedDateTimeSlots0: ZonedEpochNanoFields & { calendar: CalendarSlot },
  options?: ZonedDateTimeDisplayOptions,
): string {
  const displayOptions = refineZonedDateTimeDisplayOptions(options)
  return formatZonedEpochNanoIso(
    zonedDateTimeSlots0.calendar,
    zonedDateTimeSlots0.timeZone.id,
    zonedDateTimeSlots0.timeZone,
    zonedDateTimeSlots0.epochNanoseconds,
    ...displayOptions,
  )
}

export function formatPlainDateTimeIso(
  plainDateTimeSlots0: CalendarDateTimeFields & { calendar: CalendarSlot },
  options?: DateTimeDisplayOptions,
): string {
  const displayOptions = refineDateTimeDisplayOptions(options)
  return formatDateTimeIso(
    plainDateTimeSlots0.calendar,
    plainDateTimeSlots0,
    ...displayOptions,
  )
}

export function formatPlainDateIso(
  plainDateSlots: CalendarDateFields & { calendar: CalendarSlot },
  options?: CalendarDisplayOptions,
): string {
  return formatDateIso(
    plainDateSlots.calendar,
    plainDateSlots,
    refineDateDisplayOptions(options),
  )
}

export function formatPlainYearMonthIso(
  plainYearMonthSlots: CalendarDateFields & { calendar: CalendarSlot },
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
  plainMonthDaySlots: CalendarDateFields & { calendar: CalendarSlot },
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
  slots: TimeFields,
  options?: TimeDisplayOptions,
): string {
  const displayOptions = refineTimeDisplayOptions(options)
  return formatTimeIso(slots, ...displayOptions)
}

export function formatDurationIso(
  slots: DurationFields & { sign: NumberSign },
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
  timeZone: TimeZone,
  epochNano: bigint,
  roundingMode: RoundingMode,
  nanoInc: number,
  subsecDigits: SubsecDigits | -1 | undefined,
): string {
  epochNano = roundBigNanoToDayOriginInc(
    epochNano,
    BigInt(nanoInc),
    roundingMode,
  )

  const offsetNano = timeZone.getOffsetNanosecondsFor(epochNano)
  const isoDateTime = epochNanoToIso(epochNano, offsetNano)

  return (
    formatIsoDateTimeFields(isoDateTime, subsecDigits) +
    (providedTimeZone ? formatOffsetNano(roundToMinute(offsetNano)) : 'Z')
  )
}

function formatZonedEpochNanoIso(
  calendar: CalendarSlot,
  timeZoneId: string,
  timeZone: TimeZone,
  epochNano: bigint,
  calendarDisplay: CalendarDisplay,
  timeZoneDisplay: TimeZoneDisplay,
  offsetDisplay: OffsetDisplay,
  roundingMode: RoundingMode,
  nanoInc: number,
  subsecDigits: SubsecDigits | -1 | undefined,
): string {
  epochNano = roundBigNanoToDayOriginInc(
    epochNano,
    BigInt(nanoInc),
    roundingMode,
  )
  const offsetNano = timeZone.getOffsetNanosecondsFor(epochNano)
  const isoDateTime = epochNanoToIso(epochNano, offsetNano)

  return (
    formatIsoDateTimeFields(isoDateTime, subsecDigits) +
    formatOffsetNano(roundToMinute(offsetNano), offsetDisplay) +
    formatTimeZone(timeZoneId, timeZoneDisplay) +
    formatCalendar(calendar, calendarDisplay)
  )
}

function formatDateTimeIso(
  calendar: CalendarSlot,
  isoDateTime: CalendarDateTimeFields,
  calendarDisplay: CalendarDisplay,
  roundingMode: RoundingMode,
  nanoInc: number,
  subsecDigits: SubsecDigits | -1 | undefined,
): string {
  // Formatting rounds the complete PlainDateTime as one wall-clock value. Passing
  // a single record keeps the date and time fields from drifting apart across
  // midnight rounding.
  const roundedIsoFields = roundDateTimeToNano(
    isoDateTime,
    nanoInc,
    roundingMode,
  )

  return (
    formatIsoDateTimeFields(roundedIsoFields, subsecDigits) +
    formatCalendar(calendar, calendarDisplay)
  )
}

function formatDateIso(
  calendar: CalendarSlot,
  isoDate: CalendarDateFields,
  calendarDisplay: CalendarDisplay,
): string {
  return (
    formatIsoDateFields(isoDate) + formatCalendar(calendar, calendarDisplay)
  )
}

function formatDateLikeIso(
  calendar: CalendarSlot,
  formatSimple: (isoDate: CalendarDateFields) => string,
  isoDate: CalendarDateFields,
  calendarDisplay: CalendarDisplay,
) {
  const showCalendar =
    calendarDisplay > CalendarDisplay.Never || // critical or always
    (calendarDisplay === CalendarDisplay.Auto && calendar !== isoCalendar)

  if (calendarDisplay === CalendarDisplay.Never) {
    if (calendar === isoCalendar) {
      return formatSimple(isoDate)
    }
    return formatIsoDateFields(isoDate)
  }

  if (showCalendar) {
    return (
      formatIsoDateFields(isoDate) +
      formatCalendarId(
        getCalendarSlotId(calendar),
        calendarDisplay === CalendarDisplay.Critical,
      )
    )
  }

  return formatSimple(isoDate)
}

function formatTimeIso(
  fields: TimeFields,
  roundingMode: RoundingMode,
  nanoInc: number,
  subsecDigits: SubsecDigits | -1 | undefined,
): string {
  return formatTimeFields(
    roundTimeToNano(fields, nanoInc, roundingMode)[0],
    subsecDigits,
  )
}

function formatDurationSlots(
  durationSlots: DurationFields & { sign: NumberSign },
  subsecDigits: SubsecDigits | undefined,
): string {
  const { sign } = durationSlots
  const abs = sign === -1 ? negateDurationFields(durationSlots) : durationSlots
  const { hours, minutes } = abs

  const bigNano = durationFieldsToBigNano(abs, Unit.Second)
  const wholeSec = Number(bigNano / bigNanoInSec)
  const subsecNano = Number(bigNano % bigNanoInSec)
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
  isoDateTime: CalendarDateTimeFields,
  subsecDigits: SubsecDigits | -1 | undefined,
) {
  return (
    formatIsoDateFields(isoDateTime) +
    'T' +
    formatTimeFields(isoDateTime, subsecDigits)
  )
}

function formatIsoDateFields(isoDateFields: CalendarDateFields): string {
  return (
    formatIsoYearMonthFields(isoDateFields) +
    '-' +
    padNumber2(isoDateFields.day)
  )
}

function formatIsoYearMonthFields(isoDateFields: CalendarDateFields): string {
  const { year } = isoDateFields
  return (
    (year < 0 || year > 9999
      ? getSignStr(year) + padNumber(6, Math.abs(year))
      : padNumber(4, year)) +
    '-' +
    padNumber2(isoDateFields.month)
  )
}

function formatIsoMonthDayFields(isoDateFields: CalendarDateFields): string {
  return padNumber2(isoDateFields.month) + '-' + padNumber2(isoDateFields.day)
}

function formatTimeFields(
  timeFields: TimeFields,
  subsecDigits: SubsecDigits | -1 | undefined,
): string {
  const parts = [padNumber2(timeFields.hour), padNumber2(timeFields.minute)]

  if (subsecDigits !== -1) {
    // show seconds?
    parts.push(
      padNumber2(timeFields.second) +
        formatSubsec(
          timeFields.millisecond,
          timeFields.microsecond,
          timeFields.nanosecond,
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
  calendar: CalendarSlot,
  calendarDisplay: CalendarDisplay,
): string {
  if (
    calendarDisplay > CalendarDisplay.Never || // critical or always
    (calendarDisplay === CalendarDisplay.Auto && calendar !== isoCalendar)
  ) {
    return formatCalendarId(
      getCalendarSlotId(calendar),
      calendarDisplay === CalendarDisplay.Critical,
    )
  }

  return ''
}

function formatCalendarId(calendarId: string, isCritical: boolean): string {
  return '[' + (isCritical ? '!' : '') + 'u-ca=' + calendarId + ']'
}

// Utils
// -----------------------------------------------------------------------------

function formatSubsec(
  millisecond: number,
  microsecond: number,
  nanosecond: number,
  subsecDigits: SubsecDigits | undefined,
): string {
  return formatSubsecNano(
    millisecond * nanoInMilli + microsecond * nanoInMicro + nanosecond,
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
