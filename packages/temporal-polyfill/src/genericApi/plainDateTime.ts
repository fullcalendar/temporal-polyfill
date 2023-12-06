import { isoCalendarId } from '../internal/calendarConfig'
import { DateBag, DateTimeBag, DateTimeFields, EraYearFields } from '../internal/calendarFields'
import { CalendarDateAddFunc, CalendarDateFromFieldsFunc, CalendarDateUntilFunc, CalendarFieldsFunc, CalendarMergeFieldsFunc, CalendarMonthDayFromFieldsFunc, CalendarYearMonthFromFieldsFunc } from '../internal/calendarRecordTypes'
import { ensureString } from '../internal/cast'
import { diffDateTimes } from '../internal/diff'
import { DurationFieldsWithSign, negateDurationInternals, updateDurationFieldsSign } from '../internal/durationFields'
import { IdLike, getCommonCalendarSlot, getPreferredCalendarSlot, isIdLikeEqual } from '../internal/idLike'
import { IsoDateTimeFields, isoDateFieldNamesDesc, isoTimeFieldNamesDesc, refineIsoDateTimeArgs } from '../internal/isoFields'
import { formatPlainDateTimeIso } from '../internal/isoFormat'
import { compareIsoDateTimeFields } from '../internal/isoMath'
import { parsePlainDateTime } from '../internal/isoParse'
import { moveDateTime } from '../internal/move'
import { DateTimeDisplayOptions, DiffOptions, EpochDisambigOptions, OverflowOptions, RoundingOptions, refineDateTimeDisplayOptions, refineDiffOptions, refineOverflowOptions, refineRoundOptions } from '../internal/options'
import { RoundingMode } from '../internal/optionEnums'
import { roundDateTime } from '../internal/round'
import { TimeZoneGetOffsetNanosecondsForFunc, TimeZoneGetPossibleInstantsForFunc } from '../internal/timeZoneRecordTypes'
import { DayTimeUnit, Unit, UnitName } from '../internal/units'
import { NumSign, pluckProps } from '../internal/utils'
import { convertPlainDateTimeToZoned, convertToPlainMonthDay, convertToPlainYearMonth, mergePlainDateTimeBag, refinePlainDateTimeBag } from './convert'
import { DurationBranding, PlainDateBranding, PlainDateTimeBranding, PlainMonthDayBranding, PlainTimeBranding, PlainYearMonthBranding, ZonedDateTimeBranding } from './branding'
import { DurationSlots, PlainDateSlots, PlainDateTimeSlots, PlainMonthDaySlots, PlainTimeSlots, PlainYearMonthSlots, ZonedDateTimeSlots } from './genericTypes'

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
  getCalendarRecord: (calendarSlot: C) => {
    dateFromFields: CalendarDateFromFieldsFunc,
    fields: CalendarFieldsFunc,
  },
  calendarSlot: C,
  fields: DateTimeBag,
  options?: OverflowOptions,
): PlainDateTimeSlots<C> {
  const calendarRecord = getCalendarRecord(calendarSlot)

  return {
    ...refinePlainDateTimeBag(calendarRecord, fields, options),
    calendar: calendarSlot,
    branding: PlainDateTimeBranding,
  }
}

export function withFields<C>(
  getCalendarRecord: (calendarSlot: C) => {
    dateFromFields: CalendarDateFromFieldsFunc,
    fields: CalendarFieldsFunc,
    mergeFields: CalendarMergeFieldsFunc,
  },
  plainDateTimeSlots: PlainDateTimeSlots<C>,
  initialFields: DateTimeFields & Partial<EraYearFields>,
  modFields: DateTimeBag,
  options?: OverflowOptions,
): PlainDateTimeSlots<C> {
  const calendarSlot = plainDateTimeSlots.calendar
  const calendarRecord = getCalendarRecord(calendarSlot)

  return {
    ...mergePlainDateTimeBag(
      calendarRecord,
      initialFields,
      modFields,
      options,
    ),
    calendar: calendarSlot,
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
  getCalendarRecord: (calendarSlot: C) => {
    dateAdd: CalendarDateAddFunc,
  },
  plainDateTimeSlots: PlainDateTimeSlots<C>,
  durationSlots: DurationFieldsWithSign,
  options?: OverflowOptions,
): PlainDateTimeSlots<C> {
  return {
    ...plainDateTimeSlots,
    ...moveDateTime(
      getCalendarRecord(plainDateTimeSlots.calendar),
      plainDateTimeSlots,
      durationSlots,
      refineOverflowOptions(options),
    )
  }
}

export function subtract<C>(
  getCalendarRecord: (calendarSlot: C) => {
    dateAdd: CalendarDateAddFunc,
  },
  plainDateTimeSlots: PlainDateTimeSlots<C>,
  durationSlots: DurationFieldsWithSign,
  options?: OverflowOptions,
): PlainDateTimeSlots<C> {
  return add(getCalendarRecord, plainDateTimeSlots, negateDurationInternals(durationSlots), options)
}

export function until<C extends IdLike>(
  getCalendarRecord: (calendarSlot: C) => {
    dateAdd: CalendarDateAddFunc,
    dateUntil: CalendarDateUntilFunc,
  },
  plainDateTimeSlots0: PlainDateTimeSlots<C>,
  plainDateTimeSlots1: PlainDateTimeSlots<C>,
  options?: DiffOptions,
  invertRoundingMode?: boolean,
): DurationSlots {
  const calendarSlot = getCommonCalendarSlot(plainDateTimeSlots0.calendar, plainDateTimeSlots1.calendar)
  const calendarRecord = getCalendarRecord(calendarSlot)

  return {
    ...updateDurationFieldsSign(
      diffDateTimes(
        calendarRecord,
        plainDateTimeSlots0,
        plainDateTimeSlots1,
        ...refineDiffOptions(invertRoundingMode, options, Unit.Day),
      ),
    ),
    branding: DurationBranding,
  }
}

export function since<C extends IdLike>(
  getCalendarRecord: (calendarSlot: C) => {
    dateAdd: CalendarDateAddFunc,
    dateUntil: CalendarDateUntilFunc,
  },
  plainDateTimeSlots0: PlainDateTimeSlots<C>,
  plainDateTimeSlots1: PlainDateTimeSlots<C>,
  options?: DiffOptions,
): DurationFieldsWithSign { // lots of confusion!!! should be DurationSlots!!!!!!!!!!!!!!!!!!!!!!!!!
  return negateDurationInternals(
    until(getCalendarRecord, plainDateTimeSlots0, plainDateTimeSlots1, options, true)
  )
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

export function compare(
  plainDateTimeSlots0: IsoDateTimeFields,
  plainDateTimeSlots1: IsoDateTimeFields,
): NumSign {
  return compareIsoDateTimeFields(plainDateTimeSlots0, plainDateTimeSlots1) // just forwards
}

export function equals<C extends IdLike>(
  plainDateTimeSlots0: PlainDateTimeSlots<C>,
  plainDateTimeSlots1: PlainDateTimeSlots<C>,
): boolean {
  return !compareIsoDateTimeFields(plainDateTimeSlots0, plainDateTimeSlots1) &&
    isIdLikeEqual(plainDateTimeSlots0.calendar, plainDateTimeSlots1.calendar)
}

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
  getTimeZoneRecord: (timeZoneSlot: TZ) => {
    getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc,
    getPossibleInstantsFor: TimeZoneGetPossibleInstantsForFunc,
  },
  plainDateTimeSlots: PlainDateTimeSlots<C>,
  timeZoneSlot: TZ,
  options?: EpochDisambigOptions,
): ZonedDateTimeSlots<C, TZ> {
  const timeZoneRecord = getTimeZoneRecord(timeZoneSlot)

  return {
    calendar: plainDateTimeSlots.calendar,
    timeZone: timeZoneSlot,
    epochNanoseconds: convertPlainDateTimeToZoned(timeZoneRecord, plainDateTimeSlots, options),
    branding: ZonedDateTimeBranding,
  }
}

export function toPlainDate<C>(
  plainDateTimeSlots: PlainDateTimeSlots<C>,
): PlainDateSlots<C> {
  return {
    ...pluckProps(isoDateFieldNamesDesc, plainDateTimeSlots),
    branding: PlainDateBranding,
  }
}

export function toPlainYearMonth<C>(
  getCalendarRecord: (calendarSlot: C) => {
    yearMonthFromFields: CalendarYearMonthFromFieldsFunc,
    fields: CalendarFieldsFunc,
  },
  plainDateTimeSlots: PlainDateTimeSlots<C>,
  plainDateFields: DateBag, // TODO: DateBag correct type?
): PlainYearMonthSlots<C> {
  const calendarRecord = getCalendarRecord(plainDateTimeSlots.calendar)

  return {
    ...plainDateTimeSlots, // isoTimeFields and calendar
    ...convertToPlainYearMonth(calendarRecord, plainDateFields),
    branding: PlainYearMonthBranding,
  }
}

export function toPlainMonthDay<C>(
  getCalendarRecord: (calendarSlot: C) => {
    monthDayFromFields: CalendarMonthDayFromFieldsFunc,
    fields: CalendarFieldsFunc,
  },
  plainDateTimeSlots: PlainDateTimeSlots<C>,
  plainDateFields: DateBag, // TODO: DateBag correct type?
): PlainMonthDaySlots<C> {
  const calendarRecord = getCalendarRecord(plainDateTimeSlots.calendar)

  return {
    ...plainDateTimeSlots, // isoTimeFields and calendar
    ...convertToPlainMonthDay(calendarRecord, plainDateFields),
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
