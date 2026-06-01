import type { RoundingMathOptions, RoundingMode } from 'temporal-utils'
import {
  computeCalendarDateFields,
  computeCalendarEpochMilli,
} from '../../internal/calendarDerived'
import { type CalendarSlot } from '../../internal/calendarSlot'
import {
  epochMilliToIsoDateTime,
  isoDateTimeToEpochNano,
} from '../../internal/epochMath'
import { timeFieldDefaults, timeFieldNamesAsc } from '../../internal/fieldNames'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  TimeFields,
} from '../../internal/fieldTypes'
import { combineDateAndTime } from '../../internal/fieldUtils'
import { computeIsoDayOfWeek } from '../../internal/isoCalendarMath'
import { addCalendarMonths, moveByDays } from '../../internal/move'
import {
  coerceRoundingIncInteger,
  coerceRoundingMode,
} from '../../internal/optionsCoerce'
import {
  RoundingMathTuple,
  RoundingModeEnum,
} from '../../internal/optionsModel'
import { validateRoundingInc } from '../../internal/optionsValidate'
import { IsoDateTimeInterval, roundWithMode } from '../../internal/round'
import { computeEpochNanoFrac } from '../../internal/total'
import { TimeUnit, Unit } from '../../internal/units'
import { bindArgs, zeroOutProps } from '../../internal/utils'
import { normalizeRoundToOptions } from '../roundToUtils'

const clearTimeFields = bindArgs(
  zeroOutProps,
  timeFieldNamesAsc,
) as unknown as (unit: TimeUnit, timeFields: TimeFields) => TimeFields

// Floor
// -----------------------------------------------------------------------------

export function computeYearFloor(
  slots: CalendarDateFields & { calendar: CalendarSlot },
): CalendarDateTimeFields & { year: number } {
  const { calendar } = slots
  const { year: year0 } = computeCalendarDateFields(calendar, slots)
  return {
    ...epochMilliToIsoDateTime(computeCalendarEpochMilli(calendar, year0)),
    year: year0,
  }
}

export function computeMonthFloor(
  slots: CalendarDateFields & { calendar: CalendarSlot },
): CalendarDateTimeFields & { year: number; month: number } {
  const { calendar } = slots
  const { year: year0, month: month0 } = computeCalendarDateFields(
    calendar,
    slots,
  )
  return {
    ...epochMilliToIsoDateTime(
      computeCalendarEpochMilli(calendar, year0, month0),
    ),
    year: year0,
    month: month0,
  }
}

export function computeIsoWeekFloor(
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
  slots: CalendarDateFields & { calendar: CalendarSlot },
): CalendarDateTimeFields {
  return computeYearInterval(slots)[1]
}

export function computeMonthCeil(
  slots: CalendarDateFields & { calendar: CalendarSlot },
): CalendarDateTimeFields {
  return computeMonthInterval(slots)[1]
}

export function computeIsoWeekCeil(
  slots: CalendarDateFields,
): CalendarDateTimeFields {
  return combineDateAndTime(
    moveByDays(computeIsoWeekFloor(slots), 7),
    timeFieldDefaults,
  )
}

export function computeDayCeil(
  slots: CalendarDateFields,
): CalendarDateTimeFields {
  return combineDateAndTime(moveByDays(slots, 1), timeFieldDefaults)
}

// Interval
// -----------------------------------------------------------------------------

export function computeYearInterval(
  slots: CalendarDateFields & { calendar: CalendarSlot },
): IsoDateTimeInterval {
  const { calendar } = slots
  const isoFields0 = computeYearFloor(slots)
  const year1 = isoFields0.year + 1
  return [
    isoFields0,
    epochMilliToIsoDateTime(computeCalendarEpochMilli(calendar, year1)),
  ]
}

export function computeMonthInterval(
  slots: CalendarDateFields & { calendar: CalendarSlot },
): IsoDateTimeInterval {
  const { calendar } = slots
  const isoFields0 = computeMonthFloor(slots)
  const { year: year1, month: month1 } = addCalendarMonths(
    calendar,
    isoFields0.year,
    isoFields0.month,
    1,
  )
  return [
    isoFields0,
    epochMilliToIsoDateTime(computeCalendarEpochMilli(calendar, year1, month1)),
  ]
}

export function computeIsoWeekInterval(
  slots: CalendarDateFields & { calendar: CalendarSlot },
): IsoDateTimeInterval {
  const isoFields0 = computeIsoWeekFloor(slots)
  const isoFields1 = combineDateAndTime(
    moveByDays(isoFields0, 7),
    timeFieldDefaults,
  )
  return [isoFields0, isoFields1]
}

// TODO: split this instead of using 'hour' conditional
export function roundDateTimeToInterval<
  S extends CalendarDateFields & { calendar: CalendarSlot },
>(
  computeInterval: (slots: S) => IsoDateTimeInterval,
  slots: S,
  roundingMode: RoundingModeEnum,
): CalendarDateTimeFields {
  const [isoFields0, isoFields1] = computeInterval(slots)
  const time: TimeFields =
    'hour' in slots ? (slots as unknown as TimeFields) : timeFieldDefaults
  const epochNano0 = isoDateTimeToEpochNano(isoFields0)!
  const epochNano1 = isoDateTimeToEpochNano(isoFields1)!
  const epochNano = isoDateTimeToEpochNano(combineDateAndTime(slots, time))!
  const frac = computeEpochNanoFrac(epochNano, epochNano0, epochNano1)
  const grow = roundWithMode(frac, roundingMode)
  return grow ? isoFields1 : isoFields0
}

// Options
// -----------------------------------------------------------------------------

/*
Refines roundTo*-style args where smallestUnit is already known separately
(as a positional arg) and the options bag only carries roundingIncrement/
roundingMode. Avoids synthesizing a raw options object for re-parsing.
*/
export function refineRoundToOptions(
  smallestUnit: Unit,
  options?: RoundingMathOptions | RoundingMode,
  solarMode?: boolean, // Instant: increments validated against a full day
): RoundingMathTuple {
  options = normalizeRoundToOptions(options)

  // alphabetical
  let roundingInc = coerceRoundingIncInteger(options)
  const roundingMode = coerceRoundingMode(options, RoundingModeEnum.HalfExpand)

  roundingInc = validateRoundingInc(
    roundingInc,
    smallestUnit,
    undefined,
    solarMode,
  )
  return [roundingInc, roundingMode]
}
