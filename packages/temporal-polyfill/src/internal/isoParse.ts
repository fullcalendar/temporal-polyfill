import { unitNanoMap, nanoInSec, nanoInUtcDay } from './units'
import { isoCalendarId } from './calendarConfig'
import {
  DurationFields,
  durationFieldNamesAsc,
} from './durationFields'
import { negateDurationFields } from './durationMath'
import {
  IsoDateFields,
  IsoDateTimeFields,
  IsoTimeFields,
} from './isoFields'
import {
  constrainIsoTimeFields,
  checkIsoDateFields,
  checkIsoDateTimeFields,
  isIsoDateFieldsValid,
  isoEpochFirstLeapYear,
} from './isoMath'
import {
  checkIsoDateInBounds,
  checkIsoDateTimeInBounds,
  checkIsoYearMonthInBounds, isoToEpochNanoWithOffset,
  nanoToIsoTimeAndDay
} from './timeMath'
import { EpochDisambig, OffsetDisambig, Overflow } from './options'
import { resolveTimeZoneId, queryNativeTimeZone, FixedTimeZone } from './timeZoneNative'
import { getMatchingInstantFor, validateTimeZoneOffset } from './timeZoneOps'
import {
  TimeUnit,
  Unit,
  nanoInHour,
  nanoInMinute,
  nanoToGivenFields,
} from './units'
import { divModFloor, zipProps } from './utils'
import { utcTimeZoneId } from './timeZoneNative'
import { NativeMonthDayParseOps, NativeYearMonthParseOps } from './calendarNative'
import { moveToMonthStart } from './move'
import { ZonedFieldOptions, refineZonedFieldOptions } from './optionsRefine'
import { DateSlots, DurationBranding, DurationSlots, InstantBranding, InstantSlots, PlainDateBranding, PlainDateSlots, PlainDateTimeBranding, PlainDateTimeSlots, PlainMonthDayBranding, PlainMonthDaySlots, PlainTimeBranding, PlainTimeSlots, PlainYearMonthBranding, PlainYearMonthSlots, ZonedDateTimeBranding, ZonedDateTimeSlots, ZonedEpochSlots, createDurationSlots, createInstantSlots, createPlainDateTimeSlots, createPlainDateSlots, createPlainMonthDaySlots, createPlainTimeSlots, createPlainYearMonthSlots, createZonedDateTimeSlots } from './slots'
import { requireString, toStringViaPrimitive } from './cast'
import { realizeCalendarId } from './calendarNativeQuery'
import * as errorMessages from './errorMessages'

// High-level
// -------------------------------------------------------------------------------------------------

export function parseInstant(s: string): InstantSlots {
  // instead of 'requiring' like other types,
  // coerce, because there's no fromFields, so no need to differentiate param type
  s = toStringViaPrimitive(s)

  const organized = parseDateTimeLike(s)
  if (!organized) {
    throw new RangeError(errorMessages.failedParse(s))
  }

  let offsetNano

  if (organized.hasZ) {
    offsetNano = 0
  } else if (organized.offset) {
    offsetNano = parseOffsetNano(organized.offset)
  } else {
    throw new RangeError(errorMessages.failedParse(s))
  }

  // validate timezone
  if (organized.timeZone) {
    parseOffsetNanoMaybe(organized.timeZone, true) // onlyHourMinute=true
  }

  const epochNanoseconds = isoToEpochNanoWithOffset(
    checkIsoDateTimeFields(organized),
    offsetNano,
  )

  return createInstantSlots(epochNanoseconds)
}

export function parseZonedOrPlainDateTime(s: string): (
  DateSlots<string> |
  ZonedEpochSlots<string, string>
) {
  const organized = parseDateTimeLike(requireString(s))

  if (!organized) {
    throw new RangeError(errorMessages.failedParse(s))
  }
  if (organized.timeZone) {
    return finalizeZonedDateTime(
      organized as ZonedDateTimeOrganized,
      organized.offset ? parseOffsetNano(organized.offset) : undefined,
    )
  }
  if (organized.hasZ) {
    // PlainDate doesn't support Z
    throw new RangeError(errorMessages.failedParse(s))
  }

  return finalizeDate(organized)
}

export function parseZonedDateTime(
  s: string,
  options?: ZonedFieldOptions,
): ZonedDateTimeSlots<string, string> {
  const organized = parseDateTimeLike(requireString(s))

  if (!organized || !organized.timeZone) {
    throw new RangeError(errorMessages.failedParse(s))
  }

  const { offset } = organized
  const offsetNano = offset ? parseOffsetNano(offset) : undefined
  const [, offsetDisambig, epochDisambig] = refineZonedFieldOptions(options)

  return finalizeZonedDateTime(
    organized as ZonedDateTimeOrganized,
    offsetNano, // HACK
    offsetDisambig,
    epochDisambig,
  )
}

/*
`s` already validated as a string
*/
export function parseOffsetNano(s: string): number {
  const offsetNano = parseOffsetNanoMaybe(s)
  if (offsetNano === undefined) {
    throw new RangeError(errorMessages.failedParse(s)) // Invalid offset string
  }
  return offsetNano
}

export function parsePlainDateTime(s: string): PlainDateTimeSlots<string> {
  const organized = parseDateTimeLike(requireString(s))

  if (!organized || organized.hasZ) {
    throw new RangeError(errorMessages.failedParse(s))
  }

  return createPlainDateTimeSlots(
    finalizeDateTime(organized),
  )
}

export function parsePlainDate(s: string): PlainDateSlots<string> {
  const organized = parseDateTimeLike(requireString(s))

  if (!organized || organized.hasZ) {
    throw new RangeError(errorMessages.failedParse(s))
  }

  return createPlainDateSlots(
    organized.hasTime
      ? finalizeDateTime(organized)
      : finalizeDate(organized)
  )
}

export function parsePlainYearMonth(
  getCalendarOps: (calendarId: string) => NativeYearMonthParseOps,
  s: string,
): PlainYearMonthSlots<string> {
  const organized = parseYearMonthOnly(requireString(s))

  if (organized) {
    requireIsoCalendar(organized)
    return createPlainYearMonthSlots(
      checkIsoYearMonthInBounds(checkIsoDateFields(organized)),
    )
  }

  const isoFields = parsePlainDate(s)
  const calendarOps = getCalendarOps(isoFields.calendar)
  const movedIsoFields = moveToMonthStart(calendarOps, isoFields)

  return createPlainYearMonthSlots({
    ...isoFields, // has calendar
    ...movedIsoFields,
  })
}

function requireIsoCalendar(organized: { calendar: string }): void {
  if (organized.calendar !== isoCalendarId) {
    throw new RangeError(errorMessages.invalidSubstring(organized.calendar))
  }
}

export function parsePlainMonthDay(
  getCalendarOps: (calendarId: string) => NativeMonthDayParseOps,
  s: string,
): PlainMonthDaySlots<string> {
  const organized = parseMonthDayOnly(requireString(s))

  if (organized) {
    requireIsoCalendar(organized)

    return createPlainMonthDaySlots(
      checkIsoDateFields(organized), // `organized` has isoEpochFirstLeapYear
    )
  }

  const dateSlots = parsePlainDate(s)
  const { calendar } = dateSlots
  const calendarOps = getCalendarOps(calendar)

  // normalize year&month to be as close as possible to epoch
  const [origYear, origMonth, day] = calendarOps.dateParts(dateSlots)
  const [monthCodeNumber, isLeapMonth] = calendarOps.monthCodeParts(origYear, origMonth)
  const [year, month] = calendarOps.yearMonthForMonthDay(monthCodeNumber, isLeapMonth, day)! // !HACK
  const isoFields = calendarOps.isoFields(year, month, day)

  return createPlainMonthDaySlots(isoFields, calendar)
}

export function parsePlainTime(s: string): PlainTimeSlots {
  let organized: IsoTimeFields | DateTimeLikeOrganized | undefined = parseTimeOnly(requireString(s))

  if (!organized) {
    organized = parseDateTimeLike(s)

    if (organized) {
      if (!(organized as DateTimeLikeOrganized).hasTime) {
        throw new RangeError(errorMessages.failedParse(s)) // Must have time for PlainTime
      }
      if ((organized as DateTimeLikeOrganized).hasZ) {
        throw new RangeError(errorMessages.invalidSubstring('Z')) // Cannot have Z for PlainTime
      }
      requireIsoCalendar(organized as DateTimeLikeOrganized)
    } else {
      throw new RangeError(errorMessages.failedParse(s))
    }
  }

  let altParsed: DateOrganized | undefined
  if ((altParsed = parseYearMonthOnly(s)) && isIsoDateFieldsValid(altParsed)) {
    throw new RangeError(errorMessages.failedParse(s))
  }
  if ((altParsed = parseMonthDayOnly(s)) && isIsoDateFieldsValid(altParsed)) {
    throw new RangeError(errorMessages.failedParse(s))
  }

  return createPlainTimeSlots(constrainIsoTimeFields(organized, Overflow.Reject))
}

export function parseDuration(s: string): DurationSlots {
  const parsed = parseDurationFields(requireString(s))
  if (!parsed) {
    throw new RangeError(errorMessages.failedParse(s))
  }
  return createDurationSlots(parsed)
}

export function parseCalendarId(s: string): string {
  const res = parseDateTimeLike(s) || parseYearMonthOnly(s) || parseMonthDayOnly(s)
  return res ? res.calendar : s
}

export function parseTimeZoneId(s: string): string {
  const parsed = parseDateTimeLike(s)
  return parsed && (
    parsed.timeZone ||
    (parsed.hasZ && utcTimeZoneId) ||
    parsed.offset
  ) || s
}

// Finalizing 'organized' structs to slots
// -------------------------------------------------------------------------------------------------

/*
Unlike others, return slots
*/
function finalizeZonedDateTime(
  organized: ZonedDateTimeOrganized,
  offsetNano: number | undefined,
  offsetDisambig: OffsetDisambig = OffsetDisambig.Reject,
  epochDisambig: EpochDisambig = EpochDisambig.Compat,
): ZonedDateTimeSlots<string, string> {
  const slotId = resolveTimeZoneId(organized.timeZone)
  const timeZoneImpl = queryNativeTimeZone(slotId)

  const epochNanoseconds = getMatchingInstantFor(
    timeZoneImpl,
    checkIsoDateTimeFields(organized),
    offsetNano,
    offsetDisambig,
    epochDisambig,
    !(timeZoneImpl as FixedTimeZone).offsetNano, // not fixed? epochFuzzy
    organized.hasZ,
  )

  return createZonedDateTimeSlots(
    epochNanoseconds,
    slotId,
    realizeCalendarId(organized.calendar),
  )
}

function finalizeDateTime(organized: DateTimeLikeOrganized): IsoDateTimeFields & { calendar: string } {
  return realizeCalendarSlot(checkIsoDateTimeInBounds(checkIsoDateTimeFields(organized)))
}

function finalizeDate(organized: DateOrganized): DateSlots<string> {
  return realizeCalendarSlot(checkIsoDateInBounds(checkIsoDateFields(organized)))
}

function realizeCalendarSlot<T extends { calendar: string }>(organized: T): T {
  return {
    ...organized,
    calendar: realizeCalendarId(organized.calendar),
  }
}

// RegExp
// -------------------------------------------------------------------------------------------------

const signRegExpStr = '([+\u2212-])' // outer captures
const fractionRegExpStr = '(?:[.,](\\d{1,9}))?' // only afterDecimal captures

const yearMonthRegExpStr =
  `(?:(?:${signRegExpStr}(\\d{6}))|(\\d{4}))` + // 1:yearSign, 2:yearDigits6, 3:yearDigits4
  '-?(\\d{2})' // 4:month

const dateRegExpStr =
  yearMonthRegExpStr + // 1:yearSign, 2:yearDigits6, 3:yearDigits4, 4:month
  '-?(\\d{2})' // 5:day

const monthDayRegExpStr =
  '(?:--)?(\\d{2})' + // 1:month
  '-?(\\d{2})' // 2:day

const timeRegExpStr =
  '(\\d{2})' + // 1:hour
  '(?::?(\\d{2})' + // 2:minute
  '(?::?(\\d{2})' + // 3:second
  fractionRegExpStr + // 4:afterDecimal
  ')?' +
  ')?'

const offsetRegExpStr =
  signRegExpStr + // 1:offsetSign
  timeRegExpStr // 2:hour, 3:minute, 4:second, 5:afterDecimal

const dateTimeRegExpStr =
  dateRegExpStr + // // 1:yearSign, 2:yearDigits6, 3:yearDigits4, 4:month, 5:day
  '(?:[T ]' +
  timeRegExpStr + // 6:hour, 7:minute, 8:second, 9:afterDecimal
  '(Z|' + // 10:zOrOffset
  offsetRegExpStr + // 11:offsetSign, 12:hour, 13:minute, 14:second, 15:afterDecimal
  ')?' +
  ')?'

const annotationRegExpStr = '\\[(!?)([^\\]]*)\\]' // critical:1, annotation:2
const annotationsRegExpStr = `((?:${annotationRegExpStr})*)` // multiple

const yearMonthRegExp = createRegExp(yearMonthRegExpStr + annotationsRegExpStr)
const monthDayRegExp = createRegExp(monthDayRegExpStr + annotationsRegExpStr)
const dateTimeRegExp = createRegExp(dateTimeRegExpStr + annotationsRegExpStr)
const timeRegExp = createRegExp(
  'T?' +
  timeRegExpStr + // 1-4
  '(?:' + offsetRegExpStr + ')?' + // 5-9
  annotationsRegExpStr, // 10
)
const offsetRegExp = createRegExp(offsetRegExpStr)
const annotationRegExp = new RegExp(annotationRegExpStr, 'g')

const durationRegExp = createRegExp(
  `${signRegExpStr}?P` + // 1:sign
  '(\\d+Y)?' + // 2:years
  '(\\d+M)?' + // 3:months
  '(\\d+W)?' + // 4:weeks
  '(\\d+D)?' + // 5:days
  '(?:T' +
  `(?:(\\d+)${fractionRegExpStr}H)?` + // 6:hours, 7:partialHour
  `(?:(\\d+)${fractionRegExpStr}M)?` + // 8:minutes, 9:partialMinute
  `(?:(\\d+)${fractionRegExpStr}S)?` + // 10:seconds, 11:partialSecond
  ')?',
)

// Maybe-parsing
// -------------------------------------------------------------------------------------------------

function parseDateTimeLike(s: string): DateTimeLikeOrganized | undefined {
  const parts = dateTimeRegExp.exec(s)
  return parts ? organizeDateTimeLikeParts(parts) : undefined
}

function parseYearMonthOnly(s: string): DateOrganized | undefined {
  const parts = yearMonthRegExp.exec(s)
  return parts ? organizeYearMonthParts(parts) : undefined
}

function parseMonthDayOnly(s: string): DateOrganized | undefined {
  const parts = monthDayRegExp.exec(s)
  return parts ? organizeMonthDayParts(parts) : undefined
}

function parseTimeOnly(s: string): IsoTimeFields | undefined {
  const parts = timeRegExp.exec(s)
  return parts
    ? (organizeAnnotationParts(parts[10]), organizeTimeParts(parts)) // validate annotations
    : undefined
}

function parseDurationFields(s: string): DurationFields | undefined {
  const parts = durationRegExp.exec(s)
  return parts ? organizeDurationParts(parts) : undefined
}

export function parseOffsetNanoMaybe(s: string, onlyHourMinute?: boolean): number | undefined {
  const parts = offsetRegExp.exec(s)
  return parts ? organizeOffsetParts(parts, onlyHourMinute) : undefined
}

// Parts Organization
// -------------------------------------------------------------------------------------------------

type DateTimeLikeOrganized = IsoDateTimeFields & {
  hasTime: boolean
  hasZ: boolean
  offset: string | undefined
  calendar: string
  timeZone: string | undefined
}

type ZonedDateTimeOrganized = IsoDateTimeFields & {
  hasTime: boolean
  hasZ: boolean
  offset: string | undefined
  calendar: string
  timeZone: string
}

type WithCalendarStr = { calendar: string }
type DateOrganized = IsoDateFields & WithCalendarStr

function organizeDateTimeLikeParts(parts: string[]): DateTimeLikeOrganized {
  const zOrOffset = parts[10]
  const hasZ = (zOrOffset || '').toUpperCase() === 'Z'

  return {
    isoYear: organizeIsoYearParts(parts),
    isoMonth: parseInt(parts[4]),
    isoDay: parseInt(parts[5]),
    ...organizeTimeParts(parts.slice(5)), // slice one index before, to similate 0 being whole-match
    ...organizeAnnotationParts(parts[16]),
    hasTime: Boolean(parts[6]),
    hasZ,
    // TODO: figure out a way to pre-process into a number
    // (problems with TimeZone needing the full string?)
    offset: hasZ ? undefined : zOrOffset,
  }
}

/*
Result assumed to be ISO
*/
function organizeYearMonthParts(parts: string[]): DateSlots<string> {
  return {
    isoYear: organizeIsoYearParts(parts),
    isoMonth: parseInt(parts[4]),
    isoDay: 1,
    ...organizeAnnotationParts(parts[5]),
  }
}

function organizeMonthDayParts(parts: string[]): DateSlots<string> {
  return {
    isoYear: isoEpochFirstLeapYear,
    isoMonth: parseInt(parts[1]),
    isoDay: parseInt(parts[2]),
    ...organizeAnnotationParts(parts[3]),
  }
}

function organizeIsoYearParts(parts: string[]): number {
  const yearSign = parseSign(parts[1])
  const year = parseInt(parts[2] || parts[3])

  if (yearSign < 0 && !year) {
    throw new RangeError(errorMessages.invalidSubstring(-0 as unknown as string))
  }

  return yearSign * year
}

function organizeTimeParts(parts: string[]): IsoTimeFields {
  const isoSecond = parseInt0(parts[3])

  return {
    ...nanoToIsoTimeAndDay(parseSubsecNano(parts[4] || ''))[0],
    isoHour: parseInt0(parts[1]),
    isoMinute: parseInt0(parts[2]),
    isoSecond: isoSecond === 60 ? 59 : isoSecond, // massage leap-second
  }
}

function organizeOffsetParts(parts: string[], onlyHourMinute?: boolean): number {
  const firstSubMinutePart = parts[4] || parts[5]

  if (onlyHourMinute && firstSubMinutePart) {
    throw new RangeError(errorMessages.invalidSubstring(firstSubMinutePart))
  }

  const offsetNanoPos = (
    parseInt0(parts[2]) * nanoInHour +
    parseInt0(parts[3]) * nanoInMinute +
    parseInt0(parts[4]) * nanoInSec +
    parseSubsecNano(parts[5] || '')
  )

  return validateTimeZoneOffset(
    offsetNanoPos * parseSign(parts[1])
  )
}

function organizeDurationParts(parts: string[]): DurationFields {
  let hasAny = false
  let hasAnyFrac = false
  let leftoverNano = 0
  let durationFields = {
    ...zipProps(durationFieldNamesAsc, [
      parseUnit(parts[2]),
      parseUnit(parts[3]),
      parseUnit(parts[4]),
      parseUnit(parts[5]),
      parseUnit(parts[6], parts[7], Unit.Hour),
      parseUnit(parts[8], parts[9], Unit.Minute),
      parseUnit(parts[10], parts[11], Unit.Second),
    ]),
    ...nanoToGivenFields(leftoverNano, Unit.Millisecond, durationFieldNamesAsc),
  } as DurationFields

  if (!hasAny) {
    throw new RangeError(errorMessages.noValidFields)
  }

  if (parseSign(parts[1]) < 0) {
    durationFields = negateDurationFields(durationFields)
  }

  return durationFields

  function parseUnit(wholeStr: string): number
  function parseUnit(wholeStr: string, fracStr: string, timeUnit: TimeUnit): number
  function parseUnit(wholeStr: string, fracStr?: string, timeUnit?: TimeUnit): number {
    let leftoverUnits = 0 // from previous round
    let wholeUnits = 0

    if (timeUnit) {
      [leftoverUnits, leftoverNano] = divModFloor(leftoverNano, unitNanoMap[timeUnit])
    }

    if (wholeStr !== undefined) {
      if (hasAnyFrac) {
        throw new RangeError(errorMessages.invalidSubstring(wholeStr)) // Fraction must be last one
      }

      wholeUnits = parseIntSafe(wholeStr)
      hasAny = true

      if (fracStr) {
        // convert seconds to other units
        // more precise version of `frac / nanoInSec * nanoInUnit`
        leftoverNano = parseSubsecNano(fracStr) * (unitNanoMap[timeUnit!] / nanoInSec)
        hasAnyFrac = true
      }
    }

    return leftoverUnits + wholeUnits
  }
}

// Annotations
// -------------------------------------------------------------------------------------------------

interface AnnotationsOrganized {
  calendar: string,
  timeZone: string | undefined,
}

function organizeAnnotationParts(s: string): AnnotationsOrganized {
  let calendarIsCritical: boolean | undefined
  let timeZoneId: string | undefined
  const calendarIds: string[] = []

  // iterate through matches
  s.replace(annotationRegExp, (whole, criticalStr, mainStr) => {
    const isCritical = Boolean(criticalStr)
    const [val, name] = mainStr.split('=').reverse() as [string, string?]

    if (!name) {
      if (timeZoneId) {
        throw new RangeError(errorMessages.invalidSubstring(whole)) // Cannot specify timeZone multiple times
      }
      timeZoneId = val
    } else if (name === 'u-ca') {
      calendarIds.push(val)
      calendarIsCritical ||= isCritical
    } else if (isCritical) {
      throw new RangeError(errorMessages.invalidSubstring(whole)) // Critical annotation not used
    }

    return ''
  })

  if (calendarIds.length > 1 && calendarIsCritical) {
    throw new RangeError(errorMessages.invalidSubstring(s)) // Multiple calendars when one is critical
  }

  return {
    timeZone: timeZoneId,
    calendar: calendarIds[0] || isoCalendarId,
  }
}

// Utils
// -------------------------------------------------------------------------------------------------

function parseSubsecNano(fracStr: string): number {
  return parseInt(fracStr.padEnd(9, '0'))
}

function createRegExp(meat: string): RegExp {
  return new RegExp(`^${meat}$`, 'i')
}

function parseSign(s: string | undefined): number {
  return !s || s === '+' ? 1 : -1
}

function parseInt0(s: string | undefined): number {
  return s === undefined ? 0 : parseInt(s)
}

/*
Guaranteed to be non-Infinity (which can happen if number beyond maxint I think)
Only needs to be called when we know RegExp allows infinite repeating character
*/
function parseIntSafe(s: string): number {
  const n = parseInt(s)

  if (!Number.isFinite(n)) {
    throw new RangeError(errorMessages.invalidSubstring(s))
  }

  return n
}
