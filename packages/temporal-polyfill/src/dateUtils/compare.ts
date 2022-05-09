import { Temporal } from 'temporal-spec'
import { LargeInt, compareLargeInts } from '../utils/largeInt'
import { compareValues } from '../utils/math'
import { durationDayTimeToNano, isoTimeToNano } from './dayAndTime'
import { DiffableObj } from './diff'
import { DurationFields, computeLargestDurationUnit } from './durationFields'
import { EpochableFields, epochNanoSymbol, isoFieldsToEpochNano } from './epoch'
import { ISOTimeFields } from './isoFields'
import { LocalDateFields } from './localFields'
import { DAY } from './units'

export interface ComparableDateTime {
  getISOFields(): EpochableFields
}

export interface ComparableTime {
  getISOFields(): ISOTimeFields
}

export interface ComparableEpochObj {
  [epochNanoSymbol]: LargeInt
}

// Equality (considers Calendar & timeZone)
// -------------------------------------------------------------------------------------------------

type EqualityTestObj = ComparableDateTime & { calendar: Temporal.CalendarProtocol }
type ZonedEqualityTestObj = EqualityTestObj & { timeZone: Temporal.TimeZoneProtocol }

export function zonedDateTimesEqual(a: ZonedEqualityTestObj, b: ZonedEqualityTestObj): boolean {
  return dateTimesEqual(a, b) &&
    a.timeZone.toString() === b.timeZone.toString()
}

export function dateTimesEqual(a: EqualityTestObj, b: EqualityTestObj): boolean {
  return !compareDateTimes(a, b) &&
    a.calendar.toString() === b.calendar.toString()
}

// Comparison
// -------------------------------------------------------------------------------------------------

export function compareDateTimes(
  a: ComparableDateTime,
  b: ComparableDateTime,
): Temporal.ComparisonResult {
  return compareLargeInts(
    isoFieldsToEpochNano(a.getISOFields()),
    isoFieldsToEpochNano(b.getISOFields()),
  )
}

export function compareTimes(t0: ComparableTime, t1: ComparableTime): Temporal.ComparisonResult {
  return compareValues(
    isoTimeToNano(t0.getISOFields()),
    isoTimeToNano(t1.getISOFields()),
  )
}

export function compareLocalDateFields(
  d0: LocalDateFields,
  d1: LocalDateFields,
): Temporal.ComparisonResult {
  return compareValues(d0.year, d1.year) ||
    compareValues(d0.month, d1.month) ||
    compareValues(d0.day, d1.day)
}

export function compareEpochObjs(
  a: ComparableEpochObj,
  b: ComparableEpochObj,
): Temporal.ComparisonResult {
  return compareLargeInts(
    a[epochNanoSymbol],
    b[epochNanoSymbol],
  )
}

export function compareDurations(
  fields0: DurationFields,
  fields1: DurationFields,
  relativeTo: DiffableObj | undefined,
): Temporal.ComparisonResult {
  if (
    relativeTo === undefined &&
    computeLargestDurationUnit(fields0) <= DAY &&
    computeLargestDurationUnit(fields1) <= DAY
  ) {
    return compareLargeInts(
      durationDayTimeToNano(fields0),
      durationDayTimeToNano(fields1),
    )
  }

  if (!relativeTo) {
    throw new RangeError('Need relativeTo')
  }

  const date0 = relativeTo.add(fields0)
  const date1 = relativeTo.add(fields1)

  if (relativeTo[epochNanoSymbol] !== undefined) {
    return compareEpochObjs(date0 as ComparableEpochObj, date1 as ComparableEpochObj)
  }

  return compareDateTimes(date0 as ComparableDateTime, date1 as ComparableDateTime)
}
