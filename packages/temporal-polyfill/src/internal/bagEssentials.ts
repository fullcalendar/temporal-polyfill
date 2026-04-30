import { isoTimeFieldsToCal } from './bagRefineConfig'
import { formatMonthCode } from './calendarNative'
import {
  queryNativeDateParts,
  queryNativeMonthCodeParts,
} from './calendarNativeQuery'
import { TimeFields } from './fields'
import { formatOffsetNano } from './isoFormat'
import { DateSlots, DateTimeSlots, ZonedDateTimeSlots } from './slots'
import { zonedEpochSlotsToIso } from './timeZoneNativeMath'

/*
"Essentials" are the minimal, canonical property-bag-shaped fields copied from
an existing Temporal object before applying a .with() modification bag. They are
already internal data, so these helpers do not perform user-observable property
reads; they only translate slots into the field names that mergeCalendarFields()
and the later from-fields resolution steps expect.
*/

export function computeZonedDateTimeEssentials(slots: ZonedDateTimeSlots): {
  year: number
  monthCode: string
  day: number
} & TimeFields & { offset: string } {
  const isoFields = zonedEpochSlotsToIso(slots)
  const offsetString = formatOffsetNano(isoFields.offsetNanoseconds)

  const [year, month, day] = queryNativeDateParts(slots.calendar, isoFields)
  const monthCode = computeMonthCode(slots.calendar, year, month)

  return {
    ...isoTimeFieldsToCal(isoFields),
    year,
    monthCode,
    day,
    offset: offsetString,
  }
}

export function computeDateTimeEssentials(slots: DateTimeSlots) {
  return {
    ...computeDateEssentials(slots),
    // Keep the public Temporal field names here. The slot names are ISO-prefixed
    // because they represent storage, but .with() needs calendar-style fields.
    hour: slots.isoHour,
    minute: slots.isoMinute,
    second: slots.isoSecond,
    millisecond: slots.isoMillisecond,
    microsecond: slots.isoMicrosecond,
    nanosecond: slots.isoNanosecond,
  }
}

export function computeDateEssentials(slots: DateSlots): {
  year: number
  monthCode: string
  day: number
} {
  const [year, month, day] = queryNativeDateParts(slots.calendar, slots)
  const monthCode = computeMonthCode(slots.calendar, year, month)
  return { year, monthCode, day }
}

export function computeYearMonthEssentials(slots: DateSlots): {
  year: number
  monthCode: string
} {
  const [year, month] = queryNativeDateParts(slots.calendar, slots)
  const monthCode = computeMonthCode(slots.calendar, year, month)
  return { year, monthCode }
}

export function computeMonthDayEssentials(slots: DateSlots): {
  monthCode: string
  day: number
} {
  const [year, month, day] = queryNativeDateParts(slots.calendar, slots)
  const monthCode = computeMonthCode(slots.calendar, year, month)
  return { monthCode, day }
}

function computeMonthCode(
  calendarId: string,
  year: number,
  month: number,
): string {
  const [monthCodeNumber, isLeapMonth] = queryNativeMonthCodeParts(
    calendarId,
    year,
    month,
  )
  return formatMonthCode(monthCodeNumber, isLeapMonth)
}
