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
import { createPlainMonthDaySlots } from '../internal/slotsCreate'

export const create = createPlainMonthDaySlots

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
