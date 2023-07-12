import { nanoIn, nanoInSecond } from '../dateUtils/units'
import { isoCalendarId } from './calendarConfig'
import { queryCalendarImpl } from './calendarImpl'
import {
  DurationInternals,
  durationFieldNamesAsc,
  negateDurationFields,
  updateDurationFieldsSign,
} from './durationFields'
import { isoTimeFieldDefaults } from './isoFields'
import {
  checkIsoDateTimeInternals,
  constrainIsoDateInternals,
  constrainIsoDateTimeInternals,
  constrainIsoTimeFields,
  isoToEpochNano,
  nanoToIsoTimeAndDay,
} from './isoMath'
import { returnUndefinedI } from './options'
import { queryTimeZoneImpl } from './timeZoneImpl'
import { getMatchingInstantFor, utcTimeZoneId } from './timeZoneOps'
import {
  hourIndex,
  milliIndex,
  minuteIndex,
  nanoInHour,
  nanoInMinute,
  nanoToGivenFields,
  secondsIndex,
} from './units'
import { divFloorMod } from './utils'

// High-level
// -------------------------------------------------------------------------------------------------

export function parseInstant(s) {
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
    return new RangeError()
  }

  return isoToEpochNano(parsed).addNumber(offsetNano)
}

export function parseMaybeZonedDateTime(s) {
  const parsed = parseDateTime(s)
  if (!parsed) {
    throw new RangeError()
  }
  if (parsed.timeZone) {
    return processZonedDateTimeParse(parsed)
  }
  return processDatelikeParse(parsed) // unnecessarily checks for undefined
}

export function parseZonedDateTime(s) {
  const parsed = parseDateTime(s)
  if (!parsed || !parsed.timeZone) {
    throw new RangeError()
  }
  return processZonedDateTimeParse(parsed)
}

export function parsePlainDateTime(s) {
  const parsed = parseDateTime(s)
  if (!parsed) {
    throw new RangeError()
  }
  return processDateTimeParse(parsed)
}

export function parsePlainDate(s) {
  return processDatelikeParse(parseDateTime(s))
}

export function parsePlainYearMonth(s) {
  return processDatelikeParse(parseYearMonth(s) || parseDateTime(s))
}

export function parsePlainMonthDay(s) {
  return processDatelikeParse(parseMonthDay(s) || parseDateTime(s))
}

export function parsePlainTime(s) {
  let parsed = parseTime(s)

  if (!parsed) {
    parsed = parseDateTime(s)
    if (parsed && !parsed.hasTime) {
      throw new RangeError()
    }
  }

  if (!parsed) {
    throw new RangeError()
  }
  if (parsed.hasZ) {
    throw new RangeError()
  }
  if (parsed.calendar && parsed.calendar.id !== isoCalendarId) {
    throw new RangeError()
  }

  let altParsed
  if ((altParsed = parseYearMonth(s)) && constrainIsoDateInternals(altParsed, returnUndefinedI)) {
    throw new RangeError()
  }
  if ((altParsed = parseMonthDay(s)) && constrainIsoDateInternals(altParsed, returnUndefinedI)) {
    throw new RangeError()
  }

  return constrainIsoTimeFields(parsed)
}

export function parseCalendarId(s) {
  if (s !== isoCalendarId) {
    s = (
      parseDateTime(s) || parseYearMonth(s) || parseMonthDay(s)
    )?.calendar.id || isoCalendarId
  }
  return s
}

export function parseTimeZoneId(s) {
  const parsed = parseDateTime(s)

  if (parsed !== undefined) {
    if (parsed.timeZone) {
      return parsed.timeZone.id
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

function processZonedDateTimeParse(parsed) {
  const epochNanoseconds = getMatchingInstantFor(
    parsed.timeZone,
    parsed,
    parsed.offset ? parseOffsetNano(parsed.offset) : undefined,
    parsed.z,
    'reject',
    'compatible',
    true, // fuzzy
  )
  return {
    epochNanoseconds,
    timeZone: parsed.timeZone,
    calendar: parsed.calendar,
  }
}

function processDateTimeParse(parsed) {
  return checkIsoDateTimeInternals(constrainIsoDateTimeInternals(parsed))
}

/*
Unlike others, throws an error
*/
function processDatelikeParse(parsed) {
  if (!parsed) {
    throw new RangeError()
  }
  return checkIsoDateTimeInternals(constrainIsoDateInternals(parsed))
}

// Low-level
// -------------------------------------------------------------------------------------------------

function parseDateTime(s) {
  const parts = dateTimeRegExp.exec(s)
  return parts && parseDateTimeParts(parts)
}

function parseYearMonth(s) {
  const parts = yearMonthRegExp.exec(s)
  return parts && parseYearMonthParts(parts)
}

function parseMonthDay(s) {
  const parts = monthDayRegExp.exec(s)
  return parts && parseMonthDayParts(parts)
}

function parseTime(s) {
  const parts = timeRegExp.exec(s)
  return parts && parseTimeParts(parts.slice(1))
}

export function parseOffsetNano(s) {
  const parts = offsetRegExp.exec(s)
  return parts && parseOffsetParts(parts.slice(1))
}

// TODO: this should be guaranteed result
export function parseDuration(s: string): DurationInternals {
  const parts = durationRegExp.exec(s)
  return parts && parseDurationParts(parts)
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

function parseDateTimeParts(parts) { // 0 is whole-match
  const hasTime = parts[5] // boolean-like
  const hasZ = parts[13] // "

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
  }
}

function parseYearMonthParts(parts) { // 0 is whole-match
  return {
    isoYear: parseIsoYearParts(parts),
    isoMonth: parseInt(parts[3]),
    isoDay: 1,
    ...parseAnnotations(parts[4]),
  }
}

function parseMonthDayParts(parts) { // 0 is whole-match
  return {
    isoYear: parseInt(parts[1]),
    isoMonth: parseInt(parts[2]),
    isoDay: 1,
    ...parseAnnotations(parts[3]),
  }
}

function parseIsoYearParts(parts) { // 0 is whole-match
  const yearSign = parseSign(parts[1])
  const year = parseInt(parts[2])
  if (yearSign < 0 && !year) {
    throw new RangeError('Negative zero not allowed')
  }
  return yearSign * year
}

function parseTimeParts(parts) { // parses annotations
  const isoSecond = parseInt0(parts[4])
  return {
    ...nanoToIsoTimeAndDay(parseSubsecNano(parts[6] || ''))[0],
    isoHour: parseInt0(parts[0]),
    isoMinute: parseInt0(parts[2]),
    isoSecond: isoSecond === 60 ? 59 : isoSecond, // massage leap-second
    ...parseAnnotations(parts[16]),
  }
}

function parseOffsetParts(parts) {
  return parseSign(parts[0]) * (
    parseInt0(parts[0]) * nanoInHour +
    parseInt0(parts[2]) * nanoInMinute +
    parseInt0(parts[4]) * nanoInSecond +
    parseSubsecNano(parts[6] || '')
  )
}

function parseDurationParts(parts) {
  let hasAny = false
  let hasAnyFrac = false
  let leftoverNano = 0
  let durationFields = {
    years: parseUnit(parts[2]),
    months: parseUnit(parts[3]),
    weeks: parseUnit(parts[4]),
    days: parseUnit(parts[5]),
    hours: parseUnit(parts[7], parts[8], hourIndex),
    minutes: parseUnit(parts[9], parts[10], minuteIndex),
    seconds: parseUnit(parts[11], parts[12], secondsIndex),
    ...nanoToGivenFields(leftoverNano, milliIndex, durationFieldNamesAsc),
  }

  if (!hasAny) {
    throw new RangeError('Duration string must have at least one field')
  }

  if (parseSign(parts[1]) < 0) {
    durationFields = negateDurationFields(durationFields)
  }

  return updateDurationFieldsSign(durationFields)

  function parseUnit(wholeStr, fracStr, timeUnitI) {
    let leftoverUnits = 0 // from previous round
    let wholeUnits = 0

    if (timeUnitI) {
      [leftoverUnits, leftoverNano] = divFloorMod(leftoverNano, nanoIn[timeUnitI])
    }

    if (wholeStr !== undefined) {
      if (hasAnyFrac) {
        throw new RangeError('Fraction must be last one')
      }

      wholeUnits = parseInt(wholeStr)
      hasAny = true

      if (fracStr) {
        // convert seconds to other units, abusing parseSubsecNano
        leftoverNano = parseSubsecNano(fracStr) * (nanoIn[timeUnitI] / nanoInSecond)
        hasAnyFrac = true
      }
    }

    return leftoverUnits + wholeUnits
  }
}

// Utils
// -------------------------------------------------------------------------------------------------

function parseAnnotations(s) {
  let calendarId
  let timeZoneId

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
    timeZone: timeZoneId && queryTimeZoneImpl(timeZoneId),
  }
}

function parseSubsecNano(fracStr) {
  return parseInt(fracStr.padEnd(9, '0'))
}

function createRegExp(meat) {
  return new RegExp(`^${meat}$`, 'i')
}

function parseSign(s) {
  return !s || s === '+' ? 1 : -1
}

function parseInt0(s) {
  return s === undefined ? 0 : parseInt(s)
}
