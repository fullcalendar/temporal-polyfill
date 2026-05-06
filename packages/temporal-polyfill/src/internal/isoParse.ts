import { BigNano } from './bigNano'
import {
  computeCalendarDateFields,
  computeCalendarIsoFieldsFromParts,
  computeCalendarMonthCodeParts,
} from './calendarDerived'
import { resolveCalendarId } from './calendarId'
import { requireString, toStringViaPrimitive } from './cast'
import { DurationFields, durationFieldNamesAsc } from './durationFields'
import { checkDurationUnits, negateDurationFields } from './durationMath'
import * as errorMessages from './errorMessages'
import { getInternalCalendar } from './externalCalendar'
import type { InternalCalendar } from './externalCalendar'
import {
  CalendarDateFields,
  CalendarYearMonthFields,
  TimeFields,
} from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import { isoCalendarId } from './intlCalendarConfig'
import {
  checkIsoDateFields,
  checkIsoDateTimeFields,
  checkTimeFields,
  computeIsoYearMonthFieldsForMonthDay,
  isIsoDateFieldsValid,
  isoEpochFirstLeapYear,
} from './isoMath'
import { slotsWithCalendar } from './modify'
import { moveToDayOfMonthUnsafe } from './move'
import {
  offsetHasSeconds,
  offsetRegExpStr,
  parseOffsetNano,
  parseOffsetNanoMaybe,
  validateOffsetSeparators,
} from './offsetParse'
import { refineZonedFieldOptions } from './optionsFieldRefine'
import type { ZonedFieldOptions } from './optionsModel'
import { RelativeToSlots } from './relativeMath'
import {
  AbstractDateSlots,
  AbstractDateTimeSlots,
  DurationSlots,
  InstantSlots,
  PlainDateSlots,
  PlainDateTimeSlots,
  PlainMonthDaySlots,
  PlainTimeSlots,
  PlainYearMonthSlots,
  ZonedDateTimeSlots,
  createDurationSlots,
  createInstantSlots,
  createPlainDateSlots,
  createPlainDateTimeSlots,
  createPlainMonthDaySlots,
  createPlainTimeSlots,
  createPlainYearMonthSlots,
  createZonedDateTimeSlots,
} from './slots'
import {
  checkEpochNanoInBounds,
  checkIsoDateInBounds,
  checkIsoDateTimeInBounds,
  checkIsoYearMonthInBounds,
  isoDateTimeToEpochNanoWithOffset,
} from './timeMath'
import { organizeTimeParts, timeRegExpStr } from './timeParse'
import { utcTimeZoneId } from './timeZoneConfig'
import { resolveTimeZoneId } from './timeZoneId'
import { FixedTimeZone, queryTimeZone } from './timeZoneImpl'
import { getMatchingInstantFor, getStartOfDayInstantFor } from './timeZoneMath'
import { nanoToGivenFields } from './unitMath'
import { TimeUnit, Unit, nanoInSec, unitNanoMap } from './units'
import {
  createRegExp,
  divModFloor,
  fractionRegExpStr,
  parseSign,
  parseSubsecNano,
  signRegExpStr,
  validateTimeSeparators,
  zipProps,
} from './utils'

// High-level
// -----------------------------------------------------------------------------

export function parseInstant(s: string): InstantSlots {
  // instead of 'requiring' like other types,
  // coerce, because there's no fromFields, so no need to differentiate param type
  s = toStringViaPrimitive(s)

  const organized = parseDateTimeLike(s)
  if (!organized) {
    throw new RangeError(errorMessages.failedParse(s))
  }

  let offsetNano: number

  if (organized.hasZ) {
    offsetNano = 0
  } else if (organized.offset) {
    offsetNano = parseOffsetNano(organized.offset)
  } else {
    throw new RangeError(errorMessages.failedParse(s))
  }

  // validate timezone
  if (organized.timeZoneId) {
    parseOffsetNanoMaybe(organized.timeZoneId, true) // onlyHourMinute=true
  }

  checkIsoDateTimeFields(organized)
  const epochNanoseconds = isoDateTimeToEpochNanoWithOffset(
    organized,
    offsetNano,
  )

  return createInstantSlots(epochNanoseconds)
}

export function parseRelativeToSlots(s: string): RelativeToSlots {
  const organized = parseDateTimeLike(requireString(s))

  if (!organized) {
    throw new RangeError(errorMessages.failedParse(s))
  }
  if (organized.timeZoneId) {
    return finalizeZonedDateTime(organized as ZonedDateTimeOrganized)
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
): ZonedDateTimeSlots {
  const organized = parseDateTimeLike(requireString(s))

  if (!organized || !organized.timeZoneId) {
    throw new RangeError(errorMessages.failedParse(s))
  }

  return finalizeZonedDateTime(organized as ZonedDateTimeOrganized, options)
}

export function parsePlainDateTime(s: string): PlainDateTimeSlots {
  const organized = parseDateTimeLike(requireString(s))

  if (!organized || organized.hasZ) {
    throw new RangeError(errorMessages.failedParse(s))
  }

  const slots = finalizeDateTime(organized)
  return createPlainDateTimeSlots(slots)
}

export function parsePlainDate(s: string): PlainDateSlots {
  const slots = finalizeDateLike(parsePlainDateLike(requireString(s)))
  return createPlainDateSlots(slots)
}

export function parsePlainYearMonth(s: string): PlainYearMonthSlots {
  const organized = parseYearMonthOnly(requireString(s))

  if (organized) {
    requireIsoCalendar(organized)
    return createPlainYearMonthSlots(
      checkIsoYearMonthInBounds(checkIsoDateFields(organized)),
      getInternalCalendar(resolveCalendarId(organized.calendarId)),
    )
  }

  const dateSlots = finalizeDateLike(
    parsePlainDateLike(s),
    projectIsoYearMonthDate,
  )
  const { calendar } = dateSlots
  const moveIsoSlots = moveToDayOfMonthUnsafe(
    (isoDate) => computeCalendarDateFields(calendar, isoDate).day,
    dateSlots,
  )

  return createPlainYearMonthSlots(moveIsoSlots, calendar)
}

function requireIsoCalendar(organized: { calendarId: string }): void {
  if (organized.calendarId !== isoCalendarId) {
    throw new RangeError(errorMessages.invalidSubstring(organized.calendarId))
  }
}

export function parsePlainMonthDay(s: string): PlainMonthDaySlots {
  const organized = parseMonthDayOnly(requireString(s))

  if (organized) {
    requireIsoCalendar(organized)

    return createPlainMonthDaySlots(
      checkIsoDateFields(organized), // `organized` has isoEpochFirstLeapYear
      getInternalCalendar(resolveCalendarId(organized.calendarId)),
    )
  }

  const dateSlots = finalizeDateLike(
    parsePlainDateLike(s),
    projectIsoMonthDayDate,
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

  return createPlainMonthDaySlots(isoDate, calendar)
}

export function parsePlainTime(s: string): PlainTimeSlots {
  s = requireString(s)

  let organized: TimeFields | DateTimeLikeOrganized | undefined =
    parseTimeOnly(s)

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

  return createPlainTimeSlots(checkTimeFields(organized))
}

export function parseDuration(s: string): DurationSlots {
  const parsed = parseDurationFields(requireString(s))
  if (!parsed) {
    throw new RangeError(errorMessages.failedParse(s))
  }
  return createDurationSlots(checkDurationUnits(parsed))
}

// If `s` is a Temporal string, extract its calendar annotation.
// Time-only strings can carry a calendar annotation for withCalendar().
export function parseCalendarId(s: string): string {
  const res =
    parseDateTimeLike(s) || parseYearMonthOnly(s) || parseMonthDayOnly(s)
  if (res) {
    return res.calendarId
  }
  const timeParts = parseTimeOnlyParts(s)
  if (timeParts) {
    return organizeAnnotationParts(timeParts[10]).calendarId
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
    throw new RangeError(errorMessages.failedParse(s))
  }

  return organized
}

function finalizeDateLike(
  organized: DateTimeLikeOrganized,
  isoDateProjector?: (organized: DateTimeLikeOrganized) => DateOrganized,
): AbstractDateSlots {
  if (isoDateProjector && organized.calendarId === isoCalendarId) {
    // Full-date strings still go through the normal ParseISODateTime-style
    // validation. Only after that do PlainYearMonth/PlainMonthDay project the
    // parsed date onto the representative ISO date stored in their slots.
    checkIsoDateFields(organized)
    if (organized.hasTime) {
      checkTimeFields(organized)
    }
    return finalizeDate(isoDateProjector(organized))
  }

  return organized.hasTime
    ? finalizeDateTime(organized)
    : finalizeDate(organized)
}

function projectIsoYearMonthDate(
  organized: DateTimeLikeOrganized,
): DateOrganized {
  // The final YearMonth slot drops the day, but its range check still needs a
  // valid representative ISO date. The minimum ISO year-month starts on day 20.
  const day = organized.year === -271821 && organized.month === 4 ? 20 : 1
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
  calendar: InternalCalendar,
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
    throw new RangeError(errorMessages.failedYearGuess)
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
  options?: ZonedFieldOptions,
): ZonedDateTimeSlots {
  const timeZoneId = resolveTimeZoneId(organized.timeZoneId)
  const timeZoneImpl = queryTimeZone(timeZoneId)

  checkIsoDateTimeFields(organized)

  let epochNano: BigNano

  if (organized.hasTime) {
    const offsetNano = organized.offset
      ? parseOffsetNano(organized.offset)
      : undefined
    const [, offsetDisambig, epochDisambig] = refineZonedFieldOptions(options)
    epochNano = getMatchingInstantFor(
      timeZoneImpl,
      organized,
      offsetNano,
      offsetDisambig,
      epochDisambig,
      !(timeZoneImpl as FixedTimeZone).offsetNano && // not fixed?
        organized.offset !== undefined &&
        !offsetHasSeconds(organized.offset),
      organized.hasZ,
    )
  } else {
    refineZonedFieldOptions(options)
    epochNano = getStartOfDayInstantFor(timeZoneImpl, organized)
  }

  // Validate the computed epochNanoseconds is within the representable range
  checkEpochNanoInBounds(epochNano)

  return createZonedDateTimeSlots(
    epochNano,
    timeZoneImpl,
    getInternalCalendar(resolveCalendarId(organized.calendarId)),
  )
}

function finalizeDateTime(
  organized: DateTimeLikeOrganized,
): AbstractDateTimeSlots {
  checkIsoDateTimeFields(organized)
  checkIsoDateTimeInBounds(organized)
  return slotsWithCalendar(
    combineDateAndTime(organized, organized),
    getInternalCalendar(resolveCalendarId(organized.calendarId)),
  )
}

function finalizeDate(organized: DateOrganized): AbstractDateSlots {
  checkIsoDateFields(organized)
  checkIsoDateInBounds(organized)
  return {
    calendar: getInternalCalendar(resolveCalendarId(organized.calendarId)),
    year: organized.year,
    month: organized.month,
    day: organized.day,
  }
}

// RegExp
// -----------------------------------------------------------------------------

const yearMonthRegExpStr =
  `(?:(?:${signRegExpStr}(\\d{6}))|(\\d{4}))` + // 1:yearSign, 2:yearDigits6, 3:yearDigits4
  '-?(\\d{2})' // 4:month

const dateRegExpStr =
  yearMonthRegExpStr + // 1:yearSign, 2:yearDigits6, 3:yearDigits4, 4:month
  '-?(\\d{2})' // 5:day

const monthDayRegExpStr =
  '(?:--)?(\\d{2})' + // 1:month
  '-?(\\d{2})' // 2:day

const dateTimeRegExpStr =
  dateRegExpStr + // // 1:yearSign, 2:yearDigits6, 3:yearDigits4, 4:month, 5:day
  '(?:[T ]' +
  timeRegExpStr + // 6:hour, 7:minute, 8:second, 9:afterDecimal
  '(Z|' + // 10:zOrOffset
  offsetRegExpStr + // 11:offsetSign, 12:hour, 13:minute, 14:second, 15:afterDecimal
  ')?' +
  ')?'

// Would _normally_ need to modify to prevent reDoS attack,
// (like https://github.com/moment/moment/pull/6015#issuecomment-1152961973)
// BUT, this regexp is only used directly by annotationRegExp,
// which only ever runs on strings already parsed by annotationsRegExpStr
const annotationRegExpStr = '\\[(!?)([^\\]]*)\\]' // critical:1, annotation:2

// Limit the number of annotations (maximum 9) to prevent reDoS attack
const annotationsRegExpStr = `((?:${annotationRegExpStr}){0,9})` // multiple

const yearMonthRegExp = createRegExp(yearMonthRegExpStr + annotationsRegExpStr)
const monthDayRegExp = createRegExp(monthDayRegExpStr + annotationsRegExpStr)
const dateTimeRegExp = createRegExp(dateTimeRegExpStr + annotationsRegExpStr)
const timeRegExp = createRegExp(
  'T?' +
    timeRegExpStr + // 1-4
    '(?:' +
    offsetRegExpStr +
    ')?' + // 5-9
    annotationsRegExpStr, // 10
)
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

// Separator consistency: if one separator is present in a component, all must match.
// e.g. "2020-0101" is invalid because date uses both '-' and no separator.
function validateDateSeparators(s: string): boolean {
  const m = s.match(/^[+-]?(?:\d{6}|\d{4})(-?)(\d{2})(-?)(\d{2})/)
  if (!m) return true
  return m[1] === m[3]
}

function extractDateTimeTimePortion(
  s: string,
  offset: string | undefined,
): string {
  const tIndex = s.search(/[T ]/i)
  let timePortion = tIndex >= 0 ? s.slice(tIndex + 1) : ''

  if (offset !== undefined) {
    // When an explicit offset is present, separator validation should only see
    // the wall-clock time portion before that offset.
    const offsetIndex = timePortion.indexOf(offset)
    if (offsetIndex >= 0) {
      timePortion = timePortion.slice(0, offsetIndex)
    }
  } else {
    // Calendar annotations like `[u-ca=hebrew]` are allowed immediately after
    // the time. Strip them before validating `HH:mm[:ss[.fff]]` separators, or
    // strings like `2000-01-01T12:34[u-ca=gregory]` get rejected as malformed
    // time text even though the main datetime regexp already accepted them.
    const annotationIndex = timePortion.indexOf('[')
    if (annotationIndex >= 0) {
      timePortion = timePortion.slice(0, annotationIndex)
    }
  }

  return timePortion
}

function extractTimeOnlyPortion(s: string, offset: string | undefined): string {
  let timeEnd = s.length

  if (offset !== undefined) {
    timeEnd = s.indexOf(offset)
  } else {
    const annotationIndex = s.indexOf('[')
    if (annotationIndex >= 0) {
      timeEnd = annotationIndex
    }
  }

  return s.slice(0, timeEnd)
}

function extractTimeOnlyOffset(
  s: string,
  offsetSign: string | undefined,
): string | undefined {
  if (offsetSign === undefined) {
    return undefined
  }

  const offsetStart = s.indexOf(offsetSign)
  const annotationStart = s.indexOf('[', offsetStart)

  return s.slice(offsetStart, annotationStart < 0 ? undefined : annotationStart)
}

function parseDateTimeLike(s: string): DateTimeLikeOrganized | undefined {
  const parts = dateTimeRegExp.exec(s)
  if (!parts) return undefined
  if (!validateDateSeparators(parts[0])) return undefined

  // Validate time portion separator consistency (e.g. reject "00:0000")
  if (parts[6]) {
    const timePortion = extractDateTimeTimePortion(parts[0], parts[10])
    if (!validateTimeSeparators(timePortion)) return undefined
  }

  // Validate offset portion separator consistency (e.g. reject "+00:0000")
  if (parts[10] && (parts[10] || '').toUpperCase() !== 'Z') {
    if (!validateOffsetSeparators(parts[10])) return undefined
  }

  return organizeDateTimeLikeParts(parts)
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
  organizeAnnotationParts(parts[10]) // validate annotations
  return organizeTimeParts(parts)
}

function parseTimeOnlyParts(s: string): string[] | undefined {
  const parts = timeRegExp.exec(s)
  if (!parts) return undefined

  const offset = extractTimeOnlyOffset(parts[0], parts[5])
  const timePortion = extractTimeOnlyPortion(parts[0], offset)
  if (!validateTimeSeparators(timePortion)) return undefined

  // Validate the whole offset. `parts[5]` is only the sign capture from
  // offsetRegExpStr, so compact forms like "152330-08" need the substring from
  // the sign through the start of any annotation.
  if (offset) {
    parseOffsetNano(offset)
  }

  return parts
}

function parseDurationFields(s: string): DurationFields | undefined {
  const parts = durationRegExp.exec(s)
  return parts ? organizeDurationParts(parts) : undefined
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
  const zOrOffset = parts[10]
  const hasZ = (zOrOffset || '').toUpperCase() === 'Z'

  return {
    year: organizeIsoYearParts(parts),
    month: parseInt(parts[4]),
    day: parseInt(parts[5]),
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
function organizeYearMonthParts(parts: string[]): DateOrganized {
  return {
    year: organizeIsoYearParts(parts),
    month: parseInt(parts[4]),
    day: 1,
    ...organizeAnnotationParts(parts[5]),
  }
}

function organizeMonthDayParts(parts: string[]): DateOrganized {
  return {
    year: isoEpochFirstLeapYear,
    month: parseInt(parts[1]),
    day: parseInt(parts[2]),
    ...organizeAnnotationParts(parts[3]),
  }
}

function organizeIsoYearParts(parts: string[]): number {
  const yearSign = parseSign(parts[1])
  const year = parseInt(parts[2] || parts[3])

  if (yearSign < 0 && !year) {
    throw new RangeError(
      errorMessages.invalidSubstring(-0 as unknown as string),
    )
  }

  return yearSign * year
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
    throw new RangeError(errorMessages.noValidFields(durationFieldNamesAsc))
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
        throw new RangeError(errorMessages.invalidSubstring(wholeStr)) // Fraction must be last one
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
      // Lowercase calendar ID for case-insensitive matching (e.g. ISO8601 -> iso8601)
      calendarIds.push(val.toLowerCase())
      calendarIsCritical ||= isCritical
    } else if (isCritical || /[A-Z]/.test(name)) {
      // Critical annotation not used, or uppercase disallowed
      throw new RangeError(errorMessages.invalidSubstring(whole))
    }

    return ''
  })

  if (calendarIds.length > 1 && calendarIsCritical) {
    throw new RangeError(errorMessages.invalidSubstring(s)) // Multiple calendars when one is critical
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
    throw new RangeError(errorMessages.invalidSubstring(s))
  }

  return n
}
