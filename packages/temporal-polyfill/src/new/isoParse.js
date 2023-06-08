import { isoCalendarId } from './calendarConfig'
import { queryCalendarOps } from './calendarOps'
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
import { getMatchingInstantFor, queryTimeZoneOps, utcTimeZoneId } from './timeZoneOps'
import { createZonedDateTime } from './zonedDateTime'

// TODO: rename method names back to parse

// High-level
// -------------------------------------------------------------------------------------------------

export function stringToZonedDateTimeInternals(s) {
  const parsed = parseDateTime(s) // TODO: use just 'calendar' and 'timeZone' ?
  if (parsed) {
    if (!parsed.timeZoneId) {
      throw new Error()
    }

    const calendar = queryCalendarOps(parsed.calendarId || isoCalendarId)
    const timeZone = queryTimeZoneOps(parsed.timeZoneId)

    const epochNanoseconds = getMatchingInstantFor(
      timeZone,
      parsed,
      parsed.offset !== undefined ? parseOffsetNanoseconds(parsed.offset) : undefined,
      parsed.z,
      'reject',
      'compatible',
      true, // fuzzy
    )

    return createZonedDateTime({
      epochNanoseconds,
      timeZone,
      calendar,
    })
  }

  throw new Error()
}

export function stringToPlainDateTimeInternals(s) {
  const parsed = parseDateTime(s)
  if (parsed) {
    return pluckIsoDateTimeInternals(parsed)
  }

  throw new Error()
}

export function stringToPlainDateInternals(s) {
  const parsed = parseDateTime(s)
  if (parsed) {
    return parsed
  }

  throw new Error()
}

export function stringToPlainYearMonthInternals(s) {
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

export function stringToMonthDayInternals(s) {
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

export function stringToPlainTimeInternals(s) {
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
    if (parsed.calendarId !== undefined && parsed.calendarId !== isoCalendarId) {
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

export function stringToCalendarId(s) {
  if (s !== isoCalendarId) {
    s = (
      parseDateTime(s) || parseYearMonth(s) || parseMonthDay(s)
    )?.calendarId || isoCalendarId
  }

  return s
}

export function stringToTimeZoneId(s) {
  const parsed = parseDateTime(s)
  if (parsed !== undefined) {
    if (parsed.timeZonedId) {
      return parsed.timeZonedId // TODO: need to canonicalize (run through DateTimeFormat)
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

export function parseDateTime(s) {
  return constrainIsoDateTimeInternals({
    // { isYear, isoMonth, isoDay,
    //   isoHour, isMinute, isoSecond, etc...
    //   hasTime, hasZ, offset,
    //   calendar, timeZone }
  })
}

export function parseYearMonth(s) {
  return constrainIsoDateInternals({
    // { isYear, isoMonth, isoDay
    //   calendar, timeZone }
  })
}

export function parseMonthDay(s) {
  return constrainIsoDateInternals({
    // { isYear, isoMonth, isoDay
    //   calendar, timeZone }
  })
}

export function parseTime(s) {
  return constrainIsoTimeFields({
    // { isoHour, isoMinute, isoSecond, etc... }
  })
}

export function parseOffsetNanoseconds(s) {
  // number
}

export function stringToDurationInternals(s) {
  // includes sign
}
