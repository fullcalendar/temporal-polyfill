import { formatMonthCode } from './calendarMonthCode'
import {
  queryCalendarDateFields,
  queryCalendarMonthCodeParts,
} from './calendarQuery'
import { TimeFields } from './fieldTypes'
import {
  AbstractDateSlots,
  AbstractDateTimeSlots,
  ZonedDateTimeSlots,
} from './slots'
import { zonedEpochSlotsToIso } from './timeZoneMath'

/*
"Essentials" are the minimal, canonical fields copied from an existing Temporal
object before applying a .with() modification bag. They are already internal
data, so these helpers do not perform user-observable property reads; they
translate slots into the field names that mergeCalendarFields() and the later
from-fields resolution steps expect. Values match the post-coercion field
representation, so ZonedDateTime's public "offset" field is stored as
nanoseconds here.
*/

export function computeZonedDateTimeEssentials(slots: ZonedDateTimeSlots): {
  year: number
  monthCode: string
  day: number
} & TimeFields & { offset: number } {
  const isoDateTime = zonedEpochSlotsToIso(slots)
  const {
    offsetNanoseconds,
    hour,
    minute,
    second,
    millisecond,
    microsecond,
    nanosecond,
  } = isoDateTime

  const { year, month, day } = queryCalendarDateFields(
    slots.calendarId,
    isoDateTime,
  )
  const monthCode = computeMonthCode(slots.calendarId, year, month)

  return {
    year,
    monthCode,
    day,
    hour,
    minute,
    second,
    millisecond,
    microsecond,
    nanosecond,
    // Keep this in the same post-coercion representation as user .with()
    // fields: the public "offset" field is stored internally as nanoseconds.
    offset: offsetNanoseconds,
  }
}

export function computeDateTimeEssentials(slots: AbstractDateTimeSlots) {
  const { year, monthCode, day } = computeDateEssentials(slots)
  return {
    year,
    monthCode,
    day,
    hour: slots.hour,
    minute: slots.minute,
    second: slots.second,
    millisecond: slots.millisecond,
    microsecond: slots.microsecond,
    nanosecond: slots.nanosecond,
  }
}

export function computeDateEssentials(slots: AbstractDateSlots): {
  year: number
  monthCode: string
  day: number
} {
  const { year, month, day } = queryCalendarDateFields(slots.calendarId, slots)
  const monthCode = computeMonthCode(slots.calendarId, year, month)
  return { year, monthCode, day }
}

export function computeYearMonthEssentials(slots: AbstractDateSlots): {
  year: number
  monthCode: string
} {
  const { year, month } = queryCalendarDateFields(slots.calendarId, slots)
  const monthCode = computeMonthCode(slots.calendarId, year, month)
  return { year, monthCode }
}

export function computeMonthDayEssentials(slots: AbstractDateSlots): {
  monthCode: string
  day: number
} {
  const { year, month, day } = queryCalendarDateFields(slots.calendarId, slots)
  const monthCode = computeMonthCode(slots.calendarId, year, month)
  return { monthCode, day }
}

function computeMonthCode(
  calendarId: string,
  year: number,
  month: number,
): string {
  const [monthCodeNumber, isLeapMonth] = queryCalendarMonthCodeParts(
    calendarId,
    year,
    month,
  )
  return formatMonthCode(monthCodeNumber, isLeapMonth)
}
