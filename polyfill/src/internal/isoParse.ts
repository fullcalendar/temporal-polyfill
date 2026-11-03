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
} from './temporalLimits'
import { nanoToTimeAndDay } from './timeFieldMath'
import { FixedTimeZone, queryTimeZone } from './timeZone'
import { utcTimeZoneId } from './timeZoneConfig'
import { resolveTimeZoneId } from './timeZoneId'
import { getMatchingInstantFor, getStartOfDayInstantFor } from './timeZoneMath'
import { nanoToGivenFields } from './unitMath'
import { Unit } from './units'
import {
  NumberSign,
  createRegExp,
  fractionRegExpStr,
  parseInt0,
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

  if (organized && organized.timeZoneId) {
    return finalizeZonedDateTime(
      organized as ZonedDateTimeOrganized,
      resolveCalendar,
      undefined,
    )
  }

  return finalizeDate(parsePlainDateLike(s), resolveCalendar)
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
  const organized = parsePlainDateLike(s)

  checkIsoDateTimeInBounds(organized)

  // result is exact DateTimeSlots shape
  return {
    ...combineDateAndTime(organized, organized),
    calendar: resolveCalendar(organized.calendarId),
  }
}

export function parsePlainDate(
  s: string,
  resolveCalendar: (rawCalendarId: string) => CalendarImpl,
): CalendarDateFields & { calendar: CalendarImpl } {
  return finalizeDate(parsePlainDateLike(s), resolveCalendar)
}

export function parsePlainYearMonth(
  s: string,
  resolveCalendar: (rawCalendarId: string) => CalendarImpl,
): CalendarDateFields & { calendar: CalendarImpl } {
  const organized =
    parseYearMonthOnly(requireString(s)) || parsePlainDateLike(s)
  const calendar = resolveCalendar(organized.calendarId)

  // Only the year-month has to be in range, because a date in the first or last month
  // can be out of range for a PlainDate. Check it again after moving, because the start
  // of a non-ISO month can land in the ISO month before the first one.
  return createDateSlots(
    checkIsoYearMonthInBounds(
      moveToStartOfMonth(calendar, checkIsoYearMonthInBounds(organized)),
    ),
    calendar,
  )
}

export function parsePlainMonthDay(
  s: string,
  resolveCalendar: (rawCalendarId: string) => CalendarImpl,
): CalendarDateFields & { calendar: CalendarImpl } {
  const organized = parseMonthDayOnly(requireString(s)) || parsePlainDateLike(s)

  if (organized.calendarId === isoCalendarId) {
    // The stored reference year is a post-epoch leap year, so 02-29 can be represented,
    // and the string's own year doesn't need to be in range
    return createDateSlots(
      { ...organized, year: isoEpochFirstLeapYear },
      resolveCalendar(isoCalendarId),
    )
  }

  const { calendar } = finalizeDate(organized, resolveCalendar)

  // normalize year&month to be as close as possible to epoch
  const {
    year: origYear,
    month: origMonth,
    day,
  } = computeCalendarDateFields(calendar, organized)
  const [monthCodeNumber, isLeapMonth] = computeCalendarMonthCodeParts(
    calendar,
    origYear,
    origMonth,
  )
  // The falsy implementations are ISO, which is handled above, and Gregorian
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

  return createDateSlots(
    checkIsoDateInBounds(
      computeCalendarIsoFieldsFromParts(
        calendar,
        yearMonthFields.year,
        yearMonthFields.month,
        day,
      ),
    ),
    calendar,
  )
}

export function parsePlainTime(s: string): TimeFields {
  s = requireString(s)

  // A PlainTime has no calendar, so a non-ISO or unknown calendar isn't an error
  const organized = parseDateTimeLike(s) || parseTimeOnly(s)

  if (
    !organized ||
    !organized.hasTime || // Must have time for PlainTime
    organized.hasZ ||
    parseYearMonthOnly(s) ||
    parseMonthDayOnly(s)
  ) {
    throwFailedParse(s)
  }

  return createTimeSlots(organized)
}

export function parseDuration(
  s: string,
): DurationFields & { sign: NumberSign } {
  const parts = durationRegExp.exec(requireString(s))
  if (!parts || invalidDurationRegExp.test(s)) {
    throwFailedParse(s)
  }

  // invalidDurationRegExp allows at most one fraction
  const fraction = nanoToGivenFields(
    parseSubsecNano(parts[7] || '') * 3600 +
      parseSubsecNano(parts[9] || '') * 60 +
      parseSubsecNano(parts[11] || ''),
    Unit.Minute,
    durationFieldNamesAsc,
  )
  const durationFields = {
    ...fraction,
    years: parseInt0(parts[2]),
    months: parseInt0(parts[3]),
    weeks: parseInt0(parts[4]),
    days: parseInt0(parts[5]),
    hours: parseInt0(parts[6]),
    minutes: parseInt0(parts[8]) + fraction.minutes!,
    seconds: parseInt0(parts[10]) + fraction.seconds!,
  } as DurationFields

  return createDurationSlots(
    validateDurationFields(
      parts[1] === '-' ? negateDurationFields(durationFields) : durationFields,
    ),
  )
}

// If `s` is a Temporal string, extract its calendar annotation.
// Time-only strings can carry a calendar annotation for withCalendar().
export function parseCalendarId(s: string): string {
  const organized =
    parseDateTimeLike(s) ||
    parseYearMonthOnly(s) ||
    parseMonthDayOnly(s) ||
    parseTimeOnly(s)
  return organized ? organized.calendarId : s
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
  const organized = parseDateTimeLike(requireString(s))

  if (!organized || organized.hasZ) {
    throwFailedParse(s)
  }

  return organized
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

function finalizeDate(
  organized: DateOrganized,
  resolveCalendar: (rawCalendarId: string) => CalendarImpl,
): CalendarDateFields & { calendar: CalendarImpl } {
  return createDateSlots(
    checkIsoDateInBounds(organized),
    resolveCalendar(organized.calendarId),
  )
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
// Splits the others, which annotationsRegExpStr has already validated
const annotationRegExp = /\[(!?)([^=]+)=([^\]]+)/g

const durationRegExp =
  /^([+-])?P(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(?:T(?:(\d+)(?:[.,](\d{1,9}))?H)?(?:(\d+)(?:[.,](\d{1,9}))?M)?(?:(\d+)(?:[.,](\d{1,9}))?S)?)?$/i

// What durationRegExp can't express: at least one unit, a time designator with a time
// unit after it, and nothing after a fraction
const invalidDurationRegExp = /[PT]$|[.,]\d+[HMS]./i

// NOTE: when modifying regexps, check for reDoS vulnerabilities:
// https://devina.io/redos-checker
/*
;[
  yearMonthRegExp,
  monthDayRegExp,
  dateTimeRegExp,
  // annotationRegExp, // no need to check. it only runs on validated annotations
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
  return parts ? requireIsoCalendar(organizeYearMonthParts(parts)) : undefined
}

function parseMonthDayOnly(s: string): DateOrganized | undefined {
  const parts = monthDayRegExp.exec(s)
  if (parts) {
    const organized = organizeMonthDayParts(parts)
    // An impossible date isn't a month-day, and might still be a time and an offset
    if (isIsoDateFieldsValid(organized)) {
      return requireIsoCalendar(organized)
    }
  }
}

// The short date forms can only have the ISO calendar
function requireIsoCalendar(organized: DateOrganized): DateOrganized {
  if (organized.calendarId !== isoCalendarId) {
    throwFailedParse(organized.calendarId)
  }
  return organized
}

// A time-only string is the end of a date-time string, so give it a placeholder date
// to reuse the regexp. A time without a date can't use a space or Z.
function parseTimeOnly(s: string): DateTimeLikeOrganized | undefined {
  const organized = parseDateTimeLike(s.replace(/^t?/i, '0000-01-01T'))
  return organized && !organized.hasZ ? organized : undefined
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
    ...nanoToTimeAndDay(parseSubsecNano(parts[9] || ''))[0],
    hour: parseInt0(parts[5]),
    minute: parseInt0(parts[7]),
    second: Math.min(parseInt0(parts[8]), 59), // massage leap-second
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
      throwFailedParse(whole) // Critical annotation not used
    }

    return ''
  })

  if (calendarIds.length > 1 && calendarIsCritical) {
    throwFailedParse(s) // Multiple calendars when one is critical
  }

  return {
    timeZoneId,
    calendarId: calendarIds[0] || isoCalendarId,
  }
}
