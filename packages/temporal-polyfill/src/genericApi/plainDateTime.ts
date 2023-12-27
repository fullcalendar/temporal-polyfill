import { isoCalendarId } from '../internal/calendarConfig'
import { DateBag, DateTimeBag, DateTimeFields, EraYearFields } from '../internal/calendarFields'
import { ensureString } from '../internal/cast'
import { diffPlainDateTimes } from '../internal/diff'
import { IsoDateTimeFields, isoDateFieldNamesDesc, isoTimeFieldNamesDesc, refineIsoDateTimeArgs } from '../internal/calendarIsoFields'
import { formatPlainDateTimeIso } from '../internal/formatIso'
import { compareIsoDateTimeFields } from '../internal/epochAndTime'
import { parsePlainDateTime } from '../internal/parseIso'
import { moveDateTime } from '../internal/move'
import { RoundingMode } from '../internal/options'
import { roundDateTime } from '../internal/round'
import { TimeZoneOps } from '../internal/timeZoneOps'
import { DayTimeUnit, UnitName } from '../internal/units'
import { NumSign, pluckProps } from '../internal/utils'
import { DateTimeDisplayOptions, DiffOptions, EpochDisambigOptions, OverflowOptions, RoundingOptions, prepareOptions, refineDateTimeDisplayOptions, refineRoundOptions } from './optionsRefine'
import { DurationSlots, IdLike, PlainDateBranding, PlainDateSlots, PlainDateTimeBranding, PlainDateTimeSlots, PlainMonthDayBranding, PlainMonthDaySlots, PlainTimeBranding, PlainTimeSlots, PlainYearMonthBranding, PlainYearMonthSlots, ZonedDateTimeBranding, ZonedDateTimeSlots, getPreferredCalendarSlot, isIdLikeEqual } from '../internal/slots'
import { DateModOps, DateRefineOps, DiffOps, MonthDayRefineOps, MoveOps, YearMonthRefineOps } from '../internal/calendarOps'
import { DurationFields } from '../internal/durationFields'
import { negateDuration } from '../internal/durationMath'
import { convertPlainDateTimeToZoned, convertToPlainMonthDay, convertToPlainYearMonth, mergePlainDateTimeBag, refinePlainDateTimeBag } from '../internal/bag'
import { plainDateTimesEqual } from '../internal/compare'

export function create<CA, C>(
  refineCalendarArg: (calendarArg: CA) => C,
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  isoHour: number = 0, isoMinute: number = 0, isoSecond: number = 0,
  isoMillisecond: number = 0, isoMicrosecond: number = 0, isoNanosecond: number = 0,
  calendarArg: CA = isoCalendarId as any,
): IsoDateTimeFields & { calendar: C, branding: typeof PlainDateTimeBranding } {
  return {
    ...refineIsoDateTimeArgs(
      isoYear, isoMonth, isoDay,
      isoHour, isoMinute, isoSecond,
      isoMillisecond, isoMicrosecond, isoNanosecond,
    ),
    calendar: refineCalendarArg(calendarArg),
    branding: PlainDateTimeBranding,
  }
}

export function fromString(s: string): PlainDateTimeSlots<string> {
  return {
    ...parsePlainDateTime(ensureString(s)),
    branding: PlainDateTimeBranding,
  }
}

export function fromFields<C>(
  getCalendarOps: (calendarSlot: C) => DateRefineOps<C>,
  calendarSlot: C,
  fields: DateTimeBag,
  options?: OverflowOptions,
): PlainDateTimeSlots<C> {
  const calendarOps = getCalendarOps(calendarSlot)

  return {
    ...refinePlainDateTimeBag(calendarOps, fields, options),
    branding: PlainDateTimeBranding,
  }
}

export function withFields<C>(
  getCalendarOps: (calendarSlot: C) => DateModOps<C>,
  plainDateTimeSlots: PlainDateTimeSlots<C>,
  initialFields: DateTimeFields & Partial<EraYearFields>,
  modFields: DateTimeBag,
  options?: OverflowOptions,
): PlainDateTimeSlots<C> {
  const optionsCopy = prepareOptions(options)
  const calendarSlot = plainDateTimeSlots.calendar
  const calendarOps = getCalendarOps(calendarSlot)

  return {
    ...mergePlainDateTimeBag(
      calendarOps,
      initialFields,
      modFields,
      optionsCopy,
    ),
    branding: PlainDateTimeBranding,
  }
}

export function withPlainTime<C>(
  plainDateTimeSlots: PlainDateTimeSlots<C>,
  plainTimeSlots: PlainTimeSlots,
): PlainDateTimeSlots<C> {
  return {
    ...plainDateTimeSlots,
    ...plainTimeSlots,
    branding: PlainDateTimeBranding,
  }
}

export function withPlainDate<C extends IdLike>(
  plainDateTimeSlots: PlainDateTimeSlots<C>,
  plainDateSlots: PlainDateSlots<C>,
) {
  return {
    ...plainDateTimeSlots,
    ...plainDateSlots,
    // TODO: more DRY with other datetime types
    calendar: getPreferredCalendarSlot(plainDateTimeSlots.calendar, plainDateSlots.calendar),
    branding: PlainDateTimeBranding,
  }
}

// TODO: reusable function across types
export function withCalendar<C>(
  plainDateTimeSlots: PlainDateTimeSlots<C>,
  calendarSlot: C,
): PlainDateTimeSlots<C> {
  return { ...plainDateTimeSlots, calendar: calendarSlot }
}

export function add<C>(
  getCalendarOps: (calendarSlot: C) => MoveOps,
  plainDateTimeSlots: PlainDateTimeSlots<C>,
  durationSlots: DurationFields,
  options: OverflowOptions = Object.create(null), // so internal Calendar knows options *could* have been passed in
): PlainDateTimeSlots<C> {
  return {
    ...plainDateTimeSlots,
    ...moveDateTime(
      getCalendarOps(plainDateTimeSlots.calendar),
      plainDateTimeSlots,
      durationSlots,
      options,
    ),
    branding: PlainDateTimeBranding, // YUCK. all because checkIsoDateTimeInBounds too liberal
  }
}

export function subtract<C>(
  getCalendarOps: (calendarSlot: C) => MoveOps,
  plainDateTimeSlots: PlainDateTimeSlots<C>,
  durationSlots: DurationFields,
  options?: OverflowOptions,
): PlainDateTimeSlots<C> {
  return add(getCalendarOps, plainDateTimeSlots, negateDuration(durationSlots), options)
}

export function until<C extends IdLike>(
  getCalendarOps: (calendarSlot: C) => DiffOps,
  plainDateTimeSlots0: PlainDateTimeSlots<C>,
  plainDateTimeSlots1: PlainDateTimeSlots<C>,
  options?: DiffOptions,
): DurationSlots {
  return diffPlainDateTimes(getCalendarOps, plainDateTimeSlots0, plainDateTimeSlots1, options)
}

export function since<C extends IdLike>(
  getCalendarOps: (calendarSlot: C) => DiffOps,
  plainDateTimeSlots0: PlainDateTimeSlots<C>,
  plainDateTimeSlots1: PlainDateTimeSlots<C>,
  options?: DiffOptions,
): DurationSlots {
  return diffPlainDateTimes(getCalendarOps, plainDateTimeSlots0, plainDateTimeSlots1, options, true)
}

export function round<C>(
  plainDateTimeSlots: PlainDateTimeSlots<C>,
  options: RoundingOptions | UnitName,
): PlainDateTimeSlots<C> {
  const roundedIsoFields = roundDateTime(
    plainDateTimeSlots,
    ...(refineRoundOptions(options) as [DayTimeUnit, number, RoundingMode]),
  )

  return {
    ...roundedIsoFields,
    calendar: plainDateTimeSlots.calendar,
    branding: PlainDateTimeBranding,
  }
}

export const compare = compareIsoDateTimeFields

export const equals = plainDateTimesEqual

export function toString<C extends IdLike>(
  plainDateTimeSlots0: PlainDateTimeSlots<C>,
  options?: DateTimeDisplayOptions,
): string {
  return formatPlainDateTimeIso(plainDateTimeSlots0.calendar, plainDateTimeSlots0, ...refineDateTimeDisplayOptions(options))
}

export function toJSON<C extends IdLike>(
  plainDateTimeSlots0: PlainDateTimeSlots<C>,
): string {
  return formatPlainDateTimeIso(plainDateTimeSlots0.calendar, plainDateTimeSlots0, ...refineDateTimeDisplayOptions(undefined))
}

export function toZonedDateTime<C, TZ>(
  getTimeZoneOps: (timeZoneSlot: TZ) => TimeZoneOps,
  plainDateTimeSlots: PlainDateTimeSlots<C>,
  timeZoneSlot: TZ,
  options?: EpochDisambigOptions,
): ZonedDateTimeSlots<C, TZ> {
  return {
    calendar: plainDateTimeSlots.calendar,
    timeZone: timeZoneSlot,
    epochNanoseconds: convertPlainDateTimeToZoned(getTimeZoneOps, timeZoneSlot, plainDateTimeSlots, options),
    branding: ZonedDateTimeBranding,
  }
}

export function toPlainDate<C>(
  plainDateTimeSlots: PlainDateTimeSlots<C>,
): PlainDateSlots<C> {
  return {
    ...pluckProps([...isoDateFieldNamesDesc, 'calendar'], plainDateTimeSlots),
    branding: PlainDateBranding,
  }
}

export function toPlainYearMonth<C>(
  getCalendarOps: (calendarSlot: C) => YearMonthRefineOps<C>,
  plainDateTimeSlots: PlainDateTimeSlots<C>,
  plainDateFields: DateBag, // TODO: DateBag correct type?
): PlainYearMonthSlots<C> {
  const calendarOps = getCalendarOps(plainDateTimeSlots.calendar)

  return {
    ...plainDateTimeSlots, // isoTimeFields and calendar
    ...convertToPlainYearMonth(calendarOps, plainDateFields),
    branding: PlainYearMonthBranding,
  }
}

export function toPlainMonthDay<C>(
  getCalendarOps: (calendarSlot: C) => MonthDayRefineOps<C>,
  plainDateTimeSlots: PlainDateTimeSlots<C>,
  plainDateFields: DateBag, // TODO: DateBag correct type?
): PlainMonthDaySlots<C> {
  const calendarOps = getCalendarOps(plainDateTimeSlots.calendar)

  return {
    ...plainDateTimeSlots, // isoTimeFields and calendar
    ...convertToPlainMonthDay(calendarOps, plainDateFields),
    branding: PlainMonthDayBranding,
  }
}

export function toPlainTime<C>(
  plainDateTimeSlots: PlainDateTimeSlots<C>,
): PlainTimeSlots {
  return {
    ...pluckProps(isoTimeFieldNamesDesc, plainDateTimeSlots),
    branding: PlainTimeBranding,
  }
}
