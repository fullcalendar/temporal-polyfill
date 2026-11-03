import type { Temporal } from 'temporal-spec'
import {
  computeCalendarDateFields,
  computeCalendarIsoFieldsFromParts,
  computeCalendarMonthCodeParts,
} from './calendarDerived'
import { type CalendarImpl } from './calendarImpl'
import { requireString, toPrimitiveWithStringHint } from './cast'
import { DurationFields, durationFieldNamesAsc } from './durationFields'
import { negateDurationFields, validateDurationFields } from './durationMath'
import * as errorMessages from './errorMessages'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  CalendarYearMonthFields,
  TimeFields,
} from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import { isoCalendarId } from './intlCalendarConfig'
import {
  computeIsoYearMonthFieldsForMonthDay,
  isIsoDateFieldsValid,
  isoEpochFirstLeapYear,
  validateIsoDateFields,
} from './isoCalendarMath'
import { moveToStartOfMonth } from './move'
import { offsetHasSeconds, parseOffsetNano } from './offsetParse'
import { refineZonedFieldOptions } from './optionsFieldRefine'
import { RelativeToSlots } from './relativeMath'
import {
  EpochNanoFields,
  ZonedEpochNanoFields,
  createDateSlots,
  createDurationSlots,
  createEpochNanoSlots,
  createTimeSlots,
  createZonedEpochNanoSlots,
} from './slots'
import {
  checkEpochNanoInBounds,
  checkIsoDateInBounds,
  checkIsoDateTimeInBounds,
  checkIsoYearMonthInBounds,
  isoDateTimeAndOffsetToEpochNano,
  isoYearMonthIndexMin,
} from './temporalLimits'
import { nanoToTimeAndDay } from './timeFieldMath'
import { FixedTimeZone, queryTimeZone } from './timeZone'
import { utcTimeZoneId } from './timeZoneConfig'
import { resolveTimeZoneId } from './timeZoneId'
import { getMatchingInstantFor, getStartOfDayInstantFor } from './timeZoneMath'
import { nanoToGivenFields } from './unitMath'
import { TimeUnit, Unit, nanoInSec, unitNanoMap } from './units'
import {
  NumberSign,
  createRegExp,
  divModFloor,
  fractionRegExpStr,
  parseInt0,
  parseSign,
  parseSubsecNano,
  signRegExpStr,
  throwRangeError,
} from './utils'

// High-level
// -----------------------------------------------------------------------------

function throwFailedParse(s: string): never {
  throwRangeError(errorMessages.failedParse(s))
}

export function parseInstant(s: string): EpochNanoFields {
  // instead of 'requiring' like other types,
  // coerce, because there's no fromFields, so no need to differentiate param type
  s = requireString(toPrimitiveWithStringHint(s) as string)

  const organized = parseDateTimeLike(s)
  if (!organized) {
    throwFailedParse(s)
  }

  let offsetNano: number

  if (organized.hasZ) {
    offsetNano = 0
  } else if (organized.offset) {
    offsetNano = parseOffsetNano(organized.offset)
  } else {
    throwFailedParse(s)
  }

  const epochNanoseconds = isoDateTimeAndOffsetToEpochNano(
    organized,
    offsetNano,
  )

  return createEpochNanoSlots(epochNanoseconds)
}

export function parseRelativeToSlots(
  s: string,
  resolveCalendar: (rawCalendarId: string) => CalendarImpl,
): RelativeToSlots {
  const organized = parseDateTimeLike(requireString(s))

  if (!organized) {
    throwFailedParse(s)
  }
  if (organized.timeZoneId) {
    return finalizeZonedDateTime(
      organized as ZonedDateTimeOrganized,
      resolveCalendar,
      undefined,
    )
  }
  if (organized.hasZ) {
    // PlainDate doesn't support Z
    throwFailedParse(s)
  }

  return finalizeDate(organized, resolveCalendar)
}

export function parseZonedDateTime(
  s: string,
  resolveCalendar: (rawCalendarId: string) => CalendarImpl,
  options?: Temporal.ZonedDateTimeFromOptions,
): ZonedEpochNanoFields & { calendar: CalendarImpl } {
  const organized = parseDateTimeLike(requireString(s))

  if (!organized || !organized.timeZoneId) {
    throwFailedParse(s)
  }

  return finalizeZonedDateTime(
    organized as ZonedDateTimeOrganized,
    resolveCalendar,
    options,
  )
}

export function parsePlainDateTime(
  s: string,
  resolveCalendar: (rawCalendarId: string) => CalendarImpl,
): CalendarDateTimeFields & { calendar: CalendarImpl } {
  const organized = parseDateTimeLike(requireString(s))

  if (!organized || organized.hasZ) {
    throwFailedParse(s)
  }

  // result is exact DateTimeSlots shape
  return finalizeDateTime(organized, resolveCalendar)
}

export function parsePlainDate(
  s: string,
  resolveCalendar: (rawCalendarId: string) => CalendarImpl,
): CalendarDateFields & { calendar: CalendarImpl } {
  const slots = finalizeDateLike(
    parsePlainDateLike(requireString(s)),
    undefined,
    resolveCalendar,
  )
  return createDateSlots(slots, slots.calendar)
}

export function parsePlainYearMonth(
  s: string,
  resolveCalendar: (rawCalendarId: string) => CalendarImpl,
): CalendarDateFields & { calendar: CalendarImpl } {
  const organized = parseYearMonthOnly(requireString(s))

  if (organized) {
    requireIsoCalendar(organized)
    return createDateSlots(
      checkIsoYearMonthInBounds(validateIsoDateFields(organized)),
      resolveCalendar(organized.calendarId),
    )
  }

  const dateSlots = finalizeDateLike(
    parsePlainDateLike(s),
    projectIsoYearMonthDate,
    resolveCalendar,
  )
  const { calendar } = dateSlots
  const startOfMonthFields = moveToStartOfMonth(calendar, dateSlots)

  return createDateSlots(startOfMonthFields, calendar)
}

function requireIsoCalendar(organized: { calendarId: string }): void {
  if (organized.calendarId !== isoCalendarId) {
    throwRangeError(errorMessages.invalidSubstring(organized.calendarId))
  }
}

export function parsePlainMonthDay(
  s: string,
  resolveCalendar: (rawCalendarId: string) => CalendarImpl,
): CalendarDateFields & { calendar: CalendarImpl } {
  const organized = parseMonthDayOnly(requireString(s))

  if (organized) {
    requireIsoCalendar(organized)

    return createDateSlots(
      validateIsoDateFields(organized), // `organized` has isoEpochFirstLeapYear
      resolveCalendar(organized.calendarId),
    )
  }

  const dateSlots = finalizeDateLike(
    parsePlainDateLike(s),
    projectIsoMonthDayDate,
    resolveCalendar,
  )
  const { calendar } = dateSlots

  // normalize year&month to be as close as possible to epoch
  const {
    year: origYear,
    month: origMonth,
    day,
  } = computeCalendarDateFields(calendar, dateSlots)
  const [monthCodeNumber, isLeapMonth] = computeCalendarMonthCodeParts(
    calendar,
    origYear,
    origMonth,
  )
  const { year, month } = computeMonthDayReferenceYearMonth(
    calendar,
    monthCodeNumber,
    isLeapMonth,
    day,
  )
  const isoDate = checkIsoDateInBounds(
    computeCalendarIsoFieldsFromParts(calendar, year, month, day),
  )

  return createDateSlots(isoDate, calendar)
}

export function parsePlainTime(s: string): TimeFields {
  s = requireString(s)

  let organized: TimeFields | undefined = parseTimeOnly(s)

  if (!organized) {
    const dateTime = parseDateTimeLike(s)

    if (!dateTime || !dateTime.hasTime) {
      throwFailedParse(s) // Must have time for PlainTime
    }
    if (dateTime.hasZ) {
      throwRangeError(errorMessages.invalidSubstring('Z')) // Cannot have Z for PlainTime
    }
    // A PlainTime has no calendar, so a non-ISO or unknown calendar isn't an error
    organized = dateTime
  }

  // The two short forms can't both match, because they differ in digit count
  const altParsed = parseYearMonthOnly(s) || parseMonthDayOnly(s)
  if (altParsed && isIsoDateFieldsValid(altParsed)) {
    throwFailedParse(s)
  }

  return createTimeSlots(organized)
}

export function parseDuration(
  s: string,
): DurationFields & { sign: NumberSign } {
  const parts = durationRegExp.exec(requireString(s))
  if (!parts) {
    throwFailedParse(s)
  }
  return createDurationSlots(
    validateDurationFields(organizeDurationParts(parts)),
  )
}

// If `s` is a Temporal string, extract its calendar annotation.
// Time-only strings can carry a calendar annotation for withCalendar().
export function parseCalendarId(s: string): string {
  const dateTime = parseDateTimeLike(s)
  if (dateTime) {
    return dateTime.calendarId
  }
  // An impossible date falls through, because `2024-13` is also a time and an offset
  const date = parseYearMonthOnly(s) || parseMonthDayOnly(s)
  if (date && isIsoDateFieldsValid(date)) {
    requireIsoCalendar(date)
    return date.calendarId
  }
  const timeParts = parseTimeOnlyParts(s)
  if (timeParts) {
    return organizeAnnotationParts(timeParts[13], timeParts[14]).calendarId
  }
  return s
}

export function parseTimeZoneId(s: string): string {
  const parsed = parseDateTimeLike(s)
  return (
    (parsed &&
      (parsed.timeZoneId || (parsed.hasZ && utcTimeZoneId) || parsed.offset)) ||
    s
  )
}

function parsePlainDateLike(s: string): DateTimeLikeOrganized {
  const organized = parseDateTimeLike(s)

  if (!organized || organized.hasZ) {
    throwFailedParse(s)
  }

  return organized
}

function finalizeDateLike(
  organized: DateTimeLikeOrganized,
  isoDateProjector:
    | ((organized: DateTimeLikeOrganized) => DateOrganized)
    | undefined,
  resolveCalendar: (rawCalendarId: string) => CalendarImpl,
): CalendarDateFields & { calendar: CalendarImpl } {
  if (isoDateProjector && organized.calendarId === isoCalendarId) {
    // Full-date strings have already had their ParseISODateTime-style validation.
    // Only now do PlainYearMonth/PlainMonthDay project the parsed date onto the
    // representative ISO date stored in their slots.
    return finalizeDate(isoDateProjector(organized), resolveCalendar)
  }

  return organized.hasTime
    ? finalizeDateTime(organized, resolveCalendar)
    : finalizeDate(organized, resolveCalendar)
}

function projectIsoYearMonthDate(
  organized: DateTimeLikeOrganized,
): DateOrganized {
  // The final YearMonth slot drops the day, but its range check still needs a
  // valid representative ISO date. The minimum ISO year-month starts on day 20.
  const isoYearMonthIndex = organized.year * 12 + organized.month
  const day = isoYearMonthIndex === isoYearMonthIndexMin ? 20 : 1
  return {
    ...organized,
    day,
  }
}

function projectIsoMonthDayDate(
  organized: DateTimeLikeOrganized,
): DateOrganized {
  // The stored PlainMonthDay reference year is a post-epoch leap year, matching
  // the ISO short form so 02-29 can be represented.
  return {
    ...organized,
    year: isoEpochFirstLeapYear,
  }
}

function computeMonthDayReferenceYearMonth(
  calendar: CalendarImpl,
  monthCodeNumber: number,
  isLeapMonth: boolean,
  day: number,
): CalendarYearMonthFields {
  const yearMonthFields = calendar
    ? calendar.computeYearMonthFieldsForMonthDay(
        monthCodeNumber,
        isLeapMonth,
        day,
      )
    : computeIsoYearMonthFieldsForMonthDay(monthCodeNumber, isLeapMonth)

  if (!yearMonthFields) {
    throwRangeError(errorMessages.failedYearGuess)
  }

  return yearMonthFields
}

// Finalizing 'organized' structs to slots
// -----------------------------------------------------------------------------

/*
Unlike others, return slots
*/
function finalizeZonedDateTime(
  organized: ZonedDateTimeOrganized,
  resolveCalendar: (rawCalendarId: string) => CalendarImpl,
  options?: Temporal.ZonedDateTimeFromOptions,
): ZonedEpochNanoFields & { calendar: CalendarImpl } {
  const timeZoneId = resolveTimeZoneId(organized.timeZoneId)
  const timeZone = queryTimeZone(timeZoneId)

  let epochNano: bigint

  if (organized.hasTime) {
    const offsetNano = organized.offset
      ? parseOffsetNano(organized.offset)
      : undefined
    const [, offsetDisambig, epochDisambig] = refineZonedFieldOptions(options)
    epochNano = getMatchingInstantFor(
      timeZone,
      organized,
      offsetNano,
      offsetDisambig,
      epochDisambig,
      !(timeZone as FixedTimeZone).offsetNano && // not fixed?
        organized.offset !== undefined &&
        !offsetHasSeconds(organized.offset),
      organized.hasZ,
    )
  } else {
    refineZonedFieldOptions(options)
    epochNano = getStartOfDayInstantFor(timeZone, organized)
  }

  // Validate the computed epochNanoseconds is within the representable range
  checkEpochNanoInBounds(epochNano)

  return createZonedEpochNanoSlots(
    epochNano,
    timeZone,
    resolveCalendar(organized.calendarId),
  )
}

// Returns exact DateTimeSlots shape
function finalizeDateTime(
  organized: DateTimeLikeOrganized,
  resolveCalendar: (rawCalendarId: string) => CalendarImpl,
): CalendarDateTimeFields & { calendar: CalendarImpl } {
  checkIsoDateTimeInBounds(organized)
  return {
    ...combineDateAndTime(organized, organized),
    calendar: resolveCalendar(organized.calendarId),
  }
}

function finalizeDate(
  organized: DateOrganized,
  resolveCalendar: (rawCalendarId: string) => CalendarImpl,
): CalendarDateFields & { calendar: CalendarImpl } {
  validateIsoDateFields(organized)
  checkIsoDateInBounds(organized)
  return {
    calendar: resolveCalendar(organized.calendarId),
    year: organized.year,
    month: organized.month,
    day: organized.day,
  }
}

// RegExp
// -----------------------------------------------------------------------------

const monthRegExpStr = '(0[1-9]|1[0-2])'
const dayRegExpStr = '(0[1-9]|[12]\\d|3[01])'

const yearRegExpStr = '((?!-0{6})[+-]\\d{6}|\\d{4})' // can't be negative zero

const yearMonthRegExpStr =
  yearRegExpStr + // 1:year
  '-?' +
  monthRegExpStr // 2:month

const dateRegExpStr =
  yearRegExpStr + // 1:year
  '(-?)' + // 2:separator
  monthRegExpStr + // 3:month
  '\\2' +
  dayRegExpStr // 4:day

const monthDayRegExpStr =
  '(?:--)?' +
  monthRegExpStr + // 1:month
  '-?' +
  dayRegExpStr // 2:day

// The number is the capture index for this fragment's optional separator. We
// emit it as a backreference so a component stays consistently extended or
// basic: `12:34:56` and `123456` pass, but `12:3456` and `1234:56` fail.
// The index is global to the whole regexp, so callers must pass the final
// capture position after embedding this fragment.
function timeRegExpStr(separatorIndex: number, leapSecondStr = ''): string {
  return (
    '([01]\\d|2[0-3])' + // hour
    `(?:(:?)([0-5]\\d)(?:\\${separatorIndex}([0-5]\\d${leapSecondStr})` + // separator, minute, second
    fractionRegExpStr + // afterDecimal
    ')?)?'
  )
}

const leapSecondStr = '|60'

const dateTimeRegExpStr =
  dateRegExpStr + // 1:year, 2:dateSep, 3:month, 4:day
  '(?:[Tt ]' +
  timeRegExpStr(6, leapSecondStr) + // 5:hour, 6:timeSep, 7:minute, 8:second, 9:afterDecimal
  `(?:([Zz])|(${signRegExpStr}` + // 10:z, 11:offset, 12:offsetSign
  timeRegExpStr(14) + // 13:hour, 14:sep, 15:minute, 16:second, 17:afterDecimal
  '))?' +
  ')?'

// The annotations, per RFC 9557 and the Temporal grammar. A time zone can only come
// first. A key must be lowercase, which is why these regexps are case-sensitive. A
// value is alphanumeric parts joined by hyphens. Every repeat starts with a delimiter
// that can't match the characters before it, so none of them is a reDoS risk.
const annotationsRegExpStr =
  '(?:\\[!?([+-](?:[01]\\d|2[0-3])(?::?[0-5]\\d)?|[a-zA-Z._][\\w.+-]*(?:/[a-zA-Z._][\\w.+-]*)*)\\])?' + // timeZoneId
  '((?:\\[!?[a-z_][a-z\\d_-]*=[a-zA-Z\\d]+(?:-[a-zA-Z\\d]+)*\\])*)' // the others

const yearMonthRegExp = createRegExp(yearMonthRegExpStr + annotationsRegExpStr)
const monthDayRegExp = createRegExp(monthDayRegExpStr + annotationsRegExpStr)
const dateTimeRegExp = createRegExp(dateTimeRegExpStr + annotationsRegExpStr)
const timeRegExp = createRegExp(
  '[Tt]?' +
    timeRegExpStr(2, leapSecondStr) + // 1:hour, 2:sep, 3:minute, 4:second, 5:afterDecimal
    `(${signRegExpStr}${timeRegExpStr(9)})?` + // 6:offset, 7:sign, 8:hour, 9:sep, 10:minute, 11:second, 12:afterDecimal
    annotationsRegExpStr, // 13:timeZoneId, 14:others
)
// Splits the others, which annotationsRegExpStr has already validated
const annotationRegExp = /\[(!?)([^=]+)=([^\]]+)/g

// Spec grammar (DurationTime) requires the time designator `T` to be
// followed by at least one H/M/S component, so reject a dangling `T`.
const durationRegExp =
  /^([+-])?P(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(?:T(?!$)(?:(\d+)(?:[.,](\d{1,9}))?H)?(?:(\d+)(?:[.,](\d{1,9}))?M)?(?:(\d+)(?:[.,](\d{1,9}))?S)?)?$/i

// NOTE: when modifying regexps, check for reDoS vulnerabilities:
// https://devina.io/redos-checker
/*
;[
  yearMonthRegExp,
  monthDayRegExp,
  dateTimeRegExp,
  timeRegExp,
  // annotationRegExp, // no need to check. see note above
  durationRegExp,
].forEach((re) => console.log(re.source))
*/

// Maybe-parsing
// -----------------------------------------------------------------------------

function parseDateTimeLike(s: string): DateTimeLikeOrganized | undefined {
  const parts = dateTimeRegExp.exec(s)
  if (!parts) {
    return undefined
  }

  const organized = organizeDateTimeLikeParts(parts)

  // The regexp checks every range except the length of the month. This is here because
  // every string type needs it, including the ones that discard the date, like PlainTime.
  return validateIsoDateFields(organized)
}

function parseYearMonthOnly(s: string): DateOrganized | undefined {
  const parts = yearMonthRegExp.exec(s)
  if (!parts) return undefined

  // YearMonth-only strings have just one optional date separator, so the
  // full-date consistency check below does not apply. In particular, signed
  // six-digit years like "-271821-04" can be misread by that check as a
  // four-digit compact date prefix ("-2718-21-04") and rejected before the
  // YearMonth-specific range validation can run.
  return organizeYearMonthParts(parts)
}

function parseMonthDayOnly(s: string): DateOrganized | undefined {
  const parts = monthDayRegExp.exec(s)
  return parts ? organizeMonthDayParts(parts) : undefined
}

function parseTimeOnly(s: string): TimeFields | undefined {
  const parts = parseTimeOnlyParts(s)
  if (!parts) return undefined
  organizeAnnotationParts(parts[13], parts[14]) // validate annotations
  return organizeTimeParts(parts, 1)
}

function parseTimeOnlyParts(s: string): string[] | undefined {
  return timeRegExp.exec(s) || undefined
}

// Parts Organization
// -----------------------------------------------------------------------------

type DateTimeLikeOrganized = DateOrganized &
  TimeFields & {
    hasTime: boolean
    hasZ: boolean
    offset: string | undefined
    timeZoneId: string | undefined
  }

type ZonedDateTimeOrganized = DateTimeLikeOrganized & {
  timeZoneId: string
}

type WithCalendarStr = { calendarId: string }
type DateOrganized = CalendarDateFields & WithCalendarStr

function organizeDateTimeLikeParts(parts: string[]): DateTimeLikeOrganized {
  return {
    year: parseInt(parts[1]),
    month: parseInt(parts[3]),
    day: parseInt(parts[4]),
    ...organizeTimeParts(parts, 5),
    ...organizeAnnotationParts(parts[18], parts[19]),
    hasTime: !!parts[5],
    hasZ: !!parts[10],
    // TODO: figure out a way to pre-process into a number
    // (problems with TimeZone needing the full string?)
    offset: parts[11],
  }
}

/*
Result assumed to be ISO
*/
function organizeYearMonthParts(parts: string[]): DateOrganized {
  return {
    year: parseInt(parts[1]),
    month: parseInt(parts[2]),
    day: 1,
    ...organizeAnnotationParts(parts[3], parts[4]),
  }
}

function organizeMonthDayParts(parts: string[]): DateOrganized {
  return {
    year: isoEpochFirstLeapYear,
    month: parseInt(parts[1]),
    day: parseInt(parts[2]),
    ...organizeAnnotationParts(parts[3], parts[4]),
  }
}

function organizeTimeParts(parts: string[], hourIndex: number): TimeFields {
  const second = parseInt0(parts[hourIndex + 3])

  return {
    ...nanoToTimeAndDay(parseSubsecNano(parts[hourIndex + 4] || ''))[0],
    hour: parseInt0(parts[hourIndex]),
    minute: parseInt0(parts[hourIndex + 2]),
    second: second === 60 ? 59 : second, // massage leap-second
  }
}

function organizeDurationParts(parts: string[]): DurationFields {
  let hasAny = false
  let hasAnyFrac = false
  let leftoverNano = 0
  let durationFields = {
    years: parseUnit(parts[2]),
    months: parseUnit(parts[3]),
    weeks: parseUnit(parts[4]),
    days: parseUnit(parts[5]),
    hours: parseUnit(parts[6], parts[7], Unit.Hour),
    minutes: parseUnit(parts[8], parts[9], Unit.Minute),
    seconds: parseUnit(parts[10], parts[11], Unit.Second),
    ...nanoToGivenFields(leftoverNano, Unit.Millisecond, durationFieldNamesAsc),
  } as DurationFields

  if (!hasAny) {
    throwRangeError(errorMessages.noValidFields(durationFieldNamesAsc))
  }

  if (parseSign(parts[1]) < 0) {
    durationFields = negateDurationFields(durationFields)
  }

  return durationFields

  function parseUnit(wholeStr: string): number
  function parseUnit(
    wholeStr: string,
    fracStr: string,
    timeUnit: TimeUnit,
  ): number
  function parseUnit(
    wholeStr: string,
    fracStr?: string,
    timeUnit?: TimeUnit,
  ): number {
    let leftoverUnits = 0 // from previous round
    let wholeUnits = 0

    if (timeUnit) {
      ;[leftoverUnits, leftoverNano] = divModFloor(
        leftoverNano,
        unitNanoMap[timeUnit],
      )
    }

    if (wholeStr !== undefined) {
      if (hasAnyFrac) {
        throwRangeError(errorMessages.invalidSubstring(wholeStr)) // Fraction must be last one
      }

      wholeUnits = parseIntSafe(wholeStr)
      hasAny = true

      if (fracStr) {
        // convert seconds to other units
        // more precise version of `frac / nanoInSec * nanoInUnit`
        leftoverNano =
          parseSubsecNano(fracStr) * (unitNanoMap[timeUnit!] / nanoInSec)
        hasAnyFrac = true
      }
    }

    return leftoverUnits + wholeUnits
  }
}

// Annotations
// -----------------------------------------------------------------------------

interface AnnotationsOrganized {
  calendarId: string
  timeZoneId: string | undefined
}

function organizeAnnotationParts(
  timeZoneId: string | undefined,
  s: string,
): AnnotationsOrganized {
  let calendarIsCritical: string | undefined
  const calendarIds: string[] = []

  // iterate through matches
  s.replace(annotationRegExp, (whole, criticalStr, key, value) => {
    if (key === 'u-ca') {
      // Lowercase calendar ID for case-insensitive matching (e.g. ISO8601 -> iso8601)
      calendarIds.push(value.toLowerCase())
      calendarIsCritical ||= criticalStr
    } else if (criticalStr) {
      // Critical annotation not used
      throwRangeError(errorMessages.invalidSubstring(whole))
    }

    return ''
  })

  if (calendarIds.length > 1 && calendarIsCritical) {
    throwRangeError(errorMessages.invalidSubstring(s)) // Multiple calendars when one is critical
  }

  return {
    timeZoneId,
    calendarId: calendarIds[0] || isoCalendarId,
  }
}

// Utils
// -----------------------------------------------------------------------------

/*
Guaranteed to be non-Infinity (which can happen if number beyond maxint I think)
Only needs to be called when we know RegExp allows infinite repeating character
*/
function parseIntSafe(s: string): number {
  const n = parseInt(s)

  if (!Number.isFinite(n)) {
    throwRangeError(errorMessages.invalidSubstring(s))
  }

  return n
}
