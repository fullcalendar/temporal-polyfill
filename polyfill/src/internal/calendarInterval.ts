import {
  computeCalendarDateFields,
  computeCalendarIsoFieldsFromParts,
} from './calendarDerived'
import { type CalendarImpl } from './calendarImpl'
import { isoDateTimeToEpochNano, isoDateToEpochNano } from './epochMath'
import { timeFieldDefaults, timeFieldNamesAsc } from './fieldNames'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  TimeFields,
} from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import { computeIsoDayOfWeek } from './isoCalendarMath'
import { addCalendarMonths, moveByDays } from './move'
import { RoundingModeEnum } from './optionsModel'
import { computeEpochNanoFrac } from './relativeMath'
import { roundWithMode } from './round'
import { TimeUnit, Unit } from './units'
import { bindArgs, zeroOutProps } from './utils'

const clearTimeFields = bindArgs(
  zeroOutProps,
  timeFieldNamesAsc,
) as unknown as (unit: TimeUnit, timeFields: TimeFields) => TimeFields

export type IsoDateTimeInterval = [
  CalendarDateTimeFields,
  CalendarDateTimeFields,
]

// Floor
// -----------------------------------------------------------------------------

// For date-times; dates can be combined with timeFieldDefaults first.
export function computeDayFloor(
  slots: CalendarDateTimeFields,
): CalendarDateTimeFields {
  return combineDateAndTime(slots, timeFieldDefaults)
}

export function computeYearFloor(
  calendar: CalendarImpl,
  slots: CalendarDateFields,
): CalendarDateTimeFields {
  const { year: year0 } = computeCalendarDateFields(calendar, slots)
  // Boundary fields must stay ISO; calendar years can differ from ISO years.
  return computeCalendarDateTimeFromParts(calendar, year0)
}

export function computeMonthFloor(
  calendar: CalendarImpl,
  slots: CalendarDateFields,
): CalendarDateTimeFields {
  const { year: year0, month: month0 } = computeCalendarDateFields(
    calendar,
    slots,
  )
  return computeCalendarDateTimeFromParts(calendar, year0, month0)
}

export function computeIsoWeekFloor(
  _calendar: CalendarImpl,
  slots: CalendarDateFields,
): CalendarDateTimeFields {
  const dayOfWeek = computeIsoDayOfWeek(slots)
  return combineDateAndTime(moveByDays(slots, 1 - dayOfWeek), timeFieldDefaults)
}

export const computeHourFloor = bindArgs(clearTimeFields, Unit.Hour)
export const computeMinuteFloor = bindArgs(clearTimeFields, Unit.Minute)
export const computeSecFloor = bindArgs(clearTimeFields, Unit.Second)
export const computeMilliFloor = bindArgs(clearTimeFields, Unit.Millisecond)
export const computeMicroFloor = bindArgs(clearTimeFields, Unit.Microsecond)

// Ceil
// -----------------------------------------------------------------------------

export function computeYearCeil(
  calendar: CalendarImpl,
  slots: CalendarDateFields,
): CalendarDateTimeFields {
  return computeYearInterval(calendar, slots)[1]
}

export function computeMonthCeil(
  calendar: CalendarImpl,
  slots: CalendarDateFields,
): CalendarDateTimeFields {
  return computeMonthInterval(calendar, slots)[1]
}

export function computeIsoWeekCeil(
  calendar: CalendarImpl,
  slots: CalendarDateFields,
): CalendarDateTimeFields {
  return combineDateAndTime(
    moveByDays(computeIsoWeekFloor(calendar, slots), 7),
    timeFieldDefaults,
  )
}

export function computeDayCeil(
  _calendar: CalendarImpl,
  slots: CalendarDateFields,
): CalendarDateTimeFields {
  return combineDateAndTime(moveByDays(slots, 1), timeFieldDefaults)
}

// Interval
// -----------------------------------------------------------------------------

export function computeYearInterval(
  calendar: CalendarImpl,
  slots: CalendarDateFields,
): IsoDateTimeInterval {
  const isoFields0 = computeYearFloor(calendar, slots)
  const year1 = computeCalendarDateFields(calendar, slots).year + 1
  return [isoFields0, computeCalendarDateTimeFromParts(calendar, year1)]
}

export function computeMonthInterval(
  calendar: CalendarImpl,
  slots: CalendarDateFields,
): IsoDateTimeInterval {
  const isoFields0 = computeMonthFloor(calendar, slots)
  // Advance in calendar units, then convert the next boundary back to ISO.
  const { year, month } = computeCalendarDateFields(calendar, slots)
  const { year: year1, month: month1 } = addCalendarMonths(
    calendar,
    year,
    month,
    1,
  )
  return [isoFields0, computeCalendarDateTimeFromParts(calendar, year1, month1)]
}

export function computeIsoWeekInterval(
  calendar: CalendarImpl,
  slots: CalendarDateFields,
): IsoDateTimeInterval {
  const isoFields0 = computeIsoWeekFloor(calendar, slots)
  const isoFields1 = combineDateAndTime(
    moveByDays(isoFields0, 7),
    timeFieldDefaults,
  )
  return [isoFields0, isoFields1]
}

export function roundDateToInterval<S extends CalendarDateFields>(
  computeInterval: (calendar: CalendarImpl, slots: S) => IsoDateTimeInterval,
  calendar: CalendarImpl,
  slots: S,
  roundingMode: RoundingModeEnum,
): CalendarDateTimeFields {
  return roundEpochNanoToInterval(
    computeInterval,
    calendar,
    slots,
    isoDateToEpochNano(slots),
    roundingMode,
  )
}

function computeCalendarDateTimeFromParts(
  calendar: CalendarImpl,
  year: number,
  month = 1,
): CalendarDateTimeFields {
  return combineDateAndTime(
    computeCalendarIsoFieldsFromParts(calendar, year, month, 1),
    timeFieldDefaults,
  )
}

export function roundDateTimeToInterval<S extends CalendarDateTimeFields>(
  computeInterval: (calendar: CalendarImpl, slots: S) => IsoDateTimeInterval,
  calendar: CalendarImpl,
  slots: S,
  roundingMode: RoundingModeEnum,
): CalendarDateTimeFields {
  return roundEpochNanoToInterval(
    computeInterval,
    calendar,
    slots,
    isoDateTimeToEpochNano(slots),
    roundingMode,
  )
}

function roundEpochNanoToInterval<S extends CalendarDateFields>(
  computeInterval: (calendar: CalendarImpl, slots: S) => IsoDateTimeInterval,
  calendar: CalendarImpl,
  slots: S,
  epochNano: bigint,
  roundingMode: RoundingModeEnum,
): CalendarDateTimeFields {
  const [isoFields0, isoFields1] = computeInterval(calendar, slots)
  const epochNano0 = isoDateTimeToEpochNano(isoFields0)
  const epochNano1 = isoDateTimeToEpochNano(isoFields1)
  const frac = computeEpochNanoFrac(epochNano, epochNano0, epochNano1)
  const grow = roundWithMode(frac, roundingMode)
  return grow ? isoFields1 : isoFields0
}
