/*
WIP. Ultimately for funcApi
*/
import { createNativeConvertOps } from './calendarNativeQuery'
import { IsoDateFields } from './isoFields'
import { moveByDays } from './move'
import { DateSlots } from './slots'
import { epochMilliToIso } from './timeMath'

export function moveByYears<S extends DateSlots<string>>(
  slots: S,
  years: number,
): S {
  const calendarOps = createNativeConvertOps(slots.calendar)
  const [year0] = calendarOps.dateParts(slots)
  const year1 = year0 + years
  return {
    ...slots,
    ...epochMilliToIso(calendarOps.epochMilli(year1)),
  }
}

export function moveByMonths<S extends DateSlots<string>>(
  slots: S,
  months: number,
): S {
  const calendarOps = createNativeConvertOps(slots.calendar)
  const [year0, month0] = calendarOps.dateParts(slots)
  const [year1, month1] = calendarOps.monthAdd(year0, month0, months)
  return {
    ...slots,
    ...epochMilliToIso(calendarOps.epochMilli(year1, month1)),
  }
}

export function moveByIsoWeeks<F extends IsoDateFields>(
  slots: F,
  weeks: number,
): F {
  return moveByDays(slots, weeks * 7)
}

// -----------------------------------------------------------------------------

export function reversedMove<S>(
  f: (slots: S, units: number) => S,
): (slots: S, units: number) => S {
  return (slots, units) => {
    return f(slots, -units)
  }
}
