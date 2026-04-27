import {
  queryNativeDateParts,
  queryNativeEpochMilli,
  queryNativeMonthAdd,
} from '../internal/calendarNativeQuery'
import {
  IsoDateFields,
  IsoDateTimeFields,
  clearIsoFields,
  isoTimeFieldDefaults,
} from '../internal/isoFields'
import { computeIsoDayOfWeek } from '../internal/isoMath'
import { moveByDays } from '../internal/move'
import { RoundingMode } from '../internal/options'
import { IsoDateTimeInterval, roundWithMode } from '../internal/round'
import { DateSlots } from '../internal/slots'
import { epochMilliToIso, isoToEpochNano } from '../internal/timeMath'
import { computeEpochNanoFrac } from '../internal/total'
import { Unit } from '../internal/units'
import { bindArgs } from '../internal/utils'
import { moveByIsoWeeks } from './moveUtils'

// Floor
// -----------------------------------------------------------------------------

export function computeYearFloor(
  slots: DateSlots,
): IsoDateTimeFields & { year: number } {
  const [year0] = queryNativeDateParts(slots.calendar, slots)
  const isoFields0 = epochMilliToIso(
    queryNativeEpochMilli(slots.calendar, year0),
  )
  return { ...isoFields0, year: year0 }
}

export function computeMonthFloor(
  slots: DateSlots,
): IsoDateTimeFields & { year: number; month: number } {
  const [year0, month0] = queryNativeDateParts(slots.calendar, slots)
  const isoFields0 = epochMilliToIso(
    queryNativeEpochMilli(slots.calendar, year0, month0),
  )
  return { ...isoFields0, year: year0, month: month0 }
}

export function computeIsoWeekFloor(slots: IsoDateFields): IsoDateTimeFields {
  const dayOfWeek = computeIsoDayOfWeek(slots)
  const isoDateFields0 = moveByDays(slots, 1 - dayOfWeek)
  return { ...isoDateFields0, ...isoTimeFieldDefaults }
}

export const computeHourFloor = bindArgs(clearIsoFields, Unit.Hour)
export const computeMinuteFloor = bindArgs(clearIsoFields, Unit.Minute)
export const computeSecFloor = bindArgs(clearIsoFields, Unit.Second)
export const computeMilliFloor = bindArgs(clearIsoFields, Unit.Millisecond)
export const computeMicroFloor = bindArgs(clearIsoFields, Unit.Microsecond)

// Ceil
// -----------------------------------------------------------------------------

export function computeYearCeil(slots: DateSlots): IsoDateTimeFields {
  return computeYearInterval(slots)[1]
}

export function computeMonthCeil(slots: DateSlots): IsoDateTimeFields {
  return computeMonthInterval(slots)[1]
}

export function computeIsoWeekCeil(slots: IsoDateFields): IsoDateTimeFields {
  return computeIsoWeekInterval(slots)[1]
}

// Interval
// -----------------------------------------------------------------------------

export function computeYearInterval(slots: DateSlots): IsoDateTimeInterval {
  const isoFields0 = computeYearFloor(slots)
  const year1 = isoFields0.year + 1
  const isoFields1 = epochMilliToIso(
    queryNativeEpochMilli(slots.calendar, year1),
  )
  return [isoFields0, isoFields1]
}

export function computeMonthInterval(slots: DateSlots): IsoDateTimeInterval {
  const isoFields0 = computeMonthFloor(slots)
  const [year1, month1] = queryNativeMonthAdd(
    slots.calendar,
    isoFields0.year,
    isoFields0.month,
    1,
  )
  const isoFields1 = epochMilliToIso(
    queryNativeEpochMilli(slots.calendar, year1, month1),
  )
  return [isoFields0, isoFields1]
}

export function computeIsoWeekInterval(
  slots: IsoDateFields,
): IsoDateTimeInterval {
  const isoFields0 = computeIsoWeekFloor(slots)
  const isoFields1 = moveByIsoWeeks(isoFields0, 1)
  return [isoFields0, isoFields1]
}

/*
For year/month/week only
*/
export function roundDateTimeToInterval<S extends DateSlots>(
  computeInterval: (slots: S) => IsoDateTimeInterval,
  slots: S,
  roundingMode: RoundingMode,
): S & IsoDateTimeFields {
  const [isoFields0, isoFields1] = computeInterval(slots)
  const epochNano0 = isoToEpochNano(isoFields0)!
  const epochNano1 = isoToEpochNano(isoFields1)!
  const epochNano = isoToEpochNano(slots)!
  const frac = computeEpochNanoFrac(epochNano, epochNano0, epochNano1)
  const grow = roundWithMode(frac, roundingMode)
  const isoFieldsRounded = grow ? isoFields1 : isoFields0
  return {
    ...slots,
    ...isoFieldsRounded,
  }
}
