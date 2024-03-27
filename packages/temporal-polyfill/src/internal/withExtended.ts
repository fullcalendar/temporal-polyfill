/*
WIP. Ultimately for funcApi
*/
import {
  createNativeDayOfYearOps,
  createNativeWeekOps,
} from './calendarNativeQuery'
import * as errorMessages from './errorMessages'
import { moveByIsoDays, moveToDayOfWeek, moveToDayOfYear } from './move'
import {
  PlainDateTimeSlots,
  ZonedDateTimeSlots,
  createPlainDateTimeSlots,
  createZonedDateTimeSlots,
} from './slots'
import { queryNativeTimeZone } from './timeZoneNative'
import { getSingleInstantFor, zonedEpochSlotsToIso } from './timeZoneOps'

// PlainDateTime

export function pdt_withWeekOfYear(
  slots: PlainDateTimeSlots<string>,
  weekOfYear: number,
): PlainDateTimeSlots<string> {
  const { calendar } = slots
  const calendarOps = createNativeWeekOps(calendar)

  const currentWeekOfYear = calendarOps.weekOfYear(slots)
  if (currentWeekOfYear === undefined) {
    throw new RangeError(errorMessages.unsupportedWeekNumbers)
  }

  const movedIsoFields = {
    ...slots, // for time
    ...moveByIsoDays(slots, (weekOfYear - currentWeekOfYear) * 7),
  }

  return createPlainDateTimeSlots(movedIsoFields, calendar)
}

// ZonedDateTime

export function zdt_withWeekOfYear(
  slots: ZonedDateTimeSlots<string, string>,
  weekOfYear: number,
): ZonedDateTimeSlots<string, string> {
  const { timeZone, calendar } = slots
  const calendarOps = createNativeWeekOps(calendar)
  const timeZoneOps = queryNativeTimeZone(timeZone)
  const isoFields = zonedEpochSlotsToIso(slots, timeZoneOps)

  const currentWeekOfYear = calendarOps.weekOfYear(isoFields)
  if (currentWeekOfYear === undefined) {
    throw new RangeError(errorMessages.unsupportedWeekNumbers)
  }

  const movedIsoFields = {
    ...isoFields, // for time
    ...moveByIsoDays(isoFields, (weekOfYear - currentWeekOfYear) * 7),
  }

  return createZonedDateTimeSlots(
    getSingleInstantFor(timeZoneOps, movedIsoFields),
    timeZone,
    calendar,
  )
}

export function zdt_withDayOfWeek(
  slots: ZonedDateTimeSlots<string, string>,
  dayOfWeek: number,
): ZonedDateTimeSlots<string, string> {
  const { timeZone, calendar } = slots
  const timeZoneOps = queryNativeTimeZone(timeZone)
  const isoFields = zonedEpochSlotsToIso(slots, timeZoneOps)

  const movedIsoFields = {
    ...isoFields, // for time
    ...moveToDayOfWeek(isoFields, dayOfWeek),
  }

  return createZonedDateTimeSlots(
    getSingleInstantFor(timeZoneOps, movedIsoFields),
    timeZone,
    calendar,
  )
}

export function zdt_withDayOfYear(
  slots: ZonedDateTimeSlots<string, string>,
  dayOfYear: number,
): ZonedDateTimeSlots<string, string> {
  const { timeZone, calendar } = slots
  const calendarOps = createNativeDayOfYearOps(calendar)
  const timeZoneOps = queryNativeTimeZone(timeZone)
  const isoFields = zonedEpochSlotsToIso(slots, timeZoneOps)

  const movedIsoFields = {
    ...isoFields, // for time
    ...moveToDayOfYear(calendarOps, isoFields, dayOfYear),
  }

  return createZonedDateTimeSlots(
    getSingleInstantFor(timeZoneOps, movedIsoFields),
    timeZone,
    calendar,
  )
}
