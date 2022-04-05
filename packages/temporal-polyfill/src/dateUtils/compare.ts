import { Calendar } from '../public/calendar'
import { TimeZone } from '../public/timeZone'
import { CompareResult } from '../public/types'
import { compareValues } from '../utils/math'
import { durationDayTimeToNano, isoTimeToNano } from './dayAndTime'
import { DiffableObj } from './diff'
import { computeLargestDurationUnit } from './durationFields'
import { EpochableFields, isoFieldsToEpochNano } from './epoch'
import { DurationFields, ISOTimeFields, LocalDateFields } from './typesPrivate'
import { DAY } from './units'

export interface ComparableDateTime {
  getISOFields(): EpochableFields
}

export interface ComparableTime {
  getISOFields(): ISOTimeFields
}

export interface ComparableEpochObj {
  epochNanoseconds: bigint
}

// Equality (considers Calendar & timeZone)
// -------------------------------------------------------------------------------------------------

export function zonedDateTimesEqual(
  a: ComparableDateTime & { timeZone: TimeZone, calendar: Calendar },
  b: ComparableDateTime & { timeZone: TimeZone, calendar: Calendar },
): boolean {
  return dateTimesEqual(a, b) &&
    a.timeZone.id === b.timeZone.id
}

export function dateTimesEqual(
  a: ComparableDateTime & { calendar: Calendar },
  b: ComparableDateTime & { calendar: Calendar },
): boolean {
  return !compareDateTimes(a, b) &&
    a.calendar.id === b.calendar.id
}

// Comparison
// -------------------------------------------------------------------------------------------------

export function compareDateTimes(a: ComparableDateTime, b: ComparableDateTime): CompareResult {
  return compareValues(
    isoFieldsToEpochNano(a.getISOFields()),
    isoFieldsToEpochNano(b.getISOFields()),
  )
}

export function compareTimes(t0: ComparableTime, t1: ComparableTime): CompareResult {
  return compareValues(
    isoTimeToNano(t0.getISOFields()),
    isoTimeToNano(t1.getISOFields()),
  )
}

export function compareLocalDateFields(d0: LocalDateFields, d1: LocalDateFields): CompareResult {
  return compareValues(d0.year, d1.year) ||
    compareValues(d0.month, d1.month) ||
    compareValues(d0.day, d1.day)
}

export function compareEpochObjs(a: ComparableEpochObj, b: ComparableEpochObj): CompareResult {
  return compareValues(a.epochNanoseconds, b.epochNanoseconds)
}

export function compareDurations(
  fields0: DurationFields,
  fields1: DurationFields,
  relativeTo: DiffableObj | undefined,
): CompareResult {
  if (
    relativeTo === undefined &&
    computeLargestDurationUnit(fields0) <= DAY &&
    computeLargestDurationUnit(fields1) <= DAY
  ) {
    return compareValues(
      durationDayTimeToNano(fields0),
      durationDayTimeToNano(fields1),
    )
  }

  if (!relativeTo) {
    throw new RangeError('Need relativeTo')
  }

  const date0 = relativeTo.add(fields0)
  const date1 = relativeTo.add(fields1)

  if (relativeTo.epochNanoseconds !== undefined) {
    return compareEpochObjs(date0 as ComparableEpochObj, date1 as ComparableEpochObj)
  }

  return compareDateTimes(date0 as ComparableDateTime, date1 as ComparableDateTime)
}
