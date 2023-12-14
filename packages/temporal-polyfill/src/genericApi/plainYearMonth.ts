import { isoCalendarId } from '../internal/calendarConfig'
import { YearMonthBag, YearMonthFieldsIntl } from '../internal/calendarFields'
import { ensureString, toInteger } from '../internal/cast'
import { diffDates } from '../internal/diff'
import { negateDurationFields, updateDurationFieldsSign } from '../internal/durationFields'
import { IdLike, isIdLikeEqual } from '../internal/idLike'
import { getCommonCalendarSlot } from './calendarSlot'
import { IsoDateFields, constrainIsoDateLike } from '../internal/isoFields'
import { formatIsoYearMonthFields, formatPossibleDate } from '../internal/isoFormat'
import { checkIsoYearMonthInBounds, compareIsoDateFields, moveByIsoDays } from '../internal/isoMath'
import { parsePlainYearMonth } from '../internal/isoParse'
import { Unit } from '../internal/units'
import { NumSign } from '../internal/utils'
import { DateTimeDisplayOptions, DiffOptions, OverflowOptions, refineDateDisplayOptions, refineDiffOptions, refineOverflowOptions } from './options'
import { convertPlainYearMonthToDate, mergePlainYearMonthBag, refinePlainYearMonthBag } from './convert'
import { DurationBranding, PlainDateBranding, PlainYearMonthBranding } from './branding'
import { DurationSlots, PlainDateSlots, PlainYearMonthSlots } from './genericTypes'
import { DateModOps, DiffOps, MoveOps, YearMonthModOps, YearMonthRefineOps } from '../internal/calendarOps'

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

export function fromString(s: string): PlainYearMonthSlots<string> {
  return {
    ...parsePlainYearMonth(ensureString(s)),
    branding: PlainYearMonthBranding,
  }
}

export function fromFields<C>(
  getCalendarOps: (calendar: C) => YearMonthRefineOps,
  calendarSlot: C,
  bag: YearMonthBag,
  options?: OverflowOptions,
): PlainYearMonthSlots<C> {
  return {
    ...refinePlainYearMonthBag(getCalendarOps(calendarSlot), bag, options),
    calendar: calendarSlot,
    branding: PlainYearMonthBranding,
  }
}

export function withFields<C>(
  getCalendarOps: (calendar: C) => YearMonthModOps,
  plainYearMonthSlots: PlainYearMonthSlots<C>,
  initialFields: YearMonthFieldsIntl,
  mod: YearMonthBag,
  options?: OverflowOptions,
): PlainYearMonthSlots<C> {
  const calendarSlot = plainYearMonthSlots.calendar
  const calendarOps = getCalendarOps(calendarSlot)

  return {
    ...mergePlainYearMonthBag(calendarOps, initialFields, mod, options),
    calendar: calendarSlot,
    branding: PlainYearMonthBranding,
  }
}

export function add<C>(
  getCalendarOps: (calendar: C) => MoveOps,
  plainYearMonthSlots: PlainYearMonthSlots<C>,
  durationSlots: DurationSlots,
  options?: OverflowOptions,
): PlainYearMonthSlots<C> {
  const calendarSlot = plainYearMonthSlots.calendar
  const calendarOps = getCalendarOps(calendarSlot)

  const isoDateFields = movePlainYearMonthToDay(
    calendarOps,
    plainYearMonthSlots,
    durationSlots.sign < 0
      ? calendarOps.daysInMonth(plainYearMonthSlots)
      : 1,
  )

  const movedIsoDateFields = calendarOps.dateAdd(
    isoDateFields,
    durationSlots,
    refineOverflowOptions(options),
  )

  return {
    ...movePlainYearMonthToDay(calendarOps, movedIsoDateFields),
    calendar: calendarSlot,
    branding: PlainYearMonthBranding,
  }
}

export function subtract<C>(
  getCalendarOps: (calendar: C) => MoveOps,
  plainYearMonthSlots: PlainYearMonthSlots<C>,
  durationSlots: DurationSlots,
  options?: OverflowOptions,
): PlainYearMonthSlots<C> {
  return add(getCalendarOps, plainYearMonthSlots, negateDurationFields(durationSlots) as any, options) // !!!
}

export function until<C extends IdLike>(
  getCalendarOps: (calendar: C) => DiffOps,
  plainYearMonthSlots0: PlainYearMonthSlots<C>,
  plainYearMonthSlots1: PlainYearMonthSlots<C>,
  options?: DiffOptions,
  invertRoundingMode?: boolean,
): DurationSlots {
  const calendarSlot = getCommonCalendarSlot(plainYearMonthSlots0.calendar, plainYearMonthSlots1.calendar)
  const calendarOps = getCalendarOps(calendarSlot)

  return {
    ...updateDurationFieldsSign(
      diffDates(
        calendarOps,
        movePlainYearMonthToDay(calendarOps, plainYearMonthSlots0),
        movePlainYearMonthToDay(calendarOps, plainYearMonthSlots1),
        ...refineDiffOptions(invertRoundingMode, options, Unit.Year, Unit.Year, Unit.Month),
      ),
    ),
    branding: DurationBranding,
  }
}

export function since<C extends IdLike>(
  getCalendarOps: (calendar: C) => DiffOps,
  plainYearMonthSlots0: PlainYearMonthSlots<C>,
  plainYearMonthSlots1: PlainYearMonthSlots<C>,
  options?: DiffOptions,
): DurationSlots {
  return negateDurationFields(until(getCalendarOps, plainYearMonthSlots1, plainYearMonthSlots0, options, true)) as any // !!!
}

export function compare(
  plainYearMonthSlots0: PlainYearMonthSlots<unknown>,
  plainYearMonthSlots1: PlainYearMonthSlots<unknown>,
): NumSign {
  return compareIsoDateFields(plainYearMonthSlots0, plainYearMonthSlots1) // just forwards
}

export function equals(
  plainYearMonthSlots0: PlainYearMonthSlots<IdLike>,
  plainYearMonthSlots1: PlainYearMonthSlots<IdLike>,
): boolean {
  return !compare(plainYearMonthSlots0, plainYearMonthSlots1) &&
    isIdLikeEqual(plainYearMonthSlots0.calendar, plainYearMonthSlots1.calendar)
}

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
  getCalendarOps: (calendar: C) => DateModOps,
  plainYearMonthSlots: PlainYearMonthSlots<C>,
  plainYearMonthFields: YearMonthFieldsIntl,
  bag: { day: number },
): PlainDateSlots<C> {
  const calendarSlot = plainYearMonthSlots.calendar
  const calendarOps = getCalendarOps(calendarSlot)

  return {
    ...convertPlainYearMonthToDate(calendarOps, plainYearMonthFields, bag),
    calendar: calendarSlot,
    branding: PlainDateBranding,
  }
}

// Utils
// -----

function movePlainYearMonthToDay(
  calendarOps: MoveOps,
  isoFields: IsoDateFields,
  day = 1,
): IsoDateFields {
  return moveByIsoDays(
    isoFields,
    day - calendarOps.day(isoFields),
  )
}
