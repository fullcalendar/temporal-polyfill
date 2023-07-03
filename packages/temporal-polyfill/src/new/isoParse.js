import { isoCalendarId } from './calendarConfig'
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
} from './isoMath'
import { getMatchingInstantFor, utcTimeZoneId } from './timeZoneOps'

// TODO: finish isoParse

// High-level
// -------------------------------------------------------------------------------------------------

export function parseInstant(s) {
  const parsed = parseDateTime(s)

  if (parsed) {
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

  throw new RangeError()
}

export function parseZonedDateTime(s) {
  const parsed = parseDateTime(s) // TODO: use just 'calendar' and 'timeZone' ?

  if (parsed) {
    if (!parsed.timeZone) {
      throw new RangeError()
    }
    return processZonedDateTimeParse(parsed)
  }

  throw new RangeError()
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
  if (parsed) {
    return pluckIsoDateTimeInternals(parsed)
  }

  throw new RangeError()
}

export function parsePlainDate(s) {
  const parsed = parseDateTime(s)
  if (parsed) {
    return parsed
  }

  throw new RangeError()
}

export function parsePlainYearMonth(s) {
  let parsed = parseYearMonth(s)
  if (!parsed) {
    parsed = parseDateTime(s)
    if (parsed) {
      parsed = pluckIsoDateInternals(parsed)
    }
  }

  if (parsed) {
    return parsed
  }

  throw new RangeError()
}

export function parsePlainMonthDay(s) {
  let parsed = parseMonthDay(s)
  if (!parsed) {
    parsed = parseDateTime(s)
    if (parsed) {
      parsed = pluckIsoDateInternals(parsed)
    }
  }

  if (parsed) {
    return parsed
  }

  throw new RangeError()
}

export function parsePlainTime(s) {
  let parsed = parseTime(s)

  if (!parsed) {
    parsed = parseDateTime(s)

    if (parsed && !parsed.hasTime) {
      throw new RangeError()
    }
  }

  if (parsed) {
    if (parsed.hasZ) {
      throw new RangeError()
    }
    if (parsed.calendar !== undefined && parsed.calendar !== isoCalendarId) {
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

  throw new RangeError()
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

// Low-level
// -------------------------------------------------------------------------------------------------

function parseDateTime(s) {
  return constrainIsoDateTimeInternals({
    // { isYear, isoMonth, isoDay,
    //   isoHour, isMinute, isoSecond, etc...
    //   hasTime, hasZ, offset,
    //   calendar, timeZone }
    //
    // should use `queryCalendarOps(parsed.calendar || isoCalendarId)`
    // should use `queryTimeZoneOps(parsed.timeZone)`
  })
}

function parseYearMonth(s) {
  return constrainIsoDateInternals({
    // { isYear, isoMonth, isoDay
    //   calendar }
    //
    // should use `queryCalendarOps(parsed.calendar || isoCalendarId)`
  })
}

function parseMonthDay(s) {
  return constrainIsoDateInternals({
    // { isYear, isoMonth, isoDay
    //   calendar }
    //
    // should use `queryCalendarOps(parsed.calendar || isoCalendarId)`
  })
}

function parseTime(s) {
  return constrainIsoTimeFields({
    // { isoHour, isoMinute, isoSecond, etc... }
  })
}

export function parseOffsetNano(s) {
  // number
}

export function parseDuration(s) {
  // includes sign
}
