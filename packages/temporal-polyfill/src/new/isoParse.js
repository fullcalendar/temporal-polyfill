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
  const parts = numericOffsetRegExp.exec(normalizeDashes(s))
  return parts && parseOffsetParts(parts.slice(1))
}

export function parseDuration(s) {
  // includes sign
}

// Low-level
// -------------------------------------------------------------------------------------------------

const yearMonthRegExpStr =
  '([+-]\\d{6}|\\d{4})' + // 0:year
  '-?(\\d{2})' // 1:month
  // 2:annotations

const dateRegExpStr =
  yearMonthRegExpStr + // 0:year, 1:month
  '-?(\\d{2})' // 2:day
  // 3:annotations

const monthDayRegExpStr =
  '(--)?(\\d{2})' + // 1:month
  '-?(\\d{2})' // 2:day
  // 3:annotations

const numericTimeRegExpStr =
  '(\\d{2})' + // 0:hour
  '(:?(\\d{2})' + // 2:minute (NOTE: ':?' means optional ':')
  '(:?(\\d{2})' + // 4:second
  '([.,](\\d{1,9}))?' + // 6:afterDecimal
  ')?)?'

const numericOffsetRegExpStr =
  '([+-])' + // 0:plusOrMinus
  numericTimeRegExpStr // 1:hour, 3:minute, 5:second, 7:afterDecimal

const offsetRegExpStr =
  '(Z|' + // 0:zOrOffset
  numericOffsetRegExpStr + // 1:plusOrMinus, 2:hour, 4:minute, 6:second, 8:afterDecimal
  ')?'

const timeRegExpStr =
  numericTimeRegExpStr + // 0:hour, 2:minute, 4:second, 6:afterDecimal
  offsetRegExpStr // 7:zOrOffset, 8:plusOrMinus, 9:hour, 11:minute, 13:second, 15:afterDecimal
  // 16:annotations

const dateTimeRegExpStr =
  dateRegExpStr + // 0:year, 1:month, 2:day
  '([T ]' + // 3:timeEverything
  timeRegExpStr +
  // 4:hour, 6:minute, 8:second, 10:afterDecimal
  // 11:zOrOffset, 12:plusOrMinus, 13:hour, 15:minute, 17:second, 19:afterDecimal
  ')?'
  // 20:annotations

const annotationRegExpStr = '((\\[[^\\]]*\\])*)'

const yearMonthRegExp = createRegExp(yearMonthRegExpStr + annotationRegExpStr)
const monthDayRegExp = createRegExp(monthDayRegExpStr + annotationRegExpStr)
const dateTimeRegExp = createRegExp(dateTimeRegExpStr + annotationRegExpStr)
const timeRegExp = createRegExp('T?' + timeRegExpStr + annotationRegExpStr)
const numericOffsetRegExp = createRegExp(numericOffsetRegExpStr) // annotations not allowed

function parseDateTime(s) {
  const parts = dateTimeRegExp.exec(normalizeDashes(s)) // 0 is whole-match
  return parts && constrainIsoDateTimeInternals({
    isoYear: parseInt1(parts[1]),
    isoMonth: parseInt1(parts[2]),
    isoDay: parseInt1(parts[3]),
    ...parseTimeParts(parts.slice(5)), // parses annotations
  })
}

function parseYearMonth(s) {
  const parts = yearMonthRegExp.exec(normalizeDashes(s)) // 0 is whole-match
  return parts && constrainIsoDateInternals({
    isoYear: parseInt1(parts[1]),
    isoMonth: parseInt1(parts[2]),
    isoDay: 1,
    ...parseAnnotations(parts[3]),
  })
}

function parseMonthDay(s) {
  const parts = monthDayRegExp.exec(normalizeDashes(s)) // 0 is whole-match
  return parts && constrainIsoDateInternals({
    isoYear: parseInt1(parts[0]),
    isoMonth: parseInt1(parts[1]),
    isoDay: 1,
    ...parseAnnotations(parts[2]),
  })
}

function parseTime(s) {
  const parts = timeRegExp.exec(normalizeDashes(s)) // 0 is whole-match
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
  return (parts[0] === '+' ? 1 : -1) * (
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

const unicodeDashRegExp = /\u2212/g

function normalizeDashes(str) {
  return str.replace(unicodeDashRegExp, '-')
}

function createRegExp(meat) {
  return new RegExp(`^${meat}$`, 'i')
}

function parseIntWithDefault(defaultInt, s) {
  if (s === undefined) {
    return defaultInt
  }
  const n = parseInt(s)
  if (Object.is(n, -0)) {
    throw RangeError('no negative zero')
  }
  return n
}

const parseInt0 = parseIntWithDefault.bind(undefined, 0)
const parseInt1 = parseIntWithDefault.bind(undefined, 1)
