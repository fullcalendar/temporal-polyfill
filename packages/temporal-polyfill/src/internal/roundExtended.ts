/*
WIP. Ultimately for funcApi
*/
import * as errorMessages from '../internal/errorMessages'
import { moveBigNano } from './bigNano'
import {
  createNativeConvertOps,
  createNativeWeekOps,
} from './calendarNativeQuery'
import {
  IsoDateFields,
  IsoDateTimeFields,
  isoTimeFieldDefaults,
} from './isoFields'
import { computeIsoDayOfWeek } from './isoMath'
import { moveByIsoDays } from './move'
import {
  RoundingMathOptions,
  RoundingModeName,
  refineRoundingMathOptions,
} from './optionsRefine'
import {
  DateTimeInterval,
  computeDayFloor,
  computeDayInterval,
  computeHourFloor,
  computeMicrosecondFloor,
  computeMillisecondFloor,
  computeMinuteFloor,
  computeSecondFloor,
  computeZonedEdge,
  roundWithMode,
  roundZonedEpoch,
} from './round'
import {
  DateSlots,
  DateTimeSlots,
  EpochSlots,
  PlainDateSlots,
  PlainDateTimeSlots,
  ZonedDateTimeSlots,
  createPlainDateSlots,
  createPlainDateTimeSlots,
  createZonedDateTimeSlots,
} from './slots'
import { epochMilliToIso, epochNanoToIso, isoToEpochNano } from './timeMath'
import { queryNativeTimeZone } from './timeZoneNative'
import { computeEpochNanoFrac } from './total'
import {
  Unit,
  nanoInHour,
  nanoInMicro,
  nanoInMilli,
  nanoInMinute,
  nanoInSec,
  nanoInUtcDay,
} from './units'
import { bindArgs } from './utils'

// Utils: Floor
// -----------------------------------------------------------------------------

function computeYearFloor(
  slots: DateSlots<string>,
  roundingInc = 1,
  calendarOps = createNativeConvertOps(slots.calendar),
): [isoFields0: IsoDateTimeFields, year0: number] {
  const [year] = calendarOps.dateParts(slots)
  const year0 = Math.floor(year / roundingInc) * roundingInc
  const isoFields0 = epochMilliToIso(calendarOps.epochMilli(year0))
  return [isoFields0, year0]
}

function computeMonthFloor(
  slots: DateSlots<string>,
  roundingInc = 1,
  calendarOps = createNativeConvertOps(slots.calendar),
): [isoFields0: IsoDateTimeFields, year0: number, year1: number] {
  const [year0, month] = calendarOps.dateParts(slots)
  const month0 = Math.floor((month - 1) / roundingInc) * roundingInc + 1
  const isoFields0 = epochMilliToIso(calendarOps.epochMilli(year0, month0))
  return [isoFields0, year0, month0]
}

function computeWeekFloor(
  slots: DateSlots<string>,
  roundingInc = 1,
): [IsoDateTimeFields] {
  const calendarOps = createNativeWeekOps(slots.calendar)
  const weekOfYear = calendarOps.weekOfYear(slots)
  if (weekOfYear === undefined && roundingInc !== 1) {
    throw new RangeError(errorMessages.unsupportedWeekNumbers)
  }
  const dayOfWeek = computeIsoDayOfWeek(slots)
  const isoDateFields0 = moveByIsoDays(
    slots,
    -(dayOfWeek - 1 + ((weekOfYear || 1) - 1) * 7),
  )
  return [{ ...isoDateFields0, ...isoTimeFieldDefaults }]
}

// Utils: Interval
// -----------------------------------------------------------------------------

function computeYearInterval(
  slots: DateSlots<string>,
  roundingInc = 1,
): DateTimeInterval {
  const calendarOps = createNativeConvertOps(slots.calendar)
  const [isoFields0, year0] = computeYearFloor(slots, roundingInc)
  const year1 = year0 + roundingInc
  const isoFields1 = epochMilliToIso(calendarOps.epochMilli(year1))
  return [isoFields1, isoFields0] // end is first!
}

function computeMonthInterval(
  slots: DateSlots<string>,
  roundingInc = 1,
): DateTimeInterval {
  const calendarOps = createNativeConvertOps(slots.calendar)
  const [isoFields0, year0, month0] = computeMonthFloor(
    slots,
    roundingInc,
    calendarOps,
  )
  const [year1, month1] = calendarOps.monthAdd(year0, month0, roundingInc)
  const isoFields1 = epochMilliToIso(calendarOps.epochMilli(year1, month1))
  return [isoFields1, isoFields0] // end is first!
}

function computeWeekInterval(
  slots: DateSlots<string>,
  roundingInc = 1,
): DateTimeInterval {
  const [isoFields0] = computeWeekFloor(slots, roundingInc)
  const isoFields1 = {
    ...moveByIsoDays(isoFields0, roundingInc * 7),
    ...isoTimeFieldDefaults,
  }
  return [isoFields1, isoFields0] // end is first!
}

// Utils: Nudged
// -----------------------------------------------------------------------------

function dateNudged<S extends IsoDateFields>(
  f: (slots: S) => S,
): (slots: S) => S {
  return (slots: S) => {
    slots = f(slots)
    return {
      ...slots,
      ...moveByIsoDays(slots, -1),
    }
  }
}

function dateTimeNudged<S extends IsoDateTimeFields>(
  f: (slots: S) => S,
  nano = -1,
): (slots: S) => S {
  return (slots: S) => {
    slots = f(slots)
    return {
      ...slots,
      ...epochNanoToIso(isoToEpochNano(slots)!, nano),
    }
  }
}

function epochNudged<S extends EpochSlots>(
  f: (slots: S) => S,
  nano = -1,
): (slots: S) => S {
  return (slots: S) => {
    slots = f(slots)
    return {
      ...slots,
      epochNanoseconds: moveBigNano(slots.epochNanoseconds, nano),
    }
  }
}

// Utils: Rounding
// -----------------------------------------------------------------------------

function roundToPlainUnit<PS>(
  unit: Unit,
  computeInterval: (
    isoFields: DateSlots<string>,
    roundingInc: number,
  ) => DateTimeInterval,
  createSlots: (isoFields: IsoDateTimeFields, calendar: string) => PS,
  slots: DateSlots<string>,
  options: RoundingModeName | RoundingMathOptions,
): PS {
  const [roundingInc, roundingMode] = refineRoundingMathOptions(unit, options)
  const [isoFields1, isoFields0] = computeInterval(slots, roundingInc)
  const epochNano0 = isoToEpochNano(isoFields0)!
  const epochNano1 = isoToEpochNano(isoFields1)!
  const epochNano = isoToEpochNano(slots)!
  const frac = computeEpochNanoFrac(epochNano0, epochNano1, epochNano)
  const grow = roundWithMode(frac, roundingMode)
  const isoFieldsRounded = grow ? isoFields1 : isoFields0
  return createSlots(isoFieldsRounded, slots.calendar)
}

function roundToZonedUnit(
  unit: Unit,
  computeInterval: (
    isoFields: DateTimeSlots<string>,
    roundingInc: number,
  ) => DateTimeInterval,
  slots: ZonedDateTimeSlots<string, string>,
  options: RoundingModeName | RoundingMathOptions,
): ZonedDateTimeSlots<string, string> {
  const { timeZone, calendar } = slots
  const [roundingInc, roundingMode] = refineRoundingMathOptions(unit, options)
  const timeZoneOps = queryNativeTimeZone(timeZone)
  const epochNanoRounded = roundZonedEpoch(
    computeInterval,
    timeZoneOps,
    slots,
    roundingMode,
    roundingInc,
  )
  return createZonedDateTimeSlots(epochNanoRounded, timeZone, calendar)
}

// start-of-unit
// -----------------------------------------------------------------------------
// TODO: arg/return types should be Record eventually

export function pd_startOfYear(slots: PlainDateSlots<string>) {
  const [isoFields0] = computeYearFloor(slots)
  return createPlainDateSlots(isoFields0, slots.calendar)
}

export function pd_startOfMonth(slots: PlainDateSlots<string>) {
  const [isoFields0] = computeMonthFloor(slots)
  return createPlainDateSlots(isoFields0, slots.calendar)
}

export function pd_startOfWeek(slots: PlainDateSlots<string>) {
  const [isoFields0] = computeWeekFloor(slots)
  return createPlainDateSlots(isoFields0, slots.calendar)
}

export function pdt_startOfYear(slots: PlainDateTimeSlots<string>) {
  const [isoFields0] = computeYearFloor(slots)
  return createPlainDateTimeSlots(isoFields0, slots.calendar)
}

export function pdt_startOfMonth(slots: PlainDateTimeSlots<string>) {
  const [isoFields0] = computeMonthFloor(slots)
  return createPlainDateTimeSlots(isoFields0, slots.calendar)
}

export function pdt_startOfWeek(slots: PlainDateTimeSlots<string>) {
  const [isoFields0] = computeWeekFloor(slots)
  return createPlainDateTimeSlots(isoFields0, slots.calendar)
}

export function pdt_startOfDay(slots: PlainDateTimeSlots<string>) {
  const [isoFields0] = computeDayFloor(slots)
  return createPlainDateTimeSlots(isoFields0, slots.calendar)
}

export function pdt_startOfHour(slots: PlainDateTimeSlots<string>) {
  const [isoFields0] = computeHourFloor(slots)
  return createPlainDateTimeSlots(isoFields0, slots.calendar)
}

export function pdt_startOfMinute(slots: PlainDateTimeSlots<string>) {
  const [isoFields0] = computeMinuteFloor(slots)
  return createPlainDateTimeSlots(isoFields0, slots.calendar)
}

export function pdt_startOfSecond(slots: PlainDateTimeSlots<string>) {
  const [isoFields0] = computeSecondFloor(slots)
  return createPlainDateTimeSlots(isoFields0, slots.calendar)
}

export function pdt_startOfMillisecond(slots: PlainDateTimeSlots<string>) {
  const [isoFields0] = computeMillisecondFloor(slots)
  return createPlainDateTimeSlots(isoFields0, slots.calendar)
}

export function pdt_startOfMicrosecond(slots: PlainDateTimeSlots<string>) {
  const [isoFields0] = computeMicrosecondFloor(slots)
  return createPlainDateTimeSlots(isoFields0, slots.calendar)
}

export const zdt_startOfYear = bindArgs(
  computeZonedEdge,
  queryNativeTimeZone,
  computeYearFloor,
)

export const zdt_startOfMonth = bindArgs(
  computeZonedEdge,
  queryNativeTimeZone,
  computeMonthFloor,
)

export const zdt_startOfWeek = bindArgs(
  computeZonedEdge,
  queryNativeTimeZone,
  computeWeekFloor,
)

// export const zdt_startOfDay = bindArgs(
//   computeZonedEdge,
//   queryNativeTimeZone,
//   computeDayFloor,
// )

export const zdt_startOfHour = bindArgs(
  computeZonedEdge,
  queryNativeTimeZone,
  computeHourFloor,
)

export const zdt_startOfMinute = bindArgs(
  computeZonedEdge,
  queryNativeTimeZone,
  computeMinuteFloor,
)

export const zdt_startOfSecond = bindArgs(
  computeZonedEdge,
  queryNativeTimeZone,
  computeSecondFloor,
)

export const zdt_startOfMillisecond = bindArgs(
  computeZonedEdge,
  queryNativeTimeZone,
  computeMillisecondFloor,
)

export const zdt_startOfMicrosecond = bindArgs(
  computeZonedEdge,
  queryNativeTimeZone,
  computeMicrosecondFloor,
)

// end-of-unit EXCL
// -----------------------------------------------------------------------------
// TODO: arg/return types should be Record eventually

export function pd_endOfYearExcl(slots: PlainDateSlots<string>) {
  const [isoFields1] = computeYearInterval(slots)
  return createPlainDateSlots(isoFields1, slots.calendar)
}

export function pd_endOfMonthExcl(slots: PlainDateSlots<string>) {
  const [isoFields1] = computeMonthInterval(slots)
  return createPlainDateSlots(isoFields1, slots.calendar)
}

export function pd_endOfWeekExcl(slots: PlainDateSlots<string>) {
  const [isoFields1] = computeWeekInterval(slots)
  return createPlainDateSlots(isoFields1, slots.calendar)
}

export function pdt_endOfYearExcl(slots: PlainDateTimeSlots<string>) {
  const [isoFields1] = computeYearInterval(slots)
  return createPlainDateTimeSlots(isoFields1, slots.calendar)
}

export function pdt_endOfMonthExcl(slots: PlainDateTimeSlots<string>) {
  const [isoFields1] = computeMonthInterval(slots)
  return createPlainDateTimeSlots(isoFields1, slots.calendar)
}

export function pdt_endOfWeekExcl(slots: PlainDateTimeSlots<string>) {
  const [isoFields1] = computeWeekInterval(slots)
  return createPlainDateTimeSlots(isoFields1, slots.calendar)
}

export const pdt_endOfDayExcl = dateTimeNudged(pdt_startOfDay, nanoInUtcDay)
export const pdt_endOfHourExcl = dateTimeNudged(pdt_startOfHour, nanoInHour)
export const pdt_endOfMinuteExcl = dateTimeNudged(pdt_startOfHour, nanoInMinute)
export const pdt_endOfSecondExcl = dateTimeNudged(pdt_startOfSecond, nanoInSec)

export const pdt_endOfMillisecondExcl = dateTimeNudged(
  pdt_startOfMillisecond,
  nanoInMilli,
)

export const pdt_endOfMicrosecondExcl = dateTimeNudged(
  pdt_startOfMicrosecond,
  nanoInMicro,
)

export const zdt_endOfYearExcl = bindArgs(
  computeZonedEdge,
  queryNativeTimeZone,
  computeYearInterval,
)

export const zdt_endOfMonthExcl = bindArgs(
  computeZonedEdge,
  queryNativeTimeZone,
  computeMonthInterval,
)

export const zdt_endOfWeekExcl = bindArgs(
  computeZonedEdge,
  queryNativeTimeZone,
  computeWeekInterval,
)

export const zdt_endOfDayExcl = bindArgs(
  computeZonedEdge,
  queryNativeTimeZone,
  computeDayInterval,
)

export const zdt_endOfHourExcl = epochNudged(zdt_startOfHour, nanoInHour)
export const zdt_endOfMinuteExcl = epochNudged(zdt_startOfMinute, nanoInMinute)
export const zdt_endOfSecondExcl = epochNudged(zdt_startOfSecond, nanoInSec)

export const zdt_endOfMillisecondExcl = epochNudged(
  zdt_startOfMillisecond,
  nanoInMilli,
)
export const zdt_endOfMicrosecondExcl = epochNudged(
  zdt_startOfMicrosecond,
  nanoInMicro,
)

// end-of-unit INCL
// -----------------------------------------------------------------------------
// TODO: arg/return types should be Record eventually

export const pd_endOfYearIncl = dateNudged(pd_endOfYearExcl)
export const pd_endOfMonthIncl = dateNudged(pd_endOfMonthExcl)
export const pd_endOfWeekIncl = dateNudged(pd_endOfWeekExcl)

export const pdt_endOfYearIncl = dateTimeNudged(pdt_endOfYearExcl)
export const pdt_endOfMonthIncl = dateTimeNudged(pdt_endOfMonthExcl)
export const pdt_endOfWeekIncl = dateTimeNudged(pdt_endOfWeekExcl)
export const pdt_endOfDayIncl = dateTimeNudged(pdt_endOfDayExcl)
export const pdt_endOfHourIncl = dateTimeNudged(pdt_endOfHourExcl)
export const pdt_endOfMinuteIncl = dateTimeNudged(pdt_endOfMinuteExcl)
export const pdt_endOfSecondIncl = dateTimeNudged(pdt_endOfSecondExcl)
export const pdt_endOfMillisecondIncl = dateTimeNudged(pdt_endOfMillisecondExcl)
export const pdt_endOfMicrosecondIncl = dateTimeNudged(pdt_endOfMicrosecondExcl)

export const zdt_endOfYearIncl = epochNudged(zdt_endOfYearExcl)
export const zdt_endOfMonthIncl = epochNudged(zdt_endOfMonthExcl)
export const zdt_endOfWeekIncl = epochNudged(zdt_endOfWeekExcl)
export const zdt_endOfDayIncl = epochNudged(zdt_endOfDayExcl)
export const zdt_endOfHourIncl = epochNudged(zdt_endOfHourExcl)
export const zdt_endOfMinuteIncl = epochNudged(zdt_endOfMinuteExcl)
export const zdt_endOfSecondIncl = epochNudged(zdt_endOfSecondExcl)
export const zdt_endOfMillisecondIncl = epochNudged(zdt_endOfMillisecondExcl)
export const zdt_endOfMicrosecondIncl = epochNudged(zdt_endOfMicrosecondExcl)

// rounding
// -----------------------------------------------------------------------------

export const pd_roundToYear = bindArgs(
  roundToPlainUnit,
  Unit.Year,
  computeYearInterval,
  createPlainDateSlots,
)

export const pd_roundToMonth = bindArgs(
  roundToPlainUnit,
  Unit.Month,
  computeMonthInterval,
  createPlainDateSlots,
)

export const pd_roundToWeek = bindArgs(
  roundToPlainUnit,
  Unit.Week,
  computeWeekInterval,
  createPlainDateSlots,
)

export const pdt_roundToYear = bindArgs(
  roundToPlainUnit,
  Unit.Year,
  computeYearInterval,
  createPlainDateTimeSlots,
)

export const pdt_roundToMonth = bindArgs(
  roundToPlainUnit,
  Unit.Month,
  computeMonthInterval,
  createPlainDateTimeSlots,
)

export const pdt_roundToWeek = bindArgs(
  roundToPlainUnit,
  Unit.Week,
  computeWeekInterval,
  createPlainDateTimeSlots,
)

export const zdt_roundToYear = bindArgs(
  roundToZonedUnit,
  Unit.Year,
  computeYearInterval,
)

export const zdt_roundToMonth = bindArgs(
  roundToZonedUnit,
  Unit.Month,
  computeMonthInterval,
)

export const zdt_roundToWeek = bindArgs(
  roundToZonedUnit,
  Unit.Week,
  computeWeekInterval,
)
