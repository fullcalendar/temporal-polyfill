import { unitNanoMap, nanoInSec, nanoInUtcDay } from './units'
import { gregoryCalendarId, isoCalendarId } from './calendarConfig'
import {
  DurationFields,
  durationFieldNamesAsc,
  negateDuration,
} from './durationFields'
import {
  IsoDateFields,
  IsoDateTimeFields,
  IsoTimeFields,
  constrainIsoTimeFields,
  constrainIsoDateLike,
  constrainIsoDateTimeLike,
  isIsoDateFieldsValid,
} from './calendarIsoFields'
import {
  isoEpochFirstLeapYear,
} from './calendarIso'
import {
  checkIsoDateInBounds,
  checkIsoDateTimeInBounds,
  checkIsoYearMonthInBounds, isoToEpochNanoWithOffset,
  nanoToIsoTimeAndDay
} from './epochAndTime'
import { EpochDisambig, OffsetDisambig, Overflow } from './options'
import { FixedTimeZone } from './timeZoneNative'
import { queryNativeTimeZone } from './timeZoneNative'
import { getMatchingInstantFor } from './timeZoneOps'
import {
  TimeUnit,
  Unit,
  nanoInHour,
  nanoInMinute,
  nanoToGivenFields,
} from './units'
import { divModFloor } from './utils'
import { DayTimeNano } from './dayTimeNano'
import { utcTimeZoneId } from './timeZoneNative'
import { queryIntlCalendar } from './calendarIntl'
import { NativeMonthDayParseOps, NativeYearMonthParseOps } from './calendarNative'
import { moveToMonthStart } from './move'

// High-level
// -------------------------------------------------------------------------------------------------

export function parseInstant(s: string): DayTimeNano {
  const organized = parseMaybeGenericDateTime(s)
  if (!organized) {
    throw new RangeError()
  }

  let offsetNano

  if (organized.hasZ) {
    offsetNano = 0
  } else if (organized.offset) {
    offsetNano = parseOffsetNano(organized.offset)
  } else {
    throw new RangeError()
  }

  // validate timezone
  if (organized.timeZone) {
    parseMaybeOffsetNano(organized.timeZone, true) // onlyHourMinute=true
  }

  return isoToEpochNanoWithOffset(
    constrainIsoDateTimeLike(organized),
    offsetNano,
  )
}

export function parseZonedOrPlainDateTime(s: string): (IsoDateFields & { calendar: string }) | { epochNanoseconds: DayTimeNano, timeZone: string, calendar: string } {
  const organized = parseMaybeGenericDateTime(s)

  if (!organized) {
    throw new RangeError()
  }
  if (organized.timeZone) {
    return postProcessZonedDateTime(
      organized as ZonedDateTimeOrganized,
      organized.offset ? parseOffsetNano(organized.offset) : undefined, // HACK
    )
  }
  if (organized.hasZ) {
    throw new RangeError('Only Z cannot be parsed for this') // PlainDate doesn't accept it
  }

  return postProcessDateTime(organized)
}

/*
NOTE: one of the only string-parsing methods that accepts options
*/
export function parseZonedDateTime(
  s: string,
  overflow: Overflow, // unused!
  offsetDisambig: OffsetDisambig,
  epochDisambig: EpochDisambig,
): { epochNanoseconds: DayTimeNano, timeZone: string, calendar: string } {
  const organized = parseMaybeGenericDateTime(s)

  if (!organized || !organized.timeZone) {
    throw new RangeError()
  }

  // HACK to validate offset before parsing options
  const { offset } = organized
  const offsetNano = offset ? parseOffsetNano(offset) : undefined

  return postProcessZonedDateTime(
    organized as ZonedDateTimeOrganized,
    offsetNano, // HACK
    offsetDisambig,
    epochDisambig,
  )
}

export function parsePlainDateTime(s: string): IsoDateTimeFields & { calendar: string } {
  const organized = parseMaybeGenericDateTime(s)

  if (!organized || organized.hasZ) {
    throw new RangeError()
  }

  return postProcessDateTime(organized)
}

export function parsePlainDate(s: string): IsoDateFields & { calendar: string } {
  const organized = parseMaybeGenericDateTime(s)

  if (!organized || organized.hasZ) {
    throw new RangeError()
  }

  // TODO: use pluckIsoDateInternals
  return organized.hasTime
    ? postProcessDateTime(organized)
    : postProcessDate(organized)
}

export function parsePlainYearMonth(
  getCalendarOps: (calendarId: string) => NativeYearMonthParseOps,
  s: string,
): IsoDateFields & { calendar: string } {
  let organized = parseMaybeYearMonth(s)

  if (organized) {
    if (organized.calendar !== isoCalendarId) {
      throw new RangeError('Invalid calendar')
    }

    return postProcessYearMonthOnly(organized)
  }

  const isoFields = parsePlainDate(s)
  const calendarOps = getCalendarOps(isoFields.calendar)
  const movedIsoFields = moveToMonthStart(calendarOps, isoFields)

  return {
    ...isoFields, // has calendar
    ...movedIsoFields,
  }
}

function postProcessYearMonthOnly(organized: DateOrganized): IsoDateFields & { calendar: string } {
  return checkIsoYearMonthInBounds(constrainIsoDateLike(organized))
}

export function parsePlainMonthDay(
  getCalendarOps: (calendarId: string) => NativeMonthDayParseOps,
  s: string,
): IsoDateFields & { calendar: string } {
  const organized = parseMaybeMonthDay(s)

  if (organized) {
    if (organized.calendar !== isoCalendarId) {
      throw new RangeError('Invalid calendar')
    }

    return constrainIsoDateLike(organized) // `organized` has isoEpochFirstLeapYear
  }

  const dateSlots = parsePlainDate(s)
  const { calendar } = dateSlots
  const calendarOps = getCalendarOps(calendar)

  // normalize year&month to be as close as possible to epoch
  const [origYear, origMonth, day] = calendarOps.dateParts(dateSlots)
  const [monthCodeNumber, isLeapMonth] = calendarOps.monthCodeParts(origYear, origMonth)
  const [year, month] = calendarOps.yearMonthForMonthDay(monthCodeNumber, isLeapMonth, day)
  const isoFields = calendarOps.isoFields(year, month, day)

  return { ...isoFields, calendar }
}


export function parsePlainTime(s: string): IsoTimeFields {
  let organized: IsoTimeFields | GenericDateTimeOrganized | undefined = parseMaybeTime(s)

  if (!organized) {
    organized = parseMaybeGenericDateTime(s)

    if (organized) {
      if (!(organized as GenericDateTimeOrganized).hasTime) {
        throw new RangeError()
      }
      if ((organized as GenericDateTimeOrganized).hasZ) {
        throw new RangeError()
      }
      if ((organized as GenericDateTimeOrganized).calendar !== isoCalendarId) {
        throw new RangeError()
      }
    } else {
      throw new RangeError('Invalid time string')
    }
  }

  let altParsed: DateOrganized | undefined
  if ((altParsed = parseMaybeYearMonth(s)) && isIsoDateFieldsValid(altParsed)) {
    throw new RangeError()
  }
  if ((altParsed = parseMaybeMonthDay(s)) && isIsoDateFieldsValid(altParsed)) {
    throw new RangeError()
  }

  return constrainIsoTimeFields(organized, Overflow.Reject)
}

export function parseDuration(s: string): DurationFields {
  const parsed = parseMaybeDurationInternals(s)

  if (!parsed) {
    throw new RangeError()
  }

  return parsed
}

export function parseOffsetNano(s: string): number {
  const offsetNano = parseMaybeOffsetNano(s)

  if (offsetNano === undefined) {
    throw new RangeError('Invalid offset string')
  }

  return offsetNano
}

export function parseCalendarId(s: string): string {
  const res = parseMaybeGenericDateTime(s) || parseMaybeYearMonth(s) || parseMaybeMonthDay(s)
  return res ? res.calendar : s
}

export function realizeCalendarId(calendarId: string): string {
  calendarId = normalizeCalendarId(calendarId)

  // check that it's valid. DRY enough with createNativeOpsCreator?
  if (calendarId !== isoCalendarId && calendarId !== gregoryCalendarId) {
    queryIntlCalendar(calendarId)
  }

  return calendarId // return original instead of using queried-result. keeps id extensions
}

export function normalizeCalendarId(calendarId: string): string {
  calendarId = calendarId.toLocaleLowerCase()

  if (calendarId === 'islamicc') {
    calendarId = 'islamic-civil'
  }

  return calendarId
}

export function parseTimeZoneId(s: string): string {
  const parsed = parseMaybeGenericDateTime(s)

  if (parsed !== undefined) {
    if (parsed.timeZone) {
      return parsed.timeZone
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

export function realizeTimeZoneId(calendarId: string): string {
  return queryNativeTimeZone(calendarId).id // queryTimeZoneImpl will normalize the id
}

// Post-processing organized result
// -------------------------------------------------------------------------------------------------

function postProcessZonedDateTime(
  organized: ZonedDateTimeOrganized,
  offsetNano: number | undefined, // HACK
  offsetDisambig: OffsetDisambig = OffsetDisambig.Reject,
  epochDisambig: EpochDisambig = EpochDisambig.Compat,
): { epochNanoseconds: DayTimeNano, timeZone: string, calendar: string } {
  const timeZoneImpl = queryNativeTimeZone(organized.timeZone)

  const epochNanoseconds = getMatchingInstantFor(
    timeZoneImpl,
    constrainIsoDateTimeLike(organized),
    offsetNano,
    organized.hasZ,
    offsetDisambig,
    epochDisambig,
    !(timeZoneImpl instanceof FixedTimeZone), // only allow fuzzy minute-rounding matching if named-timezone
      // TODO: ^^^ do this for 'UTC'? (which is normalized to FixedTimeZoneImpl?). Probably not.
  )

  return {
    epochNanoseconds,
    timeZone: timeZoneImpl.id,
    calendar: realizeCalendarId(organized.calendar),
  }
}

function postProcessDateTime(organized: GenericDateTimeOrganized): IsoDateTimeFields & { calendar: string } {
  return normalizeCalendarStr(checkIsoDateTimeInBounds(constrainIsoDateTimeLike(organized)))
}

function postProcessDate(organized: DateOrganized): IsoDateFields & { calendar: string } {
  return normalizeCalendarStr(checkIsoDateInBounds(constrainIsoDateLike(organized)))
}

function normalizeCalendarStr<T extends { calendar: string }>(organized: T): T {
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
// TODO: use new `Falsy` type instead of ternary operator?

function parseMaybeGenericDateTime(s: string): GenericDateTimeOrganized | undefined {
  const parts = dateTimeRegExp.exec(s)
  return parts ? organizeGenericDateTimeParts(parts) : undefined
}

function parseMaybeYearMonth(s: string): DateOrganized | undefined {
  const parts = yearMonthRegExp.exec(s)
  return parts ? organizeYearMonthParts(parts) : undefined
}

function parseMaybeMonthDay(s: string): DateOrganized | undefined {
  const parts = monthDayRegExp.exec(s)
  return parts ? organizeMonthDayParts(parts) : undefined
}

function parseMaybeTime(s: string): IsoTimeFields | undefined {
  const parts = timeRegExp.exec(s)
  return parts
    ? (organizeAnnotationParts(parts[10]), organizeTimeParts(parts)) // validate annotations
    : undefined
}

function parseMaybeDurationInternals(s: string): DurationFields | undefined {
  const parts = durationRegExp.exec(s)
  return parts ? organizeDurationParts(parts) : undefined
}

export function parseMaybeOffsetNano(s: string, onlyHourMinute?: boolean): number | undefined {
  const parts = offsetRegExp.exec(s)
  return parts ? organizeOffsetParts(parts, onlyHourMinute) : undefined
}

// Parts Organization
// -------------------------------------------------------------------------------------------------

type GenericDateTimeOrganized = IsoDateTimeFields & {
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

function organizeGenericDateTimeParts(parts: string[]): GenericDateTimeOrganized {
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
function organizeYearMonthParts(parts: string[]): IsoDateFields & { calendar: string } {
  return {
    isoYear: organizeIsoYearParts(parts),
    isoMonth: parseInt(parts[4]),
    isoDay: 1,
    ...organizeAnnotationParts(parts[5]),
  }
}

function organizeMonthDayParts(parts: string[]): IsoDateFields & { calendar: string } {
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
    throw new RangeError('Negative zero not allowed')
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
  if (onlyHourMinute && (parts[4] || parts[5])) {
    throw new RangeError('Does not accept sub-minute')
  }

  const offsetNanoPos = (
    parseInt0(parts[2]) * nanoInHour +
    parseInt0(parts[3]) * nanoInMinute +
    parseInt0(parts[4]) * nanoInSec +
    parseSubsecNano(parts[5] || '')
  )

  // TODO: DRY with timeZoneSlot util?
  if (offsetNanoPos >= nanoInUtcDay) {
    throw new RangeError('Offset too large')
  }

  return parseSign(parts[1]) * offsetNanoPos
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
    throw new RangeError('Duration string must have at least one field')
  }

  if (parseSign(parts[1]) < 0) {
    durationFields = negateDuration(durationFields)
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
        throw new RangeError('Fraction must be last one')
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
        throw new RangeError('Cannot specify timeZone multiple times')
      }
      timeZoneId = val
    } else if (name === 'u-ca') {
      calendarIds.push(val)
      calendarIsCritical ||= isCritical
    } else if (isCritical) {
      throw new RangeError(`Critical annotation '${name}' not used`)
    }

    return ''
  })

  if (calendarIds.length > 1 && calendarIsCritical) {
    throw new RangeError('Multiple calendar when one is critical')
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
    throw new RangeError('Number out of range')
  }

  return n
}
