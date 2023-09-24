import { compareDayTimeNanos } from './dayTimeNano'
import { IsoDateInternals, IsoDateTimeInternals } from './isoInternals'
import { isObjIdsEqual } from './class'
import { isTimeZonesEqual } from './timeZoneOps'
import type { ZonedInternals } from './zonedDateTime'
import { compareIsoDateTimeFields, compareIsoDateFields } from './isoMath'

export function isPlainDateTimesEqual(
  a: IsoDateTimeInternals,
  b: IsoDateTimeInternals
): boolean {
  return !compareIsoDateTimeFields(a, b) &&
    isObjIdsEqual(a.calendar, b.calendar)
}

export function isPlainDatesEqual(
  a: IsoDateInternals,
  b: IsoDateInternals
): boolean {
  return !compareIsoDateFields(a, b) &&
    isObjIdsEqual(a.calendar, b.calendar)
}

export function isPlainMonthDaysEqual(
  a: IsoDateInternals,
  b: IsoDateInternals
): boolean {
  return !compareIsoDateFields(a, b) &&
    isObjIdsEqual(a.calendar, b.calendar)
}

export function isPlainYearMonthsEqual(
  a: IsoDateInternals,
  b: IsoDateInternals
): boolean {
  return !compareIsoDateFields(a, b) &&
    isObjIdsEqual(a.calendar, b.calendar)
}

export function isZonedDateTimesEqual(
  a: ZonedInternals,
  b: ZonedInternals
): boolean {
  return !compareDayTimeNanos(a.epochNanoseconds, b.epochNanoseconds) &&
    isTimeZonesEqual(a.timeZone, b.timeZone) &&
    isObjIdsEqual(a.calendar, b.calendar)
}
