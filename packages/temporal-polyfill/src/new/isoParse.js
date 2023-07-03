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
} from './isoMath'
import { getMatchingInstantFor, utcTimeZoneId } from './timeZoneOps'

// High-level
// -------------------------------------------------------------------------------------------------

export function parseZonedDateTime(s) {
  const parsed = parseDateTime(s) // TODO: use just 'calendar' and 'timeZone' ?
  if (parsed) {
    if (!parsed.timeZone) {
      throw new Error()
    }
    return processZonedDateTimeParse(parsed)
  }

  throw new Error()
}

export function processZonedDateTimeParse(parsed) {
  const epochNanoseconds = getMatchingInstantFor(
    parsed.timeZone,
    parsed,
    parsed.offset !== undefined ? parseOffsetNano(parsed.offset) : undefined,
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

  throw new Error()
}

export function parsePlainDate(s) {
  const parsed = parseDateTime(s)
  if (parsed) {
    return parsed
  }

  throw new Error()
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

  throw new Error()
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

  throw new Error()
}

export function parsePlainTime(s) {
  let parsed = parseTime(s)

  if (!parsed) {
    parsed = parseDateTime(s)

    if (parsed && !parsed.hasTime) {
      throw new Error()
    }
  }

  if (parsed) {
    if (parsed.hasZ) {
      throw new Error()
    }
    if (parsed.calendar !== undefined && parsed.calendar !== isoCalendarId) {
      throw new Error()
    }

    if (parseMonthDay(s)) {
      throw new Error()
    }
    if (parseYearMonth(s)) {
      throw new Error()
    }

    return pluckIsoTimeFields(parsed)
  }

  throw new Error()
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
