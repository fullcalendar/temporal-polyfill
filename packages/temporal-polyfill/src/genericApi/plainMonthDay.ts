import { isoCalendarId } from '../internal/calendarConfig'
import { MonthDayBag, MonthDayFields } from '../internal/calendarFields'
import { ensureString, toInteger } from '../internal/cast'
import { constrainIsoDateLike } from '../internal/calendarIsoFields'
import { formatPlainMonthDayIso } from '../internal/formatIso'
import { isoEpochFirstLeapYear } from '../internal/calendarIso'
import { checkIsoDateInBounds } from '../internal/epochAndTime'
import { parsePlainMonthDay } from '../internal/parseIso'
import { OverflowOptions, prepareOptions } from '../internal/optionsRefine'
import { IdLike, PlainMonthDayBranding, PlainMonthDaySlots } from '../internal/slots'
import { MonthDayModOps, MonthDayRefineOps } from '../internal/calendarOps'
import { NativeMonthDayParseOps } from '../internal/calendarNative'
import { mergePlainMonthDayBag, plainMonthDayWithFields, refinePlainMonthDayBag } from '../internal/bag'
import { plainMonthDaysEqual } from '../internal/compare'
import { plainMonthDayToPlainDate } from '../internal/convert'

export function create<CA, C>(
  refineCalendarArg: (calendarArg: CA) => C,
  isoMonth: number,
  isoDay: number,
  calendar: CA = isoCalendarId as any,
  referenceIsoYear: number = isoEpochFirstLeapYear
): PlainMonthDaySlots<C> {
  const isoMonthInt = toInteger(isoMonth)
  const isoDayInt = toInteger(isoDay)
  const calendarSlot = refineCalendarArg(calendar)
  const isoYearInt = toInteger(referenceIsoYear)

  return {
    ...checkIsoDateInBounds(
      constrainIsoDateLike({
        isoYear: isoYearInt,
        isoMonth: isoMonthInt,
        isoDay: isoDayInt
      })
    ),
    calendar: calendarSlot,
    branding: PlainMonthDayBranding,
  }
}

export const fromString = parsePlainMonthDay

export const fromFields = refinePlainMonthDayBag

export const withFields = plainMonthDayWithFields

export const equals = plainMonthDaysEqual

export const toString = formatPlainMonthDayIso

export function toJSON(
  plainMonthDaySlots: PlainMonthDaySlots<IdLike>,
): string {
  return toString(plainMonthDaySlots)
}

export const toPlainDate = plainMonthDayToPlainDate
