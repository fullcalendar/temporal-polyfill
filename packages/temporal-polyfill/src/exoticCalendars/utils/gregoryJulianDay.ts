import {
  epochDaysToIsoDate,
  isoArgsToEpochDays,
} from '../../internal/epochMath'
import { type CalendarDateFields } from '../../internal/fieldTypes'

// Julian Day 2440588 is the civil day containing Unix epoch midnight.
const unixEpochJulianDay = 2440588

export function gregoryToJulianDay(
  year: number,
  month: number,
  day: number,
): number {
  return isoArgsToEpochDays(year, month, day) + unixEpochJulianDay
}

export function julianDayToGregory(julianDay: number): CalendarDateFields {
  return epochDaysToIsoDate(julianDay - unixEpochJulianDay)
}
