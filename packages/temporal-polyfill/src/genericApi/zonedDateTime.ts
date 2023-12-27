import { isoCalendarId } from '../internal/calendarConfig'
import { DateBag, DateTimeBag, DateTimeFields, EraYearFields } from '../internal/calendarFields'
import { ensureString, toBigInt } from '../internal/cast'
import { bigIntToDayTimeNano } from '../internal/dayTimeNano'
import { IsoDateTimeFields, isoDateFieldNamesDesc, isoDateTimeFieldNamesAlpha, isoDateTimeFieldNamesDesc, isoTimeFieldNamesDesc } from '../internal/calendarIsoFields'
import { formatOffsetNano, formatZonedDateTimeIso } from '../internal/formatIso'
import { checkEpochNanoInBounds } from '../internal/epochAndTime'
import { parseZonedDateTime } from '../internal/parseIso'
import { moveZonedDateTime } from '../internal/move'
import { OffsetDisambig } from '../internal/options'
import { roundZonedDateTime } from '../internal/round'
import { SimpleTimeZoneOps, TimeZoneOps, computeHoursInDay, computeStartOfDay, getMatchingInstantFor, zonedInternalsToIso } from '../internal/timeZoneOps'
import { pluckProps } from '../internal/utils'
import { DiffOptions, OverflowOptions, ZonedFieldOptions, prepareOptions } from '../internal/optionsRefine'
import { IdLike, InstantBranding, InstantSlots, PlainDateBranding, PlainDateSlots, PlainDateTimeBranding, PlainDateTimeSlots, PlainMonthDayBranding, PlainMonthDaySlots, PlainTimeBranding, PlainTimeSlots, PlainYearMonthBranding, PlainYearMonthSlots, ZonedDateTimeBranding, ZonedDateTimeSlots, getPreferredCalendarSlot, isIdLikeEqual, isTimeZoneSlotsEqual } from '../internal/slots'
import { DateModOps, DateRefineOps, DiffOps, MonthDayRefineOps, MoveOps, YearMonthRefineOps } from '../internal/calendarOps'
import { DurationFields } from '../internal/durationFields'
import { negateDuration } from '../internal/durationMath'
import { diffZonedDateTimes } from '../internal/diff'
import { ZonedDateTimeBag, convertToPlainMonthDay, convertToPlainYearMonth, mergeZonedDateTimeBag, refineZonedDateTimeBag } from '../internal/bag'
import { compareZonedDateTimes, zonedDateTimesEqual } from '../internal/compare'

export function create<CA, C, TA, T>(
  refineCalendarArg: (calendarArg: CA) => C,
  refineTimeZoneArg: (timeZoneArg: TA) => T,
  epochNano: bigint,
  timeZoneArg: TA,
  calendarArg: CA = isoCalendarId as any,
): ZonedDateTimeSlots<C, T> {
  return {
    epochNanoseconds: checkEpochNanoInBounds(bigIntToDayTimeNano(toBigInt(epochNano))),
    timeZone: refineTimeZoneArg(timeZoneArg), // TODO: validate string/object somehow?
    calendar: refineCalendarArg(calendarArg),
    branding: ZonedDateTimeBranding,
  }
}

export function fromString(s: string, options?: ZonedFieldOptions): ZonedDateTimeSlots<string, string> {
  return {
    ...parseZonedDateTime(ensureString(s), options),
    branding: ZonedDateTimeBranding,
  }
}

export function fromFields<C, TA, T>(
  getCalendarOps: (calendarSlot: C) => DateRefineOps<C>,
  refineTimeZoneArg: (timeZoneArg: TA) => T,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  calendarSlot: C,
  fields: ZonedDateTimeBag<unknown, TA>,
  options?: ZonedFieldOptions,
): ZonedDateTimeSlots<C, T> {
  return {
    ...refineZonedDateTimeBag(
      calendarSlot,
      getCalendarOps(calendarSlot),
      refineTimeZoneArg,
      getTimeZoneOps,
      fields,
      options,
    ),
    branding: ZonedDateTimeBranding,
  }
}

export function getISOFields<C, T>(
  getTimeZoneOps: (timeZoneSlot: T) => SimpleTimeZoneOps,
  zonedDateTimeSlots: ZonedDateTimeSlots<C, T>,
): IsoDateTimeFields & { calendar: C, timeZone: T, offset: string } {
  const isoFields = zonedInternalsToIso(zonedDateTimeSlots as any, getTimeZoneOps(zonedDateTimeSlots.timeZone))

  return { // alphabetical
    calendar: zonedDateTimeSlots.calendar,
    ...pluckProps(isoDateTimeFieldNamesAlpha, isoFields),
    offset: formatOffsetNano(isoFields.offsetNanoseconds), // TODO: more DRY
    timeZone: zonedDateTimeSlots.timeZone,
  }
}

export function withFields<C, T>(
  getCalendarOps: (calendarSlot: C) => DateModOps<C>,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  zonedDateTimeSlots: ZonedDateTimeSlots<C, T>,
  initialFields: DateTimeFields & Partial<EraYearFields>, // TODO: allow offset
  modFields: DateTimeBag,
  options?: ZonedFieldOptions,
): ZonedDateTimeSlots<C, T> {
  const optionsCopy = prepareOptions(options)
  const { calendar, timeZone } = zonedDateTimeSlots

  return {
    calendar,
    timeZone,
    epochNanoseconds: mergeZonedDateTimeBag(
      getCalendarOps(calendar),
      getTimeZoneOps(timeZone),
      initialFields,
      modFields,
      optionsCopy,
    ),
    branding: ZonedDateTimeBranding,
  }
}

export function withPlainTime<C, T>(
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  zonedDateTimeSlots: ZonedDateTimeSlots<C, T>,
  plainTimeSlots: PlainTimeSlots,
): ZonedDateTimeSlots<C, T> {
  const timeZoneSlot = zonedDateTimeSlots.timeZone
  const timeZoneOps = getTimeZoneOps(timeZoneSlot)

  const isoFields = {
    ...zonedInternalsToIso(zonedDateTimeSlots as any, timeZoneOps),
    ...plainTimeSlots,
  }

  const epochNano = getMatchingInstantFor(
    timeZoneOps,
    isoFields,
    isoFields.offsetNanoseconds,
    false, // hasZ
    OffsetDisambig.Prefer, // OffsetDisambig
    undefined, // EpochDisambig
    false, // fuzzy
  )

  return {
    branding: ZonedDateTimeBranding,
    epochNanoseconds: epochNano,
    timeZone: timeZoneSlot,
    calendar: zonedDateTimeSlots.calendar,
  }
}

export function withPlainDate<C extends IdLike, T>(
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  zonedDateTimeSlots: ZonedDateTimeSlots<C, T>,
  plainDateSlots: PlainDateSlots<C>,
): ZonedDateTimeSlots<C, T> {
  const timeZoneSlot = zonedDateTimeSlots.timeZone
  const timeZoneOps = getTimeZoneOps(timeZoneSlot)

  const isoFields = {
    ...zonedInternalsToIso(zonedDateTimeSlots as any, timeZoneOps),
    ...plainDateSlots,
  }
  const calendar = getPreferredCalendarSlot(zonedDateTimeSlots.calendar, plainDateSlots.calendar)

  const epochNano = getMatchingInstantFor(
    timeZoneOps,
    isoFields,
    isoFields.offsetNanoseconds,
    false, // hasZ
    OffsetDisambig.Prefer, // OffsetDisambig
    undefined, // EpochDisambig
    false, // fuzzy
  )

  return {
    branding: ZonedDateTimeBranding,
    epochNanoseconds: epochNano,
    timeZone: timeZoneSlot,
    calendar,
  }
}

export function withTimeZone<C, T>(
  zonedDateTimeSlots: ZonedDateTimeSlots<C, T>,
  timeZoneSlot: T,
): ZonedDateTimeSlots<C, T> {
  return { ...zonedDateTimeSlots, timeZone: timeZoneSlot }
}

// TODO: reusable function across types
export function withCalendar<C, T>(
  zonedDateTimeSlots: ZonedDateTimeSlots<C, T>,
  calendarSlot: C,
): ZonedDateTimeSlots<C, T> {
  return { ...zonedDateTimeSlots, calendar: calendarSlot }
}

export const add = moveZonedDateTime

export function subtract<C, T>(
  getCalendarOps: (calendarSlot: C) => MoveOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  zonedDateTimeSlots: ZonedDateTimeSlots<C, T>,
  durationSlots: DurationFields,
  options?: OverflowOptions,
): ZonedDateTimeSlots<C, T> {
  return add(getCalendarOps, getTimeZoneOps, zonedDateTimeSlots, negateDuration(durationSlots), options)
}

export function until<C extends IdLike, T extends IdLike>(
  getCalendarOps: (calendarSlot: C) => DiffOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, T>,
  zonedDateTimeSlots1: ZonedDateTimeSlots<C, T>,
  options?: DiffOptions,
): DurationFields {
  return diffZonedDateTimes(getCalendarOps, getTimeZoneOps, zonedDateTimeSlots0, zonedDateTimeSlots1, options)
}

export function since<C extends IdLike, T extends IdLike>(
  getCalendarOps: (calendarSlot: C) => DiffOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, T>,
  zonedDateTimeSlots1: ZonedDateTimeSlots<C, T>,
  options?: DiffOptions,
): DurationFields {
  return diffZonedDateTimes(getCalendarOps, getTimeZoneOps, zonedDateTimeSlots0, zonedDateTimeSlots1, options, true)
}

export const round = roundZonedDateTime

export const startOfDay = computeStartOfDay

export const hoursInDay = computeHoursInDay

export const compare = compareZonedDateTimes

export const equals = zonedDateTimesEqual

export const toString = formatZonedDateTimeIso

export function toJSON<C extends IdLike, T extends IdLike>(
  getTimeZoneOps: (timeZoneSlot: T) => SimpleTimeZoneOps,
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, T>,
): string {
  return toString(getTimeZoneOps, zonedDateTimeSlots0)
}

export function toInstant(
  zonedDateTimeSlots0: ZonedDateTimeSlots<unknown, unknown>
): InstantSlots {
  return {
    epochNanoseconds: zonedDateTimeSlots0.epochNanoseconds,
    branding: InstantBranding,
  }
}

export function toPlainDate<C, T>(
  getTimeZoneOps: (timeZoneSlot: T) => SimpleTimeZoneOps,
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, T>,
): PlainDateSlots<C> {
  return {
    ...pluckProps(
      isoDateFieldNamesDesc,
      zonedInternalsToIso(zonedDateTimeSlots0 as any, getTimeZoneOps(zonedDateTimeSlots0.timeZone)),
    ),
    calendar: zonedDateTimeSlots0.calendar,
    branding: PlainDateBranding,
  }
}

export function toPlainTime<C, T>(
  getTimeZoneOps: (timeZoneSlot: T) => SimpleTimeZoneOps,
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, T>,
): PlainTimeSlots {
  return {
    ...pluckProps(
      isoTimeFieldNamesDesc,
      zonedInternalsToIso(zonedDateTimeSlots0 as any, getTimeZoneOps(zonedDateTimeSlots0.timeZone)),
    ),
    branding: PlainTimeBranding,
  }
}

export function toPlainDateTime<C, T>(
  getTimeZoneOps: (timeZoneSlot: T) => SimpleTimeZoneOps,
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, T>,
): PlainDateTimeSlots<C> {
  return {
    ...pluckProps(
      isoDateTimeFieldNamesDesc,
      zonedInternalsToIso(zonedDateTimeSlots0 as any, getTimeZoneOps(zonedDateTimeSlots0.timeZone)),
    ),
    calendar: zonedDateTimeSlots0.calendar,
    branding: PlainDateTimeBranding,
  }
}

export function toPlainYearMonth<C>(
  getCalendarOps: (calendarSlot: C) => YearMonthRefineOps<C>,
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, unknown>,
  zonedDateTimeFields: DateBag, // TODO: DateBag correct type?
): PlainYearMonthSlots<C> {
  const calendarSlot = zonedDateTimeSlots0.calendar
  const calendarOps = getCalendarOps(calendarSlot)

  return {
    ...convertToPlainYearMonth(calendarOps, zonedDateTimeFields),
    branding: PlainYearMonthBranding,
  }
}

export function toPlainMonthDay<C>(
  getCalendarOps: (calendarSlot: C) => MonthDayRefineOps<C>,
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, unknown>,
  zonedDateTimeFields: DateBag, // TODO: DateBag correct type?
): PlainMonthDaySlots<C> {
  const calendarSlot = zonedDateTimeSlots0.calendar
  const calendarOps = getCalendarOps(calendarSlot)

  return {
    ...convertToPlainMonthDay(calendarOps, zonedDateTimeFields),
    branding: PlainMonthDayBranding,
  }
}
