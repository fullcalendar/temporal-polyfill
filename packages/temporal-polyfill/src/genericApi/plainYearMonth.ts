import { isoCalendarId } from '../internal/calendarConfig'
import { YearMonthBag, YearMonthFieldsIntl } from '../internal/calendarFields'
import { ensureString, toInteger } from '../internal/cast'
import { diffPlainYearMonth } from '../internal/diff'
import { DurationFields } from '../internal/durationFields'
import { negateDuration } from '../internal/durationMath'
import { constrainIsoDateLike } from '../internal/calendarIsoFields'
import { formatPlainYearMonthIso } from '../internal/formatIso'
import { checkIsoYearMonthInBounds, compareIsoDateFields } from '../internal/epochAndTime'
import { parsePlainYearMonth } from '../internal/parseIso'
import { DiffOptions, OverflowOptions, prepareOptions } from '../internal/optionsRefine'
import { DurationSlots, IdLike, PlainYearMonthBranding, PlainYearMonthSlots } from '../internal/slots'
import { YearMonthDiffOps, YearMonthModOps, YearMonthMoveOps, YearMonthRefineOps } from '../internal/calendarOps'
import { NativeYearMonthParseOps } from '../internal/calendarNative'
import { movePlainYearMonth } from '../internal/move'
import { mergePlainYearMonthBag, refinePlainYearMonthBag } from '../internal/bag'
import { plainYearMonthsEqual } from '../internal/compare'
import { plainYearMonthToPlainDate } from '../internal/convert'

export function create<CA, C>(
  refineCalendarArg: (calendarArg: CA) => C,
  isoYear: number,
  isoMonth: number,
  calendar: CA = isoCalendarId as any,
  referenceIsoDay: number = 1,
): PlainYearMonthSlots<C> {
  const isoYearInt = toInteger(isoYear)
  const isoMonthInt = toInteger(isoMonth)
  const calendarSlot = refineCalendarArg(calendar)
  const isoDayInt = toInteger(referenceIsoDay)

  return {
    ...checkIsoYearMonthInBounds(
      constrainIsoDateLike({
        isoYear: isoYearInt,
        isoMonth: isoMonthInt,
        isoDay: isoDayInt
      })
    ),
    calendar: calendarSlot,
    branding: PlainYearMonthBranding,
  }
}

export const fromString = parsePlainYearMonth

export function fromFields<C>(
  getCalendarOps: (calendar: C) => YearMonthRefineOps<C>,
  calendarSlot: C,
  bag: YearMonthBag,
  options?: OverflowOptions,
): PlainYearMonthSlots<C> {
  return {
    ...refinePlainYearMonthBag(getCalendarOps(calendarSlot), bag, options),
    branding: PlainYearMonthBranding,
  }
}

export function withFields<C>(
  getCalendarOps: (calendar: C) => YearMonthModOps<C>,
  plainYearMonthSlots: PlainYearMonthSlots<C>,
  initialFields: YearMonthFieldsIntl,
  mod: YearMonthBag,
  options?: OverflowOptions,
): PlainYearMonthSlots<C> {
  const optionsCopy = prepareOptions(options)
  const calendarSlot = plainYearMonthSlots.calendar
  const calendarOps = getCalendarOps(calendarSlot)

  return {
    ...mergePlainYearMonthBag(calendarOps, initialFields, mod, optionsCopy),
    branding: PlainYearMonthBranding,
  }
}

export const add = movePlainYearMonth

export function subtract<C>(
  getCalendarOps: (calendar: C) => YearMonthMoveOps,
  plainYearMonthSlots: PlainYearMonthSlots<C>,
  durationFields: DurationFields,
  options?: OverflowOptions,
): PlainYearMonthSlots<C> {
  return add(getCalendarOps, plainYearMonthSlots, negateDuration(durationFields), options)
}

export function until<C extends IdLike>(
  getCalendarOps: (calendar: C) => YearMonthDiffOps,
  plainYearMonthSlots0: PlainYearMonthSlots<C>,
  plainYearMonthSlots1: PlainYearMonthSlots<C>,
  options?: DiffOptions,
): DurationSlots {
  return diffPlainYearMonth(getCalendarOps, plainYearMonthSlots0, plainYearMonthSlots1, options)
}

export function since<C extends IdLike>(
  getCalendarOps: (calendar: C) => YearMonthDiffOps,
  plainYearMonthSlots0: PlainYearMonthSlots<C>,
  plainYearMonthSlots1: PlainYearMonthSlots<C>,
  options?: DiffOptions,
): DurationSlots {
  return diffPlainYearMonth(getCalendarOps, plainYearMonthSlots0, plainYearMonthSlots1, options, true)
}

export const compare = compareIsoDateFields

export const equals = plainYearMonthsEqual

export const toString = formatPlainYearMonthIso

/*
TODO: remove this and have callers omit options param from toString?
*/
export function toJSON(
  plainYearMonthSlots: PlainYearMonthSlots<IdLike>,
): string {
  return toString(plainYearMonthSlots)
}

export const toPlainDate = plainYearMonthToPlainDate
