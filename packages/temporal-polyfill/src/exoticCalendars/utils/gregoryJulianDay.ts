import {
  epochDaysToIsoDate,
  isoArgsToEpochDays,
} from '../../internal/epochMath'
import { type CalendarDateFields } from '../../internal/fieldTypes'
import { milliInDay } from '../../internal/units'

// Julian Day 2440588 is the civil day containing Unix epoch midnight. This
// lets us bridge between Temporal epoch days and Adobe-style Julian Day calendar
// algorithms without Date.UTC year quirks.
const unixEpochJulianDay = 2440588

export function epochDaysToJulianDay(epochDays: number): number {
  return epochDays + unixEpochJulianDay
}

export function julianDayToEpochMilli(julianDay: number): number {
  return (julianDay - unixEpochJulianDay) * milliInDay
}

export function gregoryToJulianDay(
  year: number,
  month: number,
  day: number,
): number {
  return epochDaysToJulianDay(isoArgsToEpochDays(year, month, day))
}

export function julianDayToGregory(julianDay: number): CalendarDateFields {
  return epochDaysToIsoDate(julianDay - unixEpochJulianDay)
}
