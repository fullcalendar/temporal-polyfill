import {
  queryCalendarDateFields,
  queryCalendarEpochMilli,
} from '../internal/calendarQuery'
import { timeFieldDefaults, timeFieldNamesAsc } from '../internal/fieldNames'
import { TimeFields } from '../internal/fieldTypes'
import { IsoDateCarrier, IsoDateTimeCarrier } from '../internal/isoFields'
import { computeIsoDayOfWeek } from '../internal/isoMath'
import { addCalendarMonths, moveByDays } from '../internal/move'
import { RoundingMode } from '../internal/optionsModel'
import { IsoDateTimeInterval, roundWithMode } from '../internal/round'
import { AbstractDateSlots } from '../internal/slots'
import {
  epochMilliToIso,
  isoDateAndTimeToEpochNano,
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
): IsoDateTimeCarrier & { year: number } {
  const { calendar, isoDate } = slots
  const { year: year0 } = queryCalendarDateFields(calendar, isoDate)
  const { isoDate: isoDate0, time: time0 } = epochMilliToIso(
    queryCalendarEpochMilli(calendar, year0),
  )
  return { isoDate: isoDate0, time: time0, year: year0 }
}

export function computeMonthFloor(
  slots: AbstractDateSlots,
): IsoDateTimeCarrier & { year: number; month: number } {
  const { calendar, isoDate } = slots
  const { year: year0, month: month0 } = queryCalendarDateFields(
    calendar,
    isoDate,
  )
  const { isoDate: isoDate0, time: time0 } = epochMilliToIso(
    queryCalendarEpochMilli(calendar, year0, month0),
  )
  return {
    isoDate: isoDate0,
    time: time0,
    year: year0,
    month: month0,
  }
}

export function computeIsoWeekFloor(slots: IsoDateCarrier): IsoDateTimeCarrier {
  const { isoDate } = slots
  const dayOfWeek = computeIsoDayOfWeek(isoDate)
  return {
    isoDate: moveByDays(isoDate, 1 - dayOfWeek),
    time: timeFieldDefaults,
  }
}

export const computeHourFloor = bindArgs(clearTimeFields, Unit.Hour)
export const computeMinuteFloor = bindArgs(clearTimeFields, Unit.Minute)
export const computeSecFloor = bindArgs(clearTimeFields, Unit.Second)
export const computeMilliFloor = bindArgs(clearTimeFields, Unit.Millisecond)
export const computeMicroFloor = bindArgs(clearTimeFields, Unit.Microsecond)

// Ceil
// -----------------------------------------------------------------------------

export function computeYearCeil(slots: AbstractDateSlots): IsoDateTimeCarrier {
  return computeYearInterval(slots)[1]
}

export function computeMonthCeil(slots: AbstractDateSlots): IsoDateTimeCarrier {
  return computeMonthInterval(slots)[1]
}

export function computeIsoWeekCeil(slots: IsoDateCarrier): IsoDateTimeCarrier {
  return {
    isoDate: moveByDays(computeIsoWeekFloor(slots).isoDate, 7),
    time: timeFieldDefaults,
  }
}

export function computeDayCeil(slots: IsoDateCarrier): IsoDateTimeCarrier {
  return {
    isoDate: moveByDays(slots.isoDate, 1),
    time: timeFieldDefaults,
  }
}

// Interval
// -----------------------------------------------------------------------------

export function computeYearInterval(
  slots: AbstractDateSlots,
): IsoDateTimeInterval {
  const { calendar } = slots
  const isoFields0 = computeYearFloor(slots)
  const year1 = isoFields0.year + 1
  const { isoDate: isoDate1, time: time1 } = epochMilliToIso(
    queryCalendarEpochMilli(calendar, year1),
  )
  return [isoFields0, { isoDate: isoDate1, time: time1 }]
}

export function computeMonthInterval(
  slots: AbstractDateSlots,
): IsoDateTimeInterval {
  const { calendar } = slots
  const isoFields0 = computeMonthFloor(slots)
  const { year: year1, month: month1 } = addCalendarMonths(
    calendar,
    isoFields0.year,
    isoFields0.month,
    1,
  )
  const { isoDate: isoDate1, time: time1 } = epochMilliToIso(
    queryCalendarEpochMilli(calendar, year1, month1),
  )
  return [isoFields0, { isoDate: isoDate1, time: time1 }]
}

export function computeIsoWeekInterval(
  slots: AbstractDateSlots,
): IsoDateTimeInterval {
  const isoFields0 = computeIsoWeekFloor(slots)
  const isoFields1 = {
    isoDate: moveByDays(isoFields0.isoDate, 7),
    time: timeFieldDefaults,
  }
  return [isoFields0, isoFields1]
}

/*
For year/month/week only
*/
export function roundDateTimeToInterval<S extends AbstractDateSlots>(
  computeInterval: (slots: S) => IsoDateTimeInterval,
  slots: S,
  roundingMode: RoundingMode,
): IsoDateTimeCarrier {
  const [isoFields0, isoFields1] = computeInterval(slots)
  const time: TimeFields =
    'time' in slots ? (slots.time as TimeFields) : timeFieldDefaults
  const epochNano0 = isoDateAndTimeToEpochNano(
    isoFields0.isoDate,
    isoFields0.time,
  )!
  const epochNano1 = isoDateAndTimeToEpochNano(
    isoFields1.isoDate,
    isoFields1.time,
  )!
  const epochNano = isoDateAndTimeToEpochNano(slots.isoDate, time)!
  const frac = computeEpochNanoFrac(epochNano, epochNano0, epochNano1)
  const grow = roundWithMode(frac, roundingMode)
  return grow ? isoFields1 : isoFields0
}
