import { unitNanoMap, nanoInSec, nanoInUtcDay } from './units'
import { isoCalendarId } from './calendarConfig'
import {
  DurationFields,
  DurationFieldsWithSign,
  durationFieldNamesAsc,
  negateDurationFields,
  updateDurationFieldsSign,
} from './durationFields'
import {
  IsoDateFields,
  IsoDateTimeFields,
  IsoTimeFields,
  constrainIsoTimeFields,
  constrainIsoDateLike,
  constrainIsoDateTimeLike,
  isIsoDateFieldsValid,
} from './isoFields'
import {
  checkIsoDateInBounds,
  checkIsoDateTimeInBounds,
  checkIsoYearMonthInBounds,
  isoEpochFirstLeapYear,
  isoToEpochNanoWithOffset,
  nanoToIsoTimeAndDay,
  moveByIsoDays,
} from './isoMath'
import { EpochDisambig, OffsetDisambig, Overflow } from './options'
import { FixedTimeZoneImpl } from './timeZoneImpl'
import { queryTimeZoneImpl } from './timeZoneImplQuery'
import { getMatchingInstantFor } from './timeZoneMath'
import {
  TimeUnit,
  Unit,
  nanoInHour,
  nanoInMinute,
  nanoToGivenFields,
} from './units'
import { divModFloor } from './utils'
import { DayTimeNano } from './dayTimeNano'
import { utcTimeZoneId } from './timeZoneConfig'
import { MoveOps } from './calendarOps'
import { createNativeMoveOps, createNativePartOps } from './calendarNativeQuery'

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

export function parsePlainYearMonth(s: string): IsoDateFields & { calendar: string } {
  let organized = parseMaybeYearMonth(s)

  if (organized) {
    if (organized.calendar !== isoCalendarId) {
      throw new RangeError('Invalid calendar')
    }

    return postProcessYearMonthOnly(organized)
  }

  const isoFields = parsePlainDate(s)
  const calendarOps = createNativeMoveOps(isoFields.calendar)
  const movedIsoFields = movePlainYearMonthToDay(
    calendarOps,
    parsePlainDate(s),
  )

  return {
    ...isoFields, // has calendar
    ...movedIsoFields,
  }
}

function postProcessYearMonthOnly(organized: DateOrganized): IsoDateFields & { calendar: string } {
  return checkIsoYearMonthInBounds(constrainIsoDateLike(organized))
}

// TODO: DRY
function movePlainYearMonthToDay(
  calendarRecord: MoveOps,
  isoFields: IsoDateFields,
  day = 1,
): IsoDateFields {
  return moveByIsoDays(
    isoFields,
    day - calendarRecord.day(isoFields),
  )
}

export function parsePlainMonthDay(s: string): IsoDateFields & { calendar: string } {
  const organized = parseMaybeMonthDay(s)

  if (organized) {
    if (organized.calendar !== isoCalendarId) {
      throw new RangeError('Invalid calendar')
    }

    return postProcessMonthDayOnly(organized)
  }

  return findBestYear(parsePlainDate(s))
}

function postProcessMonthDayOnly(organized: DateOrganized): IsoDateFields & { calendar: string } {
  const isoFields = constrainIsoDateLike(organized)
  const calendarOps = createNativePartOps(organized.calendar)
  const [year, month, day] = calendarOps.dateParts(isoFields)

  return {
    ...calendarOps.monthDayFromFields({ year, month, day }),
    calendar: organized.calendar,
  }
}

function findBestYear(
  isoFields: IsoDateFields & { calendar: string },
): IsoDateFields & { calendar: string } {
  const calendarOps = createNativePartOps(isoFields.calendar)
  const [year, month, day] = calendarOps.dateParts(isoFields)

  // okay?????? was using refinePlainMonthDayBag before
  return {
    ...calendarOps.monthDayFromFields({ year, month, day }),
    calendar: isoFields.calendar,
  }
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

export function parseDuration(s: string): DurationFieldsWithSign {
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

/*
Validates whether it's a supported id
*/
export function parseCalendarId(s: string): string {
  const res = parseMaybeGenericDateTime(s) || parseMaybeYearMonth(s) || parseMaybeMonthDay(s)

  // NOTE: only islamicc is normalized. all other calendarIds that produce valid DateTimeFormats are kept as-is

  if (res) {
    return queryCalendarImpl(res.calendar).id // normalize (not DRY)
  }

  return queryCalendarImpl(s).id // normalize (not DRY)
}

/*
Validates whether it's a supported id
*/
export function parseTimeZoneId(s: string): string {
  const parsed = parseMaybeGenericDateTime(s)

  if (parsed !== undefined) {
    if (parsed.timeZone) {
      return queryTimeZoneImpl(parsed.timeZone).id // normalize (not DRY)
    }
    if (parsed.hasZ) {
      return utcTimeZoneId
    }
    if (parsed.offset) {
      // normalize (not DRY)
      // important for prevent sub-second offset values. inefficient
      return queryTimeZoneImpl(parsed.offset).id
    }
  }

  return queryTimeZoneImpl(s).id // normalize (not DRY)
}

// Post-processing organized result
// -------------------------------------------------------------------------------------------------

function postProcessZonedDateTime(
  organized: ZonedDateTimeOrganized,
  offsetNano: number | undefined, // HACK
  offsetDisambig: OffsetDisambig = OffsetDisambig.Reject,
  epochDisambig: EpochDisambig = EpochDisambig.Compat,
): { epochNanoseconds: DayTimeNano, timeZone: string, calendar: string } {
  const calendarImpl = queryCalendarImpl(organized.calendar)
  const timeZoneImpl = queryTimeZoneImpl(organized.timeZone)

  const epochNanoseconds = getMatchingInstantFor(
    timeZoneImpl, // CRAZY this works!
    constrainIsoDateTimeLike(organized),
    offsetNano,
    organized.hasZ,
    offsetDisambig,
    epochDisambig,
    !(timeZoneImpl instanceof FixedTimeZoneImpl), // only allow fuzzy minute-rounding matching if named-timezone
      // TODO: ^^^ do this for 'UTC'? (which is normalized to FixedTimeZoneImpl?). Probably not.
  )

  return {
    epochNanoseconds,
    timeZone: timeZoneImpl.id, // normalized
    calendar: calendarImpl.id, // normalized
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
    calendar: queryCalendarImpl(organized.calendar).id, // normalize
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

function parseMaybeDurationInternals(s: string): DurationFieldsWithSign | undefined {
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

function organizeDurationParts(parts: string[]): DurationFieldsWithSign {
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
    durationFields = negateDurationFields(durationFields)
  }

  return updateDurationFieldsSign(durationFields)

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
