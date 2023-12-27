import { isoCalendarId } from '../internal/calendarConfig'
import { DateBag, DateFields, EraYearFields } from '../internal/calendarFields'
import { ensureString } from '../internal/cast'
import { diffPlainDates } from '../internal/diff'
import { IsoDateFields, IsoTimeFields, isoTimeFieldDefaults, refineIsoDateArgs } from '../internal/calendarIsoFields'
import { formatPlainDateIso } from '../internal/formatIso'
import { checkIsoDateTimeInBounds, compareIsoDateFields } from '../internal/epochAndTime'
import { parsePlainDate } from '../internal/parseIso'
import { movePlainDate } from '../internal/move'
import { TimeZoneOps, getSingleInstantFor } from '../internal/timeZoneOps'
import { DiffOptions, OverflowOptions, prepareOptions } from '../internal/optionsRefine'
import { PlainDateSlots, ZonedDateTimeSlots, PlainDateTimeSlots, PlainYearMonthSlots, PlainMonthDaySlots, DurationSlots, PlainDateBranding, IdLike, isIdLikeEqual, ZonedDateTimeBranding, PlainDateTimeBranding, PlainYearMonthBranding, PlainMonthDayBranding } from '../internal/slots'
import { DateModOps, DateRefineOps, DiffOps, MonthDayRefineOps, MoveOps, YearMonthRefineOps } from '../internal/calendarOps'
import { DurationFields } from '../internal/durationFields'
import { negateDuration } from '../internal/durationMath'
import { convertToPlainMonthDay, convertToPlainYearMonth, mergePlainDateBag, refinePlainDateBag } from '../internal/bag'
import { plainDatesEqual } from '../internal/compare'

export function create<CA, C>(
  refineCalendarArg: (calendarArg: CA) => C,
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  calendarArg: CA = isoCalendarId as any,
): IsoDateFields & { calendar: C, branding: typeof PlainDateBranding } {
  return {
    ...refineIsoDateArgs(isoYear, isoMonth, isoDay),
    calendar: refineCalendarArg(calendarArg),
    branding: PlainDateBranding,
  }
}

export function fromString(s: string): PlainDateSlots<string> {
  return {
    ...parsePlainDate(ensureString(s)),
    branding: PlainDateBranding,
  }
}

export function fromFields<CA, C>(
  getCalendarOps: (calendarSlot: C) => DateRefineOps<C>,
  calendarSlot: C,
  fields: DateBag & { calendar?: CA },
  options?: OverflowOptions,
): PlainDateSlots<C> {
  const calendarOps = getCalendarOps(calendarSlot)

  return {
    ...refinePlainDateBag(calendarOps, fields, options),
    branding: PlainDateBranding,
  }
}

export function withFields<C>(
  getCalendarOps: (calendarSlot: C) => DateModOps<C>,
  plainDateSlots: PlainDateSlots<C>,
  initialFields: DateFields & Partial<EraYearFields>,
  modFields: DateBag,
  options?: OverflowOptions,
): PlainDateSlots<C> {
  const optionsCopy = prepareOptions(options)
  const calendarSlot = plainDateSlots.calendar
  const calendarOps = getCalendarOps(calendarSlot)

  return {
    ...mergePlainDateBag(calendarOps, initialFields, modFields, optionsCopy),
    branding: PlainDateBranding,
  }
}

// TODO: reusable function across types
export function withCalendar<C>(
  plainDateSlots: PlainDateSlots<C>,
  calendarSlot: C,
): PlainDateSlots<C> {
  return { ...plainDateSlots, calendar: calendarSlot }
}

export const add = movePlainDate

export function subtract<C>(
  getCalendarOps: (calendarSlot: C) => MoveOps,
  plainDateSlots: PlainDateSlots<C>,
  durationSlots: DurationFields,
  options?: OverflowOptions,
): PlainDateSlots<C> {
  return add(getCalendarOps, plainDateSlots, negateDuration(durationSlots), options)
}

export function until<C extends IdLike>(
  getCalendarOps: (calendarSlot: C) => DiffOps,
  plainDateSlots0: PlainDateSlots<C>,
  plainDateSlots1: PlainDateSlots<C>,
  options?: DiffOptions,
): DurationSlots {
  return diffPlainDates(getCalendarOps, plainDateSlots0, plainDateSlots1, options)
}

export function since<C extends IdLike>(
  getCalendarOps: (calendarSlot: C) => DiffOps,
  plainDateSlots0: PlainDateSlots<C>,
  plainDateSlots1: PlainDateSlots<C>,
  options?: DiffOptions,
): DurationSlots {
  return diffPlainDates(getCalendarOps, plainDateSlots0, plainDateSlots1, options, true)
}

export const compare = compareIsoDateFields

export const equals = plainDatesEqual

export const toString = formatPlainDateIso

export function toJSON<C extends IdLike>(
  plainDateSlots: PlainDateSlots<C>,
): string {
  return toString(plainDateSlots)
}

export function toZonedDateTime<C, TA, T, PA>(
  refineTimeZoneArg: (timeZoneArg: TA) => T,
  refinePlainTimeArg: (plainTimeArg: PA) => IsoTimeFields,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  plainDateSlots: PlainDateSlots<C>,
  options: { timeZone: TA, plainTime?: PA },
): ZonedDateTimeSlots<C, T> {
  const timeZoneSlot = refineTimeZoneArg(options.timeZone)
  const plainTimeArg = options.plainTime
  const isoTimeFields = plainTimeArg !== undefined
    ? refinePlainTimeArg(plainTimeArg)
    : isoTimeFieldDefaults

  const timeZoneOps = getTimeZoneOps(timeZoneSlot)

  return {
    calendar: plainDateSlots.calendar,
    timeZone: timeZoneSlot,
    epochNanoseconds: getSingleInstantFor(timeZoneOps, { ...plainDateSlots, ...isoTimeFields }),
    branding: ZonedDateTimeBranding,
  }
}

export function toPlainDateTime<C>(
  plainDateSlots: PlainDateSlots<C>,
  plainTimeFields: IsoTimeFields = isoTimeFieldDefaults,
): PlainDateTimeSlots<C> {
  return {
    ...checkIsoDateTimeInBounds({
      ...plainDateSlots,
      ...plainTimeFields,
    }),
    branding: PlainDateTimeBranding,
  }
}

export function toPlainYearMonth<C>(
  getCalendarOps: (calendarSlot: C) => YearMonthRefineOps<C>,
  plainDateSlots: { calendar: C },
  plainDateFields: DateBag, // TODO: DateBag correct type?
): PlainYearMonthSlots<C> {
  const calendarSlot = plainDateSlots.calendar
  const calendarOps = getCalendarOps(calendarSlot)

  return {
    ...convertToPlainYearMonth(calendarOps, plainDateFields),
    branding: PlainYearMonthBranding,
  }
}

export function toPlainMonthDay<C>(
  getCalendarOps: (calendarSlot: C) => MonthDayRefineOps<C>,
  plainDateSlots: { calendar: C },
  plainDateFields: DateBag, // TODO: DateBag correct type?
): PlainMonthDaySlots<C> {
  const calendarSlot = plainDateSlots.calendar
  const calendarOps = getCalendarOps(calendarSlot)

  return {
    ...convertToPlainMonthDay(calendarOps, plainDateFields),
    branding: PlainMonthDayBranding,
  }
}
