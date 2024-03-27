/*
WIP. Ultimately for funcApi
*/
import {
  createNativeDayOfYearOps,
  createNativeWeekOps,
  createNativeYearMonthParseOps,
} from './calendarNativeQuery'
import * as errorMessages from './errorMessages'
import { IsoDateFields } from './isoFields'
import {
  moveByIsoDays,
  moveToDayOfMonth,
  moveToDayOfWeek,
  moveToDayOfYear,
} from './move'
import {
  DateSlots,
  ZonedDateTimeSlots,
  createZonedDateTimeSlots,
} from './slots'
import { queryNativeTimeZone } from './timeZoneNative'
import { getSingleInstantFor, zonedEpochSlotsToIso } from './timeZoneOps'
import { bindArgs } from './utils'

// Generic
// -----------------------------------------------------------------------------

function zonedSlotsWithTransform(
  transformIso: (isoSlots: DateSlots<string>, num: number) => IsoDateFields,
  slots: ZonedDateTimeSlots<string, string>,
  num: number,
): ZonedDateTimeSlots<string, string> {
  const { timeZone, calendar } = slots
  const timeZoneOps = queryNativeTimeZone(timeZone)
  const isoSlots = zonedEpochSlotsToIso(slots, timeZoneOps)

  const transformedIsoSlots = {
    ...isoSlots,
    ...transformIso(isoSlots, num),
  }

  return createZonedDateTimeSlots(
    getSingleInstantFor(timeZoneOps, transformedIsoSlots),
    timeZone,
    calendar,
  )
}

function slotsWithWeekOfYear<S extends DateSlots<string>>(
  slots: S,
  weekOfYear: number,
): S {
  const { calendar } = slots
  const calendarOps = createNativeWeekOps(calendar)

  const currentWeekOfYear = calendarOps.weekOfYear(slots)
  if (currentWeekOfYear === undefined) {
    throw new RangeError(errorMessages.unsupportedWeekNumbers)
  }

  return {
    ...slots, // for possible time
    ...moveByIsoDays(slots, (weekOfYear - currentWeekOfYear) * 7),
  }
}

// -----------------------------------------------------------------------------

export function zdt_withDayOfYear(
  slots: ZonedDateTimeSlots<string, string>,
  dayOfYear: number,
): ZonedDateTimeSlots<string, string> {
  const calendarOps = createNativeDayOfYearOps(slots.calendar)
  return zonedSlotsWithTransform(
    bindArgs(moveToDayOfYear, calendarOps),
    slots,
    dayOfYear,
  )
}

export function zdt_withDayOfMonth(
  slots: ZonedDateTimeSlots<string, string>,
  dayOfMonth: number,
): ZonedDateTimeSlots<string, string> {
  const calendarOps = createNativeYearMonthParseOps(slots.calendar)
  return zonedSlotsWithTransform(
    bindArgs(moveToDayOfMonth, calendarOps),
    slots,
    dayOfMonth,
  )
}

export const zdt_withDayOfWeek = bindArgs(
  zonedSlotsWithTransform,
  moveToDayOfWeek,
)

export const zdt_withWeekOfYear = bindArgs(
  zonedSlotsWithTransform,
  slotsWithWeekOfYear,
)

export function pd_or_pdt_withDayOfYear<S extends DateSlots<string>>(
  slots: S,
  dayOfYear: number,
): S {
  const calendarOps = createNativeDayOfYearOps(slots.calendar)
  return {
    ...slots,
    ...moveToDayOfYear(calendarOps, slots, dayOfYear),
  }
}

export function pd_or_pdt_withDayOfMonth<S extends DateSlots<string>>(
  slots: S,
  dayOfMonth: number,
): S {
  const calendarOps = createNativeYearMonthParseOps(slots.calendar)
  return {
    ...slots,
    ...moveToDayOfMonth(calendarOps, slots, dayOfMonth),
  }
}

export function pd_or_pdt_withDayOfWeek<S extends DateSlots<string>>(
  slots: S,
  dayOfWeek: number,
): S {
  return {
    ...slots,
    ...moveToDayOfWeek(slots, dayOfWeek),
  }
}

export const pd_or_pdt_withWeekOfYear = slotsWithWeekOfYear
