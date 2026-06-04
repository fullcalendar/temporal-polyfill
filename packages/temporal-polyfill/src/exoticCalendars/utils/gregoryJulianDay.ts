import {
  diffEpochMilliDays,
  epochMilliToIsoDateTime,
  isoArgsToEpochMilli,
} from '../../internal/epochMath'
import { type CalendarDateFields } from '../../internal/fieldTypes'
import { computeIsoInLeapYear } from '../../internal/isoCalendarMath'
import { milliInDay } from '../../internal/units'

// Julian Day 2440588 is the civil day containing Unix epoch midnight.
const unixEpochJulianDay = 2440588
const gregoryJulianDayEpoch = 1721426

export function gregoryToJulianDay(
  year: number,
  month: number,
  day: number,
): number {
  const epochMilli = isoArgsToEpochMilli(year, month, day)

  // Most conversions can use the package's Date-backed ISO bridge. Extreme
  // Indian-calendar tests also need Gregory year starts that sit just outside
  // Date's epoch range, so keep the direct field math as a narrow fallback.
  return epochMilli === undefined
    ? gregoryToJulianDayMath(year, month, day)
    : diffEpochMilliDays(0, epochMilli) + unixEpochJulianDay
}

export function julianDayToGregory(julianDay: number): CalendarDateFields {
  const { year, month, day } = epochMilliToIsoDateTime(
    (julianDay - unixEpochJulianDay) * milliInDay,
  )
  return { year, month, day }
}

function gregoryToJulianDayMath(
  year: number,
  month: number,
  day: number,
): number {
  const y1 = year - 1
  let monthOffset = -2
  if (month <= 2) {
    monthOffset = 0
  } else if (computeIsoInLeapYear(year)) {
    monthOffset = -1
  }

  return (
    gregoryJulianDayEpoch -
    1 +
    365 * y1 +
    Math.floor(y1 / 4) -
    Math.floor(y1 / 100) +
    Math.floor(y1 / 400) +
    Math.floor((367 * month - 362) / 12 + monthOffset + day)
  )
}
