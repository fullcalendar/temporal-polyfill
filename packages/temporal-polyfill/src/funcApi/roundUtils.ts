import {
  queryCalendarDateFields,
  queryCalendarEpochMilli,
} from '../internal/calendarQuery'
import { timeFieldDefaults, timeFieldNamesAsc } from '../internal/fieldNames'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  TimeFields,
} from '../internal/fieldTypes'
import { combineDateAndTime } from '../internal/fieldUtils'
import { computeIsoDayOfWeek } from '../internal/isoMath'
import { addCalendarMonths, moveByDays } from '../internal/move'
import { RoundingMode } from '../internal/optionsModel'
import { IsoDateTimeInterval, roundWithMode } from '../internal/round'
import { AbstractDateSlots } from '../internal/slots'
import {
  epochMilliToIsoDateTime,
  isoDateTimeToEpochNano,
} from '../internal/timeMath'
import { computeEpochNanoFrac } from '../internal/total'
import { TimeUnit, Unit } from '../internal/units'
import { bindArgs, zeroOutProps } from '../internal/utils'

const clearTimeFields = bindArgs(
  zeroOutProps,
  timeFieldNamesAsc,
) as unknown as (unit: TimeUnit, timeFields: TimeFields) => TimeFields

// Floor
// -----------------------------------------------------------------------------

export function computeYearFloor(
  slots: AbstractDateSlots,
): CalendarDateTimeFields & { year: number } {
  const { calendarId } = slots
  const { year: year0 } = queryCalendarDateFields(calendarId, slots)
  return {
    ...epochMilliToIsoDateTime(queryCalendarEpochMilli(calendarId, year0)),
    year: year0,
  }
}

export function computeMonthFloor(
  slots: AbstractDateSlots,
): CalendarDateTimeFields & { year: number; month: number } {
  const { calendarId } = slots
  const { year: year0, month: month0 } = queryCalendarDateFields(
    calendarId,
    slots,
  )
  return {
    ...epochMilliToIsoDateTime(
      queryCalendarEpochMilli(calendarId, year0, month0),
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
  slots: AbstractDateSlots,
): IsoDateTimeInterval {
  const { calendarId } = slots
  const isoFields0 = computeYearFloor(slots)
  const year1 = isoFields0.year + 1
  return [
    isoFields0,
    epochMilliToIsoDateTime(queryCalendarEpochMilli(calendarId, year1)),
  ]
}

export function computeMonthInterval(
  slots: AbstractDateSlots,
): IsoDateTimeInterval {
  const { calendarId } = slots
  const isoFields0 = computeMonthFloor(slots)
  const { year: year1, month: month1 } = addCalendarMonths(
    calendarId,
    isoFields0.year,
    isoFields0.month,
    1,
  )
  return [
    isoFields0,
    epochMilliToIsoDateTime(queryCalendarEpochMilli(calendarId, year1, month1)),
  ]
}

export function computeIsoWeekInterval(
  slots: AbstractDateSlots,
): IsoDateTimeInterval {
  const isoFields0 = computeIsoWeekFloor(slots)
  const isoFields1 = combineDateAndTime(
    moveByDays(isoFields0, 7),
    timeFieldDefaults,
  )
  return [isoFields0, isoFields1]
}

/*
For year/month/week only
*/
export function roundDateTimeToInterval<S extends AbstractDateSlots>(
  computeInterval: (slots: S) => IsoDateTimeInterval,
  slots: S,
  roundingMode: RoundingMode,
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
