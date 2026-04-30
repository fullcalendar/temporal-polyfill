import {
  queryCalendarDateFields,
  queryCalendarEpochMilli,
} from '../internal/calendarQuery'
import {
  calendarDateTimeFieldNamesAsc,
  timeFieldDefaults,
} from '../internal/fieldNames'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
} from '../internal/fieldTypes'
import { computeIsoDayOfWeek } from '../internal/isoMath'
import { addCalendarMonths, moveByDays } from '../internal/move'
import { RoundingMode } from '../internal/optionsModel'
import { IsoDateTimeInterval, roundWithMode } from '../internal/round'
import { AbstractDateSlots } from '../internal/slots'
import { epochMilliToIso, isoToEpochNano } from '../internal/timeMath'
import { computeEpochNanoFrac } from '../internal/total'
import { DayTimeUnit, Unit } from '../internal/units'
import { bindArgs, zeroOutProps } from '../internal/utils'
import { moveByIsoWeeks } from './moveUtils'

const clearCalendarDateTimeFields = bindArgs(
  zeroOutProps,
  calendarDateTimeFieldNamesAsc,
) as unknown as (
  unit: DayTimeUnit,
  isoFields: CalendarDateTimeFields,
) => CalendarDateTimeFields

// Floor
// -----------------------------------------------------------------------------

export function computeYearFloor(
  slots: AbstractDateSlots,
): CalendarDateTimeFields & { year: number } {
  const { year: year0 } = queryCalendarDateFields(slots.calendar, slots)
  const isoFields0 = epochMilliToIso(
    queryCalendarEpochMilli(slots.calendar, year0),
  )
  return { ...isoFields0, year: year0 }
}

export function computeMonthFloor(
  slots: AbstractDateSlots,
): CalendarDateTimeFields & { year: number; month: number } {
  const { year: year0, month: month0 } = queryCalendarDateFields(
    slots.calendar,
    slots,
  )
  const isoFields0 = epochMilliToIso(
    queryCalendarEpochMilli(slots.calendar, year0, month0),
  )
  return { ...isoFields0, year: year0, month: month0 }
}

export function computeIsoWeekFloor(
  slots: CalendarDateFields,
): CalendarDateTimeFields {
  const dayOfWeek = computeIsoDayOfWeek(slots)
  const isoDateFields0 = moveByDays(slots, 1 - dayOfWeek)
  return { ...isoDateFields0, ...timeFieldDefaults }
}

export const computeHourFloor = bindArgs(clearCalendarDateTimeFields, Unit.Hour)
export const computeMinuteFloor = bindArgs(
  clearCalendarDateTimeFields,
  Unit.Minute,
)
export const computeSecFloor = bindArgs(
  clearCalendarDateTimeFields,
  Unit.Second,
)
export const computeMilliFloor = bindArgs(
  clearCalendarDateTimeFields,
  Unit.Millisecond,
)
export const computeMicroFloor = bindArgs(
  clearCalendarDateTimeFields,
  Unit.Microsecond,
)

// Ceil
// -----------------------------------------------------------------------------

export function computeYearCeil(
  slots: AbstractDateSlots,
): CalendarDateTimeFields {
  return computeYearInterval(slots)[1]
}

export function computeMonthCeil(
  slots: AbstractDateSlots,
): CalendarDateTimeFields {
  return computeMonthInterval(slots)[1]
}

export function computeIsoWeekCeil(
  slots: CalendarDateFields,
): CalendarDateTimeFields {
  return computeIsoWeekInterval(slots)[1]
}

// Interval
// -----------------------------------------------------------------------------

export function computeYearInterval(
  slots: AbstractDateSlots,
): IsoDateTimeInterval {
  const isoFields0 = computeYearFloor(slots)
  const year1 = isoFields0.year + 1
  const isoFields1 = epochMilliToIso(
    queryCalendarEpochMilli(slots.calendar, year1),
  )
  return [isoFields0, isoFields1]
}

export function computeMonthInterval(
  slots: AbstractDateSlots,
): IsoDateTimeInterval {
  const isoFields0 = computeMonthFloor(slots)
  const { year: year1, month: month1 } = addCalendarMonths(
    slots.calendar,
    isoFields0.year,
    isoFields0.month,
    1,
  )
  const isoFields1 = epochMilliToIso(
    queryCalendarEpochMilli(slots.calendar, year1, month1),
  )
  return [isoFields0, isoFields1]
}

export function computeIsoWeekInterval(
  slots: CalendarDateFields,
): IsoDateTimeInterval {
  const isoFields0 = computeIsoWeekFloor(slots)
  const isoFields1 = moveByIsoWeeks(isoFields0, 1)
  return [isoFields0, isoFields1]
}

/*
For year/month/week only
*/
export function roundDateTimeToInterval<S extends AbstractDateSlots>(
  computeInterval: (slots: S) => IsoDateTimeInterval,
  slots: S,
  roundingMode: RoundingMode,
): S & CalendarDateTimeFields {
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
