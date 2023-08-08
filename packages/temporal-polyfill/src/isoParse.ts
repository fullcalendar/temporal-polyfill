import { unitNanoMap, nanoInSec } from './units'
import { isoCalendarId } from './calendarConfig'
import { CalendarImpl, queryCalendarImpl } from './calendarImpl'
import {
  DurationFields,
  DurationInternals,
  durationFieldNamesAsc,
  negateDurationFields,
  updateDurationFieldsSign,
} from './durationFields'
import { IsoTimeFields, isoTimeFieldDefaults, constrainIsoTimeFields } from './isoFields'
import {
  IsoDateInternals,
  IsoDateTimeInternals,
  constrainIsoDateInternals,
  constrainIsoDateTimeInternals,
} from './isoInternals'
import {
  checkIsoInBounds,
  isoToEpochNano,
  nanoToIsoTimeAndDay,
} from './isoMath'
import { LargeInt } from './largeInt'
import { EpochDisambig, OffsetDisambig } from './options'
import { TimeZoneImpl, queryTimeZoneImpl } from './timeZoneImpl'
import { getMatchingInstantFor, utcTimeZoneId } from './timeZoneOps'
import {
  TimeUnit,
  Unit,
  nanoInHour,
  nanoInMinute,
  nanoToGivenFields,
} from './units'
import { divFloorMod } from './utils'
import { ZonedInternals } from './zonedDateTime'

// High-level
// -------------------------------------------------------------------------------------------------

export function parseInstant(s: string): LargeInt {
  const parsed = parseDateTime(s)
  if (!parsed) {
    throw new RangeError()
  }

  let offsetNano

  if (parsed.hasZ) {
    offsetNano = 0
  } else if (parsed.offset) {
    offsetNano = parseOffsetNano(parsed.offset)
  } else {
    throw new RangeError()
  }

  return isoToEpochNano(parsed)!.addNumber(offsetNano)
}

export function parseMaybeZonedDateTime(s: string): IsoDateInternals | ZonedInternals {
  const parsed = parseDateTime(s)
  if (!parsed) {
    throw new RangeError()
  }
  if (parsed.timeZone) {
    return processZonedDateTimeParse(parsed as ZonedDateTimeParsed)
  }
  return processDatelikeParse(parsed) // unnecessarily checks for undefined
}

export function parseZonedDateTime(s: string): ZonedInternals {
  const parsed = parseDateTime(s)
  if (!parsed || !parsed.timeZone) {
    throw new RangeError()
  }
  return processZonedDateTimeParse(parsed as ZonedDateTimeParsed)
}

export function parsePlainDateTime(s: string): IsoDateTimeInternals {
  const parsed = parseDateTime(s)
  if (!parsed) {
    throw new RangeError()
  }
  return processDateTimeParse(parsed)
}

export function parsePlainDate(s: string): IsoDateInternals {
  return processDatelikeParse(parseDateTime(s))
}

export function parsePlainYearMonth(s: string): IsoDateInternals {
  return processDatelikeParse(parseYearMonth(s) || parseDateTime(s))
}

export function parsePlainMonthDay(s: string): IsoDateInternals {
  return processDatelikeParse(parseMonthDay(s) || parseDateTime(s))
}

export function parsePlainTime(s: string): IsoTimeFields {
  let parsed: IsoTimeFields | DateTimeParsed | undefined = parseTime(s)

  if (!parsed) {
    parsed = parseDateTime(s)
    if (parsed && !(parsed as DateTimeParsed).hasTime) {
      throw new RangeError()
    }
  }

  if (!parsed) {
    throw new RangeError()
  }
  if ((parsed as DateTimeParsed).hasZ) {
    throw new RangeError()
  }
  if (
    (parsed as DateTimeParsed).calendar &&
    (parsed as DateTimeParsed).calendar.id !== isoCalendarId
  ) {
    throw new RangeError()
  }

  let altParsed
  // NOTE: -1 causes returning undefined rather than error
  if ((altParsed = parseYearMonth(s)) && constrainIsoDateInternals(altParsed, -1)) {
    throw new RangeError()
  }
  if ((altParsed = parseMonthDay(s)) && constrainIsoDateInternals(altParsed, -1)) {
    throw new RangeError()
  }

  return constrainIsoTimeFields(parsed)
}

export function parseDuration(s: string): DurationInternals {
  const parsed = parseDurationInternals(s)
  if (!parsed) {
    throw new RangeError()
  }
  return parsed
}

export function parseOffsetNano(s: string): number {
  const parts = offsetRegExp.exec(s)
  const parsed = parts && parseOffsetParts(parts.slice(1))

  if (!parsed) {
    throw new RangeError()
  }

  return parsed
}

export function parseCalendarId(s: string): string {
  if (s !== isoCalendarId) {
    s = (
      parseDateTime(s) || parseYearMonth(s) || parseMonthDay(s)
    )?.calendar.id || isoCalendarId
  }
  return s
}

export function parseTimeZoneId(s: string): string {
  const parsed = parseDateTime(s)

  if (parsed !== undefined) {
    if (parsed.timeZone) {
      return (parsed.timeZone as TimeZoneImpl).id
    }
    if (parsed.hasZ) {
      return utcTimeZoneId
    }
    if (parsed.offset) {
      return parsed.offset
    }
  }

  return s
}

// Intermediate
// -------------------------------------------------------------------------------------------------

function processZonedDateTimeParse(parsed: ZonedDateTimeParsed): ZonedInternals {
  const epochNanoseconds = getMatchingInstantFor(
    parsed.timeZone,
    parsed,
    parsed.offset ? parseOffsetNano(parsed.offset) : undefined,
    parsed.hasZ,
    OffsetDisambig.Reject,
    EpochDisambig.Compat,
    true, // fuzzy
  )
  return {
    epochNanoseconds,
    timeZone: parsed.timeZone,
    calendar: parsed.calendar,
  }
}

function processDateTimeParse(parsed: DateTimeParsed): IsoDateTimeInternals {
  return checkIsoInBounds(constrainIsoDateTimeInternals(parsed))
}

/*
Unlike others, throws an error
*/
function processDatelikeParse(parsed: IsoDateInternals | undefined): IsoDateInternals {
  if (!parsed) {
    throw new RangeError()
  }
  return checkIsoInBounds(constrainIsoDateInternals(parsed))
}

// Low-level
// -------------------------------------------------------------------------------------------------
// TODO: use new `Falsy` type instead of ternary operator?

function parseDateTime(s: string): DateTimeParsed | undefined {
  const parts = dateTimeRegExp.exec(s)
  return parts ? parseDateTimeParts(parts) : undefined
}

function parseYearMonth(s: string): IsoDateInternals | undefined {
  const parts = yearMonthRegExp.exec(s)
  return parts ? parseYearMonthParts(parts) : undefined
}

function parseMonthDay(s: string): IsoDateInternals | undefined {
  const parts = monthDayRegExp.exec(s)
  return parts ? parseMonthDayParts(parts) : undefined
}

function parseTime(s: string): IsoTimeFields | undefined {
  const parts = timeRegExp.exec(s)
  return parts ? parseTimeParts(parts.slice(1)) : undefined
}

function parseDurationInternals(s: string): DurationInternals | undefined {
  const parts = durationRegExp.exec(s)
  return parts ? parseDurationParts(parts) : undefined
}

// RegExp & Parts
// -------------------------------------------------------------------------------------------------

const plusOrMinusRegExpStr = '([+-\u2212])'
const fractionRegExpStr = '([.,](\\d{1,9}))?'

const yearMonthRegExpStr =
  `(${plusOrMinusRegExpStr}?\\d{6}|\\d{4})` + // 0:yearSign, 1:year
  '-?(\\d{2})' // 2:month
  // 3:annotations

const dateRegExpStr =
  yearMonthRegExpStr + // 0:yearSign, 1:year, 2:month
  '-?(\\d{2})' // 3:day

const monthDayRegExpStr =
  '(--)?(\\d{2})' + // 1:month
  '-?(\\d{2})' // 2:day
  // 3:annotations

const timeRegExpStr =
  '(\\d{2})' + // 0:hour
  '(:?(\\d{2})' + // 2:minute (NOTE: ':?' means optional ':')
  '(:?(\\d{2})' + // 4:second
  fractionRegExpStr + // 6:afterDecimal
  ')?)?'
  // 7:annotations

const offsetRegExpStr =
  plusOrMinusRegExpStr + // 0:plusOrMinus
  timeRegExpStr // 1:hour, 3:minute, 5:second, 7:afterDecimal

const dateTimeRegExpStr =
  dateRegExpStr + // 0:yearSign, 1:year, 2:month, 3:day
  '([T ]' + // 4:timeEverything
  timeRegExpStr + // 5:hour, 7:minute, 9:second, 11:afterDecimal
  '(Z|' + // 12:zOrOffset
  offsetRegExpStr + // 13:plusOrMinus, 14:hour, 16:minute, 18:second, 20:afterDecimal
  ')?)?'
  // 21:annotations

const annotationRegExpStr = '((\\[[^\\]]*\\])*)'

const yearMonthRegExp = createRegExp(yearMonthRegExpStr + annotationRegExpStr)
const monthDayRegExp = createRegExp(monthDayRegExpStr + annotationRegExpStr)
const dateTimeRegExp = createRegExp(dateTimeRegExpStr + annotationRegExpStr)
const timeRegExp = createRegExp('T?' + timeRegExpStr + annotationRegExpStr)
const offsetRegExp = createRegExp(offsetRegExpStr) // annotations not allowed

const durationRegExp = createRegExp(
  `${plusOrMinusRegExpStr}?P` + // 0:sign
  '(\\d+Y)?' + // 1:years
  '(\\d+M)?' + // 2:months
  '(\\d+W)?' + // 3:weeks
  '(\\d+D)?' + // 4:days
  '(T' + // 5:hasTimes
  `((\\d+)${fractionRegExpStr}H)?` + // 6:hours, 7:partialHour
  `((\\d+)${fractionRegExpStr}M)?` + // 8:minutes, 9:partialMinute
  `((\\d+)${fractionRegExpStr}S)?` + // 10:seconds, 11:partialSecond
  ')?',
)

type DateTimeParsed = IsoDateTimeInternals & AnnotationsParsed & {
  hasTime: boolean
  hasZ: boolean
  offset: string | undefined
}

type ZonedDateTimeParsed = IsoDateTimeInternals & {
  calendar: CalendarImpl
  timeZone: TimeZoneImpl // guaranteed annotation
  hasTime: boolean
  hasZ: boolean
  offset: string | undefined
}

/*
0 is whole-match
*/
function parseDateTimeParts(parts: string[]): DateTimeParsed {
  const offsetOrZ = parts[13]
  const hasZ = offsetOrZ === 'Z'
  const hasTime = Boolean(parts[5]) // boolean-like

  return {
    isoYear: parseIsoYearParts(parts),
    isoMonth: parseInt(parts[3]),
    isoDay: parseInt(parts[4]),
    ...(hasTime
      ? parseTimeParts(parts.slice(6)) // parses annotations
      : { ...isoTimeFieldDefaults, ...parseAnnotations(parts[22]) }
    ),
    hasTime,
    hasZ,
    offset: hasZ ? undefined : offsetOrZ,
  }
}

/*
0 is whole-match
*/
function parseYearMonthParts(parts: string[]): IsoDateInternals {
  return {
    isoYear: parseIsoYearParts(parts),
    isoMonth: parseInt(parts[3]),
    isoDay: 1,
    ...parseAnnotations(parts[4]),
  }
}

/*
0 is whole-match
*/
function parseMonthDayParts(parts: string[]): IsoDateInternals {
  return {
    isoYear: parseInt(parts[1]),
    isoMonth: parseInt(parts[2]),
    isoDay: 1,
    ...parseAnnotations(parts[3]),
  }
}

/*
0 is whole-match
*/
function parseIsoYearParts(parts: string[]): number {
  const yearSign = parseSign(parts[1])
  const year = parseInt(parts[2])
  if (yearSign < 0 && !year) {
    throw new RangeError('Negative zero not allowed')
  }
  return yearSign * year
}

/*
validated annotations as well
*/
function parseTimeParts(parts: string[]): IsoTimeFields & AnnotationsParsed {
  const isoSecond = parseInt0(parts[4])
  return {
    ...nanoToIsoTimeAndDay(parseSubsecNano(parts[6] || ''))[0],
    isoHour: parseInt0(parts[0]),
    isoMinute: parseInt0(parts[2]),
    isoSecond: isoSecond === 60 ? 59 : isoSecond, // massage leap-second
    ...parseAnnotations(parts[16]),
  }
}

function parseOffsetParts(parts: string[]): number {
  return parseSign(parts[0]) * (
    parseInt0(parts[0]) * nanoInHour +
    parseInt0(parts[2]) * nanoInMinute +
    parseInt0(parts[4]) * nanoInSec +
    parseSubsecNano(parts[6] || '')
  )
}

function parseDurationParts(parts: string[]): DurationInternals {
  let hasAny = false
  let hasAnyFrac = false
  let leftoverNano = 0
  let durationFields = {
    years: parseUnit(parts[2]),
    months: parseUnit(parts[3]),
    weeks: parseUnit(parts[4]),
    days: parseUnit(parts[5]),
    hours: parseUnit(parts[7], parts[8], Unit.Hour),
    minutes: parseUnit(parts[9], parts[10], Unit.Minute),
    seconds: parseUnit(parts[11], parts[12], Unit.Second),
    ...nanoToGivenFields(leftoverNano, Unit.Millisecond, durationFieldNamesAsc),
  } as DurationFields

  if (!hasAny) {
    throw new RangeError('Duration string must have at least one field')
  }

  if (parseSign(parts[1]) < 0) {
    durationFields = negateDurationFields(durationFields)
  }

  return updateDurationFieldsSign(durationFields)

  function parseUnit(wholeStr: string): number
  function parseUnit(wholeStr: string, fracStr: string, timeUnit: TimeUnit): number
  function parseUnit(wholeStr: string, fracStr?: string, timeUnit?: TimeUnit): number {
    let leftoverUnits = 0 // from previous round
    let wholeUnits = 0

    if (timeUnit) {
      [leftoverUnits, leftoverNano] = divFloorMod(leftoverNano, unitNanoMap[timeUnit])
    }

    if (wholeStr !== undefined) {
      if (hasAnyFrac) {
        throw new RangeError('Fraction must be last one')
      }

      wholeUnits = parseInt(wholeStr)
      hasAny = true

      if (fracStr) {
        // convert seconds to other units, abusing parseSubsecNano
        leftoverNano = parseSubsecNano(fracStr) * (unitNanoMap[timeUnit!] / nanoInSec)
        hasAnyFrac = true
      }
    }

    return leftoverUnits + wholeUnits
  }
}

// Utils
// -------------------------------------------------------------------------------------------------

interface AnnotationsParsed {
  calendar: CalendarImpl,
  timeZone: TimeZoneImpl | undefined,
}

function parseAnnotations(s: string): AnnotationsParsed {
  let calendarId: string | undefined
  let timeZoneId: string | undefined

  for (const chunk of s.split(']')) {
    if (chunk) { // not the empty end chunk
      let annotation = chunk.slice(1) // remove leading '['
      let isCritical = false

      if (annotation.charAt(0) === '!') {
        isCritical = true
        annotation = annotation.slice(1)
      }

      const annotationParts = annotation.split('=')
      if (annotationParts.length === 1) {
        if (timeZoneId !== undefined) {
          throw new RangeError('Cannot specify timeZone multiple times')
        }
        timeZoneId = annotation
      } else if (annotationParts[0] === 'u-ca') {
        if (calendarId === undefined) { // ignore subsequent calendar annotations
          calendarId = annotationParts[1]
        }
      } else if (isCritical) {
        throw new RangeError(`Critical annotation '${annotationParts[0]}' not used`)
      }
    }
  }

  return {
    calendar: queryCalendarImpl(calendarId || isoCalendarId),
    timeZone: timeZoneId ? queryTimeZoneImpl(timeZoneId) : undefined,
  }
}

function parseSubsecNano(fracStr: string): number {
  return parseInt(fracStr.padEnd(9, '0'))
}

function createRegExp(meat: string): RegExp {
  return new RegExp(`^${meat}$`, 'i')
}

function parseSign(s: string): number {
  return !s || s === '+' ? 1 : -1
}

function parseInt0(s: string): number {
  return s === undefined ? 0 : parseInt(s)
}
