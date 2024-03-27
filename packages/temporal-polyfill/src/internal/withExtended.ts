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
  DateTimeSlots,
  ZonedDateTimeSlots,
  createZonedDateTimeSlots,
} from './slots'
import {
  checkEpochNanoInBounds,
  checkIsoDateInBounds,
  checkIsoDateTimeInBounds,
} from './timeMath'
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
  const epochNano1 = checkEpochNanoInBounds(
    getSingleInstantFor(timeZoneOps, transformedIsoSlots),
  )
  return createZonedDateTimeSlots(epochNano1, timeZone, calendar)
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

// -----------------------------------------------------------------------------

export function pd_withDayOfYear(
  slots: DateSlots<string>,
  dayOfYear: number,
): DateSlots<string> {
  const calendarOps = createNativeDayOfYearOps(slots.calendar)
  return checkIsoDateInBounds({
    ...slots,
    ...moveToDayOfYear(calendarOps, slots, dayOfYear),
  })
}

export function pd_withDayOfMonth(
  slots: DateSlots<string>,
  dayOfMonth: number,
): DateSlots<string> {
  const calendarOps = createNativeYearMonthParseOps(slots.calendar)
  return checkIsoDateInBounds({
    ...slots,
    ...moveToDayOfMonth(calendarOps, slots, dayOfMonth),
  })
}

export function pd_withDayOfWeek(
  slots: DateSlots<string>,
  dayOfWeek: number,
): DateSlots<string> {
  return checkIsoDateInBounds({
    ...slots,
    ...moveToDayOfWeek(slots, dayOfWeek),
  })
}

export function pd_withWeekOfYear(
  slots: DateSlots<string>,
  weekOfYear: number,
): DateSlots<string> {
  return checkIsoDateInBounds(slotsWithWeekOfYear(slots, weekOfYear))
}

// -----------------------------------------------------------------------------

export function pdt_withDayOfYear(
  slots: DateTimeSlots<string>,
  dayOfYear: number,
): DateTimeSlots<string> {
  const calendarOps = createNativeDayOfYearOps(slots.calendar)
  return checkIsoDateTimeInBounds({
    ...slots,
    ...moveToDayOfYear(calendarOps, slots, dayOfYear),
  })
}

export function pdt_withDayOfMonth(
  slots: DateTimeSlots<string>,
  dayOfMonth: number,
): DateTimeSlots<string> {
  const calendarOps = createNativeYearMonthParseOps(slots.calendar)
  return checkIsoDateTimeInBounds({
    ...slots,
    ...moveToDayOfMonth(calendarOps, slots, dayOfMonth),
  })
}

export function pdt_withDayOfWeek(
  slots: DateTimeSlots<string>,
  dayOfWeek: number,
): DateTimeSlots<string> {
  return checkIsoDateTimeInBounds({
    ...slots,
    ...moveToDayOfWeek(slots, dayOfWeek),
  })
}

export function pdt_withWeekOfYear(
  slots: DateTimeSlots<string>,
  weekOfYear: number,
): DateTimeSlots<string> {
  return checkIsoDateTimeInBounds(slotsWithWeekOfYear(slots, weekOfYear))
}
