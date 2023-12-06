import { isoCalendarId } from '../internal/calendarConfig'
import { DateBag, DateFields, EraYearFields } from '../internal/calendarFields'
import { CalendarDateAddFunc, CalendarDateFromFieldsFunc, CalendarDateUntilFunc, CalendarFieldsFunc, CalendarMergeFieldsFunc, CalendarMonthDayFromFieldsFunc, CalendarYearMonthFromFieldsFunc } from '../internal/calendarRecord'
import { ensureObjectlike, ensureString } from '../internal/cast'
import { diffDates } from '../internal/diff'
import { DurationFieldsWithSign, negateDurationInternals, updateDurationFieldsSign } from '../internal/durationFields'
import { IdLike, isIdLikeEqual } from '../internal/idLike'
import { getCommonCalendarSlot } from './calendarSlot'
import { IsoDateFields, IsoTimeFields, isoTimeFieldDefaults, refineIsoDateArgs } from '../internal/isoFields'
import { formatPlainDateIso } from '../internal/isoFormat'
import { checkIsoDateTimeInBounds, compareIsoDateFields } from '../internal/isoMath'
import { parsePlainDate } from '../internal/isoParse'
import { moveDateEasy } from '../internal/move'
import { getSingleInstantFor } from '../internal/timeZoneMath'
import { TimeZoneGetOffsetNanosecondsForFunc, TimeZoneGetPossibleInstantsForFunc } from '../internal/timeZoneRecord'
import { Unit } from '../internal/units'
import { NumSign } from '../internal/utils'
import { DateTimeDisplayOptions, DiffOptions, OverflowOptions, refineDateDisplayOptions, refineDiffOptions, refineOverflowOptions } from './options'
import { convertToPlainMonthDay, convertToPlainYearMonth, mergePlainDateBag, refinePlainDateBag } from './convert'
import { DurationBranding, PlainDateBranding, PlainDateTimeBranding, PlainMonthDayBranding, PlainYearMonthBranding, ZonedDateTimeBranding } from './branding'
import { PlainDateSlots, ZonedDateTimeSlots, PlainDateTimeSlots, PlainYearMonthSlots, PlainMonthDaySlots, DurationSlots } from './genericTypes'

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
  getCalendarRecord: (calendarSlot: C) => {
    dateFromFields: CalendarDateFromFieldsFunc,
    fields: CalendarFieldsFunc,
  },
  calendarSlot: C,
  fields: DateBag & { calendar?: CA },
  options?: OverflowOptions,
): PlainDateSlots<C> {
  const calendarRecord = getCalendarRecord(calendarSlot)

  return {
    ...refinePlainDateBag(calendarRecord, fields, options),
    calendar: calendarSlot,
    branding: PlainDateBranding,
  }
}

export function withFields<C>(
  getCalendarRecord: (calendarSlot: C) => {
    dateFromFields: CalendarDateFromFieldsFunc,
    fields: CalendarFieldsFunc,
    mergeFields: CalendarMergeFieldsFunc,
  },
  plainDateSlots: PlainDateSlots<C>,
  initialFields: DateFields & Partial<EraYearFields>,
  modFields: DateBag,
  options?: OverflowOptions,
): PlainDateSlots<C> {
  const calendarSlot = plainDateSlots.calendar
  const calendarRecord = getCalendarRecord(calendarSlot)

  return {
    ...mergePlainDateBag(calendarRecord, initialFields, modFields, options),
    calendar: calendarSlot,
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

export function add<C>(
  getCalendarRecord: (calendarSlot: C) => {
    dateAdd: CalendarDateAddFunc,
  },
  plainDateSlots: PlainDateSlots<C>,
  durationSlots: DurationFieldsWithSign,
  options?: OverflowOptions,
): PlainDateSlots<C> {
  return {
    ...plainDateSlots,
    ...moveDateEasy(
      getCalendarRecord(plainDateSlots.calendar),
      plainDateSlots,
      durationSlots,
      refineOverflowOptions(options),
    )
  }
}

export function subtract<C>(
  getCalendarRecord: (calendarSlot: C) => {
    dateAdd: CalendarDateAddFunc,
  },
  plainDateSlots: PlainDateSlots<C>,
  durationSlots: DurationFieldsWithSign,
  options?: OverflowOptions,
): PlainDateSlots<C> {
  return add(getCalendarRecord, plainDateSlots, negateDurationInternals(durationSlots), options)
}

export function until<C extends IdLike>(
  getCalendarRecord: (calendarSlot: C) => {
    dateAdd: CalendarDateAddFunc,
    dateUntil: CalendarDateUntilFunc,
  },
  plainDateSlots0: PlainDateSlots<C>,
  plainDateSlots1: PlainDateSlots<C>,
  options?: DiffOptions,
  invertRoundingMode?: boolean,
): DurationSlots {
  return {
    ...updateDurationFieldsSign(
      diffDates(
        getCalendarRecord(
          getCommonCalendarSlot(plainDateSlots0.calendar, plainDateSlots1.calendar)
        ),
        plainDateSlots0,
        plainDateSlots1,
        ...refineDiffOptions(
          invertRoundingMode,
          options === undefined ? options : { ...ensureObjectlike(options) }, // YUCK
          Unit.Day,
          Unit.Year,
          Unit.Day,
        ),
      )
    ),
    branding: DurationBranding,
  }
}

export function since<C extends IdLike>(
  getCalendarRecord: (calendarSlot: C) => {
    dateAdd: CalendarDateAddFunc,
    dateUntil: CalendarDateUntilFunc,
  },
  plainDateSlots0: PlainDateSlots<C>,
  plainDateSlots1: PlainDateSlots<C>,
  options?: DiffOptions,
): DurationSlots {
  return {
    branding: DurationBranding,
    ...negateDurationInternals(
      until(getCalendarRecord, plainDateSlots0, plainDateSlots1, options, true)
    )
  }
}

export function compare(
  plainDateSlots0: IsoDateFields,
  plainDateSlots1: IsoDateFields,
): NumSign {
  return compareIsoDateFields(plainDateSlots0, plainDateSlots1) // just forwards
}

export function equals<C extends IdLike>(
  plainDateSlots0: PlainDateSlots<C>,
  plainDateSlots1: PlainDateSlots<C>,
): boolean {
  return !compareIsoDateFields(plainDateSlots0, plainDateSlots1) &&
    isIdLikeEqual(plainDateSlots0.calendar, plainDateSlots1.calendar)
}

export function toString<C extends IdLike>(
  plainDateSlots: PlainDateSlots<C>,
  options?: DateTimeDisplayOptions,
): string {
  return formatPlainDateIso(plainDateSlots.calendar, plainDateSlots, refineDateDisplayOptions(options))
}

export function toJSON<C extends IdLike>(
  plainDateSlots: PlainDateSlots<C>,
): string {
  return toString(plainDateSlots)
}

export function toZonedDateTime<C, TZ>(
  getTimeZoneRecord: (timeZoneSlot: TZ) => {
    getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc,
    getPossibleInstantsFor: TimeZoneGetPossibleInstantsForFunc,
  },
  plainDateSlots: PlainDateSlots<C>,
  timeZoneSlot: TZ,
  plainTimeFields: IsoTimeFields = isoTimeFieldDefaults,
): ZonedDateTimeSlots<C, TZ> {
  const timeZoneRecord = getTimeZoneRecord(timeZoneSlot)

  return {
    calendar: plainDateSlots.calendar,
    timeZone: timeZoneSlot,
    epochNanoseconds: getSingleInstantFor(timeZoneRecord, { ...plainDateSlots, ...plainTimeFields }),
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
  getCalendarRecord: (calendarSlot: C) => {
    yearMonthFromFields: CalendarYearMonthFromFieldsFunc,
    fields: CalendarFieldsFunc,
  },
  plainDateSlots: { calendar: C },
  plainDateFields: DateBag, // TODO: DateBag correct type?
): PlainYearMonthSlots<C> {
  const calendarSlot = plainDateSlots.calendar
  const calendarRecord = getCalendarRecord(calendarSlot)

  return {
    ...convertToPlainYearMonth(calendarRecord, plainDateFields),
    calendar: calendarSlot,
    branding: PlainYearMonthBranding,
  }
}

export function toPlainMonthDay<C>(
  getCalendarRecord: (calendarSlot: C) => {
    monthDayFromFields: CalendarMonthDayFromFieldsFunc,
    fields: CalendarFieldsFunc,
  },
  plainDateSlots: { calendar: C },
  plainDateFields: DateBag, // TODO: DateBag correct type?
): PlainMonthDaySlots<C> {
  const calendarSlot = plainDateSlots.calendar
  const calendarRecord = getCalendarRecord(calendarSlot)

  return {
    ...convertToPlainMonthDay(calendarRecord, plainDateFields),
    calendar: calendarSlot,
    branding: PlainMonthDayBranding,
  }
}
