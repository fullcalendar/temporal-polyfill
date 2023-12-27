import { isoCalendarId } from '../internal/calendarConfig'
import { YearMonthBag, YearMonthFieldsIntl } from '../internal/calendarFields'
import { ensureString, toInteger } from '../internal/cast'
import { diffPlainYearMonth } from '../internal/diff'
import { DurationFields, durationFieldDefaults } from '../internal/durationFields'
import { negateDuration, queryDurationSign } from '../internal/durationMath'
import { constrainIsoDateLike } from '../internal/calendarIsoFields'
import { formatIsoYearMonthFields, formatPossibleDate } from '../internal/formatIso'
import { checkIsoYearMonthInBounds, compareIsoDateFields } from '../internal/epochAndTime'
import { parsePlainYearMonth } from '../internal/parseIso'
import { NumSign } from '../internal/utils'
import { DateTimeDisplayOptions, DiffOptions, OverflowOptions, prepareOptions, refineDateDisplayOptions } from './optionsRefine'
import { DurationSlots, IdLike, PlainDateBranding, PlainDateSlots, PlainYearMonthBranding, PlainYearMonthSlots, isIdLikeEqual } from '../internal/slots'
import { DateModOps, YearMonthDiffOps, YearMonthModOps, YearMonthMoveOps, YearMonthRefineOps } from '../internal/calendarOps'
import { NativeYearMonthParseOps } from '../internal/calendarNative'
import { moveByIsoDays, moveToMonthStart } from '../internal/move'
import { convertPlainYearMonthToDate, mergePlainYearMonthBag, refinePlainYearMonthBag } from '../internal/bag'
import { plainYearMonthsEqual } from '../internal/compare'

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

export function fromString(
  getCalendarOps: (calendarId: string) => NativeYearMonthParseOps,
  s: string,
): PlainYearMonthSlots<string> {
  return {
    ...parsePlainYearMonth(getCalendarOps, ensureString(s)),
    branding: PlainYearMonthBranding,
  }
}

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

export function add<C>(
  getCalendarOps: (calendar: C) => YearMonthMoveOps,
  plainYearMonthSlots: PlainYearMonthSlots<C>,
  durationFields: DurationFields,
  options: OverflowOptions = Object.create(null), // b/c CalendarProtocol likes empty object,
): PlainYearMonthSlots<C> {
  const calendarSlot = plainYearMonthSlots.calendar
  const calendarOps = getCalendarOps(calendarSlot)
  let isoDateFields = moveToMonthStart(calendarOps, plainYearMonthSlots)

  // if moving backwards in time, set to last day of month
  if (queryDurationSign(durationFields) < 0) {
    isoDateFields = calendarOps.dateAdd(isoDateFields, { ...durationFieldDefaults, months: 1 })
    isoDateFields = moveByIsoDays(isoDateFields, -1)
  }

  const movedIsoDateFields = calendarOps.dateAdd(
    isoDateFields,
    durationFields,
    options,
  )

  return {
    ...moveToMonthStart(calendarOps, movedIsoDateFields),
    calendar: calendarSlot,
    branding: PlainYearMonthBranding,
  }
}

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

export function toString(
  plainYearMonthSlots: PlainYearMonthSlots<IdLike>,
  options?: DateTimeDisplayOptions,
): string {
  return formatPossibleDate(
    plainYearMonthSlots.calendar,
    formatIsoYearMonthFields,
    plainYearMonthSlots,
    refineDateDisplayOptions(options),
  )
}

/*
TODO: remove this and have callers omit options param from toString?
*/
export function toJSON(
  plainYearMonthSlots: PlainYearMonthSlots<IdLike>,
): string {
  return toString(plainYearMonthSlots)
}

export function toPlainDate<C>(
  getCalendarOps: (calendar: C) => DateModOps<C>,
  plainYearMonthSlots: PlainYearMonthSlots<C>,
  plainYearMonthFields: YearMonthFieldsIntl,
  bag: { day: number },
): PlainDateSlots<C> {
  const calendarSlot = plainYearMonthSlots.calendar
  const calendarOps = getCalendarOps(calendarSlot)

  return {
    ...convertPlainYearMonthToDate(calendarOps, plainYearMonthFields, bag),
    branding: PlainDateBranding,
  }
}
