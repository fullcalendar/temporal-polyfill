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
  const { isoDate, time, offsetNanoseconds } = zonedEpochSlotsToIso(slots)

  const { year, month, day } = queryCalendarDateFields(slots.calendar, isoDate)
  const monthCode = computeMonthCode(slots.calendar, year, month)

  return {
    ...time,
    year,
    monthCode,
    day,
    // Keep this in the same post-coercion representation as user .with()
    // fields: the public "offset" field is stored internally as nanoseconds.
    offset: offsetNanoseconds,
  }
}

export function computeDateTimeEssentials(slots: AbstractDateTimeSlots) {
  const { time } = slots
  return {
    ...computeDateEssentials(slots),
    // Keep the public Temporal field names here. The slot names are ISO-prefixed
    // because they represent storage, but .with() needs calendar-style fields.
    hour: time.hour,
    minute: time.minute,
    second: time.second,
    millisecond: time.millisecond,
    microsecond: time.microsecond,
    nanosecond: time.nanosecond,
  }
}

export function computeDateEssentials(slots: AbstractDateSlots): {
  year: number
  monthCode: string
  day: number
} {
  const { isoDate } = slots
  const { year, month, day } = queryCalendarDateFields(slots.calendar, isoDate)
  const monthCode = computeMonthCode(slots.calendar, year, month)
  return { year, monthCode, day }
}

export function computeYearMonthEssentials(slots: AbstractDateSlots): {
  year: number
  monthCode: string
} {
  const { isoDate } = slots
  const { year, month } = queryCalendarDateFields(slots.calendar, isoDate)
  const monthCode = computeMonthCode(slots.calendar, year, month)
  return { year, monthCode }
}

export function computeMonthDayEssentials(slots: AbstractDateSlots): {
  monthCode: string
  day: number
} {
  const { isoDate } = slots
  const { year, month, day } = queryCalendarDateFields(slots.calendar, isoDate)
  const monthCode = computeMonthCode(slots.calendar, year, month)
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
