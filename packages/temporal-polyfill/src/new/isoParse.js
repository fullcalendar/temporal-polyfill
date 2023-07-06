import { nanoInSecond } from '../dateUtils/units'
import { isoCalendarId } from './calendarConfig'
import { queryCalendarImpl } from './calendarImpl'
import {
  pluckIsoDateInternals,
  pluckIsoDateTimeInternals,
  pluckIsoTimeFields,
} from './isoFields'
import {
  constrainIsoDateInternals,
  constrainIsoDateTimeInternals,
  constrainIsoTimeFields,
  isoToEpochNano,
  nanoToIsoTimeAndDay,
} from './isoMath'
import { queryTimeZoneImpl } from './timeZoneImpl'
import { getMatchingInstantFor, utcTimeZoneId } from './timeZoneOps'
import { nanoInHour, nanoInMinute } from './units'

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

export function parseZonedDateTime(s) {
  const parsed = parseDateTime(s)
  if (!parsed || !parsed.timeZone) {
    throw new RangeError()
  }
  return processZonedDateTimeParse(parsed)
}

export function processZonedDateTimeParse(parsed) {
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

export function parsePlainDateTime(s) {
  const parsed = parseDateTime(s)
  if (!parsed) {
    throw new RangeError()
  }
  return pluckIsoDateTimeInternals(parsed)
}

export function parsePlainDate(s) {
  const parsed = parseDateTime(s)
  if (!parsed) {
    throw new RangeError()
  }
  return pluckIsoDateInternals(parsed)
}

export function parsePlainYearMonth(s) {
  return parseYearMonth(s) || parsePlainDate(s) // parsePlainDate will throw error
}

export function parsePlainMonthDay(s) {
  return parseMonthDay(s) || parsePlainDate(s) // parsePlainDate will throw error
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
  if (parsed.calendar !== undefined && parsed.calendar.id !== isoCalendarId) {
    throw new RangeError()
  }
  if (parseMonthDay(s)) {
    throw new RangeError()
  }
  if (parseYearMonth(s)) {
    throw new RangeError()
  }

  return pluckIsoTimeFields(parsed)
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

export function parseOffsetNano(s) {
  const parts = offsetRegExp.exec(s)
  return parts && parseOffsetParts(parts.slice(1))
}

export function parseDuration(s) {
  const parts = durationRegExp.exec(s)
  console.log(parts)
}

// Low-level
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
  // 4:annotations

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

const annotationRegExpStr = '((\\[[^\\]]*\\])*)'

const yearMonthRegExp = createRegExp(yearMonthRegExpStr + annotationRegExpStr)
const monthDayRegExp = createRegExp(monthDayRegExpStr + annotationRegExpStr)
const dateTimeRegExp = createRegExp(dateTimeRegExpStr + annotationRegExpStr)
const timeRegExp = createRegExp('T?' + timeRegExpStr + annotationRegExpStr)
const offsetRegExp = createRegExp(offsetRegExpStr) // annotations not allowed

const durationRegExp = createRegExp(
  `${plusOrMinusRegExpStr}?P` +
  '(\\d+Y)?(\\d+M)?(\\d+W)?(\\d+D)?' +
  '(T' +
  `((\\d+)${fractionRegExpStr}H)?` +
  `((\\d+)${fractionRegExpStr}M)?` +
  `((\\d+)${fractionRegExpStr}S)?` +
  ')?',
)

function parseDateTime(s) {
  const parts = dateTimeRegExp.exec(s) // 0 is whole-match
  return parts && constrainIsoDateTimeInternals({
    isoYear: parseIsoYearParts(parts),
    isoMonth: parseInt(parts[3]),
    isoDay: parseInt(parts[4]),
    ...parseTimeParts(parts.slice(6)), // parses annotations
  })
}

function parseYearMonth(s) {
  const parts = yearMonthRegExp.exec(s) // 0 is whole-match
  return {
    isoYear: parseIsoYearParts(parts),
    isoMonth: parseInt(parts[3]),
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

function parseMonthDay(s) {
  const parts = monthDayRegExp.exec(s) // 0 is whole-match
  return parts && constrainIsoDateInternals({
    isoYear: parseInt(parts[1]),
    isoMonth: parseInt(parts[2]),
    isoDay: 1,
    ...parseAnnotations(parts[3]),
  })
}

function parseTime(s) {
  const parts = timeRegExp.exec(s) // 0 is whole-match
  return constrainIsoTimeFields(parseTimeParts(parts.slice(1)))
}

function parseTimeParts(parts) { // parses annotations
  const isoSecond = parseInt0(parts[4])
  return {
    ...nanoToIsoTimeAndDay(parseNanoAfterDecimal(parts[6] || ''))[0],
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
    parseNanoAfterDecimal(parts[6] || '')
  )
}

function parseNanoAfterDecimal(str) {
  return parseInt(str.padEnd(9, '0'))
}

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
    timeZone: timeZoneId ? queryTimeZoneImpl(timeZoneId) : undefined,
  }
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
