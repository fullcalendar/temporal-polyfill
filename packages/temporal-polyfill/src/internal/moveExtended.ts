/*
WIP. Ultimately for funcApi
*/

import { addBigNanos, numberToBigNano } from './bigNano'
import { createNativeConvertOps } from './calendarNativeQuery'
import { IsoDateFields } from './isoFields'
import { moveByIsoDays } from './move'
import { DateSlots, DateTimeSlots, ZonedDateTimeSlots } from './slots'
import {
  checkEpochNanoInBounds,
  checkIsoDateInBounds,
  checkIsoDateTimeInBounds,
  epochMilliToIso,
  epochNanoToIso,
  isoToEpochNano,
} from './timeMath'
import { queryNativeTimeZone } from './timeZoneNative'
import { getSingleInstantFor, zonedEpochSlotsToIso } from './timeZoneOps'
import {
  nanoInHour,
  nanoInMicro,
  nanoInMilli,
  nanoInMinute,
  nanoInSec,
} from './units'
import { bindArgs } from './utils'

function addYears(slots: DateSlots<string>, years: number): IsoDateFields {
  const calendarOps = createNativeConvertOps(slots.calendar)
  const [year0] = calendarOps.dateParts(slots)
  const year1 = year0 + years
  return epochMilliToIso(calendarOps.epochMilli(year1))
}

function addMonths(slots: DateSlots<string>, months: number): IsoDateFields {
  const calendarOps = createNativeConvertOps(slots.calendar)
  const [year0, month0] = calendarOps.dateParts(slots)
  const [year1, month1] = calendarOps.monthAdd(year0, month0, months)
  return epochMilliToIso(calendarOps.epochMilli(year1, month1))
}

function addWeeks(slots: DateSlots<string>, weeks: number): IsoDateFields {
  return addDays(slots, weeks * 7)
}

function addDays(slots: DateSlots<string>, days: number): IsoDateFields {
  return {
    ...slots,
    ...moveByIsoDays(slots, days),
  }
}

// -----------------------------------------------------------------------------

function addPlainDateUnit<S extends DateSlots<string>>(
  f: (isoSlots: DateSlots<string>, delta: number) => IsoDateFields,
  checkSlots: (isoSlots: S) => S,
  slots: S,
  units: number,
): S {
  return checkSlots({
    ...slots,
    ...f(slots, units),
  })
}

function addPlainTimeUnit<S extends DateTimeSlots<string>>(
  nanoInUnit: number,
  checkSlots: (isoSlots: S) => S,
  slots: S,
  units: number,
): S {
  const epochNano0 = isoToEpochNano(slots)!
  const epochNano1 = addBigNanos(epochNano0, numberToBigNano(units, nanoInUnit))
  return checkSlots({
    ...slots,
    ...epochNanoToIso(epochNano1, 0),
  })
}

function addZoneDateUnit(
  f: (isoSlots: DateSlots<string>, delta: number) => IsoDateFields,
  slots: ZonedDateTimeSlots<string, string>,
  delta: number,
): ZonedDateTimeSlots<string, string> {
  const timeZoneOps = queryNativeTimeZone(slots.timeZone)
  const isoSlots0 = zonedEpochSlotsToIso(slots, timeZoneOps)
  const isoSlots1 = {
    ...isoSlots0,
    ...f(isoSlots0, delta),
  }
  const epochNano1 = checkEpochNanoInBounds(
    getSingleInstantFor(timeZoneOps, isoSlots1),
  )
  return {
    ...slots,
    epochNanoseconds: epochNano1,
  }
}

function addZonedTimeUnit(
  nanoInUnit: number,
  slots: ZonedDateTimeSlots<string, string>,
  units: number,
): ZonedDateTimeSlots<string, string> {
  const epochNano1 = checkEpochNanoInBounds(
    addBigNanos(slots.epochNanoseconds, numberToBigNano(units, nanoInUnit)),
  )
  return {
    ...slots,
    epochNanoseconds: epochNano1,
  }
}

// -----------------------------------------------------------------------------

export const zdt_addYears = bindArgs(addZoneDateUnit, addYears)
export const zdt_addMonths = bindArgs(addZoneDateUnit, addMonths)
export const zdt_addWeeks = bindArgs(addZoneDateUnit, addWeeks)
export const zdt_addDays = bindArgs(addZoneDateUnit, addDays)
export const zdt_addHours = bindArgs(addZonedTimeUnit, nanoInHour)
export const zdt_addMinutes = bindArgs(addZonedTimeUnit, nanoInMinute)
export const zdt_addSeconds = bindArgs(addZonedTimeUnit, nanoInSec)
export const zdt_addMilliseconds = bindArgs(addZonedTimeUnit, nanoInMilli)
export const zdt_addMicroseconds = bindArgs(addZonedTimeUnit, nanoInMicro)
export const zdt_addNanoseconds = bindArgs(addZonedTimeUnit, 1)

export const pdt_addYears = bindArgs(
  addPlainDateUnit,
  addYears,
  checkIsoDateTimeInBounds,
)
export const pdt_addMonths = bindArgs(
  addPlainDateUnit,
  addMonths,
  checkIsoDateTimeInBounds,
)
export const pdt_addWeeks = bindArgs(
  addPlainDateUnit,
  addWeeks,
  checkIsoDateTimeInBounds,
)
export const pdt_addDays = bindArgs(
  addPlainDateUnit,
  addDays,
  checkIsoDateTimeInBounds,
)
export const pdt_addHours = bindArgs(
  addPlainTimeUnit,
  nanoInHour,
  checkIsoDateTimeInBounds,
)
export const pdt_addMinutes = bindArgs(
  addPlainTimeUnit,
  nanoInMinute,
  checkIsoDateTimeInBounds,
)
export const pdt_addSeconds = bindArgs(
  addPlainTimeUnit,
  nanoInSec,
  checkIsoDateTimeInBounds,
)
export const pdt_addMilliseconds = bindArgs(
  addPlainTimeUnit,
  nanoInMilli,
  checkIsoDateTimeInBounds,
)
export const pdt_addMicroseconds = bindArgs(
  addPlainTimeUnit,
  nanoInMicro,
  checkIsoDateTimeInBounds,
)
export const pdt_addNanoseconds = bindArgs(
  addPlainTimeUnit,
  1,
  checkIsoDateTimeInBounds,
)

export const pd_addYears = bindArgs(
  addPlainDateUnit,
  addYears,
  checkIsoDateInBounds,
)
export const pd_addMonths = bindArgs(
  addPlainDateUnit,
  addMonths,
  checkIsoDateInBounds,
)
export const pd_addWeeks = bindArgs(
  addPlainDateUnit,
  addWeeks,
  checkIsoDateInBounds,
)
export const pd_addDays = bindArgs(
  addPlainDateUnit,
  addDays,
  checkIsoDateInBounds,
)

// -----------------------------------------------------------------------------

function reversed<S>(
  f: (slots: S, units: number) => S,
): (slots: S, units: number) => S {
  return (slots, units) => {
    return f(slots, -units)
  }
}

export const zdt_subtractYears = reversed(zdt_addYears)
export const zdt_subtractMonths = reversed(zdt_addMonths)
export const zdt_subtractWeeks = reversed(zdt_addWeeks)
export const zdt_subtractDays = reversed(zdt_addDays)
export const zdt_subtractHours = reversed(zdt_addHours)
export const zdt_subtractMinutes = reversed(zdt_addMinutes)
export const zdt_subtractSeconds = reversed(zdt_addSeconds)
export const zdt_subtractMilliseconds = reversed(zdt_addMilliseconds)
export const zdt_subtractMicroseconds = reversed(zdt_addMicroseconds)
export const zdt_subtractNanoseconds = reversed(zdt_addNanoseconds)

export const pdt_subtractYears = reversed(pdt_addYears)
export const pdt_subtractMonths = reversed(pdt_addMonths)
export const pdt_subtractWeeks = reversed(pdt_addWeeks)
export const pdt_subtractDays = reversed(pdt_addDays)
export const pdt_subtractHours = reversed(pdt_addHours)
export const pdt_subtractMinutes = reversed(pdt_addMinutes)
export const pdt_subtractSeconds = reversed(pdt_addSeconds)
export const pdt_subtractMilliseconds = reversed(pdt_addMilliseconds)
export const pdt_subtractMicroseconds = reversed(pdt_addMicroseconds)
export const pdt_subtractNanoseconds = reversed(pdt_addNanoseconds)
