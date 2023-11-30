import { isoCalendarId } from '../internal/calendarConfig'
import { DateBag, DateTimeBag, DateTimeFields, EraYearFields } from '../internal/calendarFields'
import { CalendarDateAddFunc, CalendarDateFromFieldsFunc, CalendarDateUntilFunc, CalendarFieldsFunc, CalendarMergeFieldsFunc, CalendarMonthDayFromFieldsFunc, CalendarYearMonthFromFieldsFunc } from '../internal/calendarRecordTypes'
import { ensureString, toBigInt } from '../internal/cast'
import { convertToPlainMonthDay, convertToPlainYearMonth, mergeZonedDateTimeBag, refineZonedDateTimeBag } from '../internal/convert'
import { bigIntToDayTimeNano, compareDayTimeNanos } from '../internal/dayTimeNano'
import { diffZonedEpochNano } from '../internal/diff'
import { DurationFieldsWithSign, negateDurationInternals, updateDurationFieldsSign } from '../internal/durationFields'
import { ZonedDateTimeBag } from '../internal/genericBag'
import { IdLike, getCommonCalendarSlot, getPreferredCalendarSlot, isIdLikeEqual, isTimeZoneSlotsEqual } from '../internal/idLike'
import { isoTimeFieldDefaults, pluckIsoTimeFields } from '../internal/isoFields'
import { formatZonedDateTimeIso } from '../internal/isoFormat'
import { checkEpochNanoInBounds, epochNanoToIso } from '../internal/isoMath'
import { parseZonedDateTime } from '../internal/isoParse'
import { moveZonedEpochNano } from '../internal/move'
import { DiffOptions, EpochDisambig, OffsetDisambig, OverflowOptions, RoundingOptions, ZonedDateTimeDisplayOptions, ZonedFieldOptions, prepareOptions, refineDiffOptions, refineRoundOptions } from '../internal/options'
import { roundDateTime } from '../internal/round'
import { computeNanosecondsInDay, getMatchingInstantFor } from '../internal/timeZoneMath'
import { TimeZoneGetOffsetNanosecondsForFunc, TimeZoneGetPossibleInstantsForFunc } from '../internal/timeZoneRecordTypes'
import { DayTimeUnit, Unit, UnitName, nanoInHour } from '../internal/units'
import { NumSign } from '../internal/utils'
import { InstantBranding, PlainDateBranding, PlainDateTimeBranding, PlainMonthDayBranding, PlainTimeBranding, PlainYearMonthBranding, ZonedDateTimeBranding } from './branding'
import { InstantSlots, PlainDateSlots, PlainDateTimeSlots, PlainMonthDaySlots, PlainTimeSlots, PlainYearMonthSlots, ZonedDateTimeSlots } from './genericTypes'

// public
import { pluckIsoDateInternals, pluckIsoDateTimeInternals, rejectInvalidBag } from '../public/slots'
import { zonedInternalsToIso } from '../public/zonedInternalsToIso'

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
  getCalendarRecord: (calendarSlot: C) => {
    dateFromFields: CalendarDateFromFieldsFunc,
    fields: CalendarFieldsFunc,
  },
  refineTimeZoneArg: (timeZoneArg: TA) => T,
  getTimeZoneRecord: (timeZoneSlot: T) => {
    getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc,
    getPossibleInstantsFor: TimeZoneGetPossibleInstantsForFunc,
  },
  calendarSlot: C,
  fields: ZonedDateTimeBag<unknown, TA>,
  options?: ZonedFieldOptions,
): ZonedDateTimeSlots<C, T> {
  const [epochNanoseconds, timeZoneSlot] = refineZonedDateTimeBag(
    getCalendarRecord,
    refineTimeZoneArg,
    getTimeZoneRecord,
    calendarSlot,
    fields,
    options,
  )

  return {
    calendar: calendarSlot,
    timeZone: timeZoneSlot,
    epochNanoseconds,
    branding: ZonedDateTimeBranding,
  }
}

export function withFields<C, T>(
  getCalendarRecord: (calendarSlot: C) => {
    dateFromFields: CalendarDateFromFieldsFunc,
    fields: CalendarFieldsFunc,
    mergeFields: CalendarMergeFieldsFunc,
  },
  getTimeZoneRecord: (timeZoneSlot: T) => {
    getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc,
    getPossibleInstantsFor: TimeZoneGetPossibleInstantsForFunc,
  },
  zonedDateTimeSlots: ZonedDateTimeSlots<C, T>,
  initialFields: DateTimeFields & Partial<EraYearFields>,
  modFields: DateTimeBag,
  options?: ZonedFieldOptions,
): ZonedDateTimeSlots<C, T> {
  const { calendar, timeZone } = zonedDateTimeSlots

  return {
    calendar,
    timeZone,
    epochNanoseconds: mergeZonedDateTimeBag(
      getCalendarRecord(calendar),
      getTimeZoneRecord(timeZone),
      initialFields,
      rejectInvalidBag(modFields),
      prepareOptions(options),
    ),
    branding: ZonedDateTimeBranding,
  }
}

export function withPlainTime<C, T>(
  getTimeZoneRecord: (timeZoneSlot: T) => {
    getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc,
    getPossibleInstantsFor: TimeZoneGetPossibleInstantsForFunc,
  },
  zonedDateTimeSlots: ZonedDateTimeSlots<C, T>,
  plainTimeSlots: PlainTimeSlots,
): ZonedDateTimeSlots<C, T> {
  const timeZoneSlot = zonedDateTimeSlots.timeZone
  const timeZoneRecord = getTimeZoneRecord(timeZoneSlot)

  const isoFields = {
    ...zonedInternalsToIso(zonedDateTimeSlots as any), // TODO!!!
    ...plainTimeSlots,
  }

  const epochNano = getMatchingInstantFor(
    timeZoneRecord,
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
  getTimeZoneRecord: (timeZoneSlot: T) => {
    getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc,
    getPossibleInstantsFor: TimeZoneGetPossibleInstantsForFunc,
  },
  zonedDateTimeSlots: ZonedDateTimeSlots<C, T>,
  plainDateSlots: PlainDateSlots<C>,
): ZonedDateTimeSlots<C, T> {
  const timeZoneSlot = zonedDateTimeSlots.timeZone
  const timeZoneRecord = getTimeZoneRecord(timeZoneSlot)

  const isoFields = {
    ...zonedInternalsToIso(zonedDateTimeSlots as any), // TODO!!!
    ...plainDateSlots,
  }
  const calendar = getPreferredCalendarSlot(zonedDateTimeSlots.calendar, plainDateSlots.calendar)

  const epochNano = getMatchingInstantFor(
    timeZoneRecord,
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

export function add<C, T>(
  getCalendarRecord: (calendarSlot: C) => {
    dateAdd: CalendarDateAddFunc,
  },
  getTimeZoneRecord: (timeZoneSlot: T) => {
    getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc,
    getPossibleInstantsFor: TimeZoneGetPossibleInstantsForFunc,
  },
  zonedDateTimeSlots: ZonedDateTimeSlots<C, T>,
  durationSlots: DurationFieldsWithSign,
  options?: OverflowOptions,
): ZonedDateTimeSlots<C, T> {
  const movedEpochNanoseconds = moveZonedEpochNano(
    getCalendarRecord(zonedDateTimeSlots.calendar),
    getTimeZoneRecord(zonedDateTimeSlots.timeZone),
    zonedDateTimeSlots.epochNanoseconds,
    durationSlots,
    options,
  )

  return {
    ...zonedDateTimeSlots,
    epochNanoseconds: movedEpochNanoseconds,
  }
}

export function subtract<C, T>(
  getCalendarRecord: (calendarSlot: C) => {
    dateAdd: CalendarDateAddFunc,
  },
  getTimeZoneRecord: (timeZoneSlot: T) => {
    getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc,
    getPossibleInstantsFor: TimeZoneGetPossibleInstantsForFunc,
  },
  zonedDateTimeSlots: ZonedDateTimeSlots<C, T>,
  durationSlots: DurationFieldsWithSign,
  options?: OverflowOptions,
): ZonedDateTimeSlots<C, T> {
  return add(getCalendarRecord, getTimeZoneRecord, zonedDateTimeSlots, negateDurationInternals(durationSlots), options)
}

export function until<C extends IdLike, T>(
  getCalendarRecord: (calendarSlot: C) => {
    dateAdd: CalendarDateAddFunc,
    dateUntil: CalendarDateUntilFunc,
  },
  getTimeZoneRecord: (timeZoneSlot: T) => {
    getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc,
    getPossibleInstantsFor: TimeZoneGetPossibleInstantsForFunc,
  },
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, T>,
  zonedDateTimeSlots1: ZonedDateTimeSlots<C, T>,
  options?: DiffOptions, // TODO: force caller to always provide, even if undefined?
  invertRoundingMode?: boolean,
): DurationFieldsWithSign {
  const calendarSlot = getCommonCalendarSlot(zonedDateTimeSlots0.calendar, zonedDateTimeSlots1.calendar)
  const timeZoneSlot = zonedDateTimeSlots0.timeZone // TODO: ensure same timeZone with zonedDateTimeSlots1???

  return updateDurationFieldsSign(
    diffZonedEpochNano(
      getCalendarRecord,
      getTimeZoneRecord,
      calendarSlot,
      timeZoneSlot,
      zonedDateTimeSlots0.epochNanoseconds,
      zonedDateTimeSlots1.epochNanoseconds,
      ...refineDiffOptions(invertRoundingMode, options, Unit.Hour),
      options,
    ),
  )
}

export function since<C extends IdLike, T>(
  getCalendarRecord: (calendarSlot: C) => {
    dateAdd: CalendarDateAddFunc,
    dateUntil: CalendarDateUntilFunc,
  },
  getTimeZoneRecord: (timeZoneSlot: T) => {
    getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc,
    getPossibleInstantsFor: TimeZoneGetPossibleInstantsForFunc,
  },
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, T>,
  zonedDateTimeSlots1: ZonedDateTimeSlots<C, T>,
  options?: DiffOptions, // TODO: force caller to always provide, even if undefined?
): DurationFieldsWithSign {
  return negateDurationInternals(
    until(getCalendarRecord, getTimeZoneRecord, zonedDateTimeSlots0, zonedDateTimeSlots1, options, true)
  )
}

export function round<C, T>(
  getTimeZoneRecord: (timeZoneSlot: T) => {
    getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc,
    getPossibleInstantsFor: TimeZoneGetPossibleInstantsForFunc,
  },
  zonedDateTimeSlots: ZonedDateTimeSlots<C, T>,
  options: RoundingOptions | UnitName,
): ZonedDateTimeSlots<C, T> {
  let { epochNanoseconds, timeZone, calendar } = zonedDateTimeSlots
  const timeZoneRecord = getTimeZoneRecord(timeZone)
  const [smallestUnit, roundingInc, roundingMode] = refineRoundOptions(options)
  const offsetNano = timeZoneRecord.getOffsetNanosecondsFor(epochNanoseconds)
  let isoDateTimeFields = {
    ...epochNanoToIso(epochNanoseconds, offsetNano),
    calendar,
  }

  isoDateTimeFields = {
    calendar,
    ...roundDateTime(
      isoDateTimeFields,
      smallestUnit as DayTimeUnit,
      roundingInc,
      roundingMode,
      timeZoneRecord,
    )
  }

  epochNanoseconds = getMatchingInstantFor(
    timeZoneRecord,
    isoDateTimeFields,
    offsetNano,
    false, // z
    OffsetDisambig.Prefer, // keep old offsetNano if possible
    EpochDisambig.Compat,
    true, // fuzzy
  )

  return {
    epochNanoseconds,
    timeZone,
    calendar,
    branding: ZonedDateTimeBranding,
  }
}

export function startOfDay<C, T>(
  getTimeZoneRecord: (timeZoneSlot: T) => {
    getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc,
    getPossibleInstantsFor: TimeZoneGetPossibleInstantsForFunc,
  },
  zonedDateTimeSlots: ZonedDateTimeSlots<C, T>,
): ZonedDateTimeSlots<C, T> {
  let { epochNanoseconds, timeZone, calendar } = zonedDateTimeSlots
  const timeZoneRecord = getTimeZoneRecord(timeZone)

  const isoFields = {
    ...zonedInternalsToIso(zonedDateTimeSlots as any), // TODO!!!!!!!!!
    ...isoTimeFieldDefaults,
  }

  epochNanoseconds = getMatchingInstantFor(
    timeZoneRecord,
    isoFields,
    undefined, // offsetNanoseconds
    false, // z
    OffsetDisambig.Reject,
    EpochDisambig.Compat,
    true, // fuzzy
  )

  return {
    branding: ZonedDateTimeBranding,
    epochNanoseconds,
    timeZone,
    calendar,
  }
}

export function hoursInDay<C, T>(
  getTimeZoneRecord: (timeZoneSlot: T) => {
    getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc,
    getPossibleInstantsFor: TimeZoneGetPossibleInstantsForFunc,
  },
  zonedDateTimeSlots: ZonedDateTimeSlots<C, T>,
): number {
  const timeZoneRecord = getTimeZoneRecord(zonedDateTimeSlots.timeZone)

  return computeNanosecondsInDay(
    timeZoneRecord,
    zonedInternalsToIso(zonedDateTimeSlots as any), // TODO!!!
  ) / nanoInHour
}

export function compare(
  zonedDateTimeSlots0: ZonedDateTimeSlots<unknown, unknown>,
  zonedDateTimeSlots1: ZonedDateTimeSlots<unknown, unknown>,
): NumSign {
  return compareDayTimeNanos(
    zonedDateTimeSlots0.epochNanoseconds,
    zonedDateTimeSlots1.epochNanoseconds,
  )
}

export function equals<C extends IdLike, T extends IdLike>(
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, T>,
  zonedDateTimeSlots1: ZonedDateTimeSlots<C, T>,
): boolean {
  return !compare(zonedDateTimeSlots0, zonedDateTimeSlots1) &&
    isTimeZoneSlotsEqual(zonedDateTimeSlots0.timeZone, zonedDateTimeSlots1.timeZone) &&
    isIdLikeEqual(zonedDateTimeSlots0.calendar, zonedDateTimeSlots1.calendar)
}

export function toString<C extends IdLike, T extends IdLike>(
  getTimeZoneRecord: (timeZoneSlot: T) => {
    getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc,
  },
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, T>,
  options?: ZonedDateTimeDisplayOptions,
): string {
  return formatZonedDateTimeIso(
    zonedDateTimeSlots0.calendar,
    zonedDateTimeSlots0.timeZone,
    getTimeZoneRecord(zonedDateTimeSlots0.timeZone),
    zonedDateTimeSlots0.epochNanoseconds,
    options,
  )
}

export function toJSON<C extends IdLike, T extends IdLike>(
  getTimeZoneRecord: (timeZoneSlot: T) => {
    getOffsetNanosecondsFor: TimeZoneGetOffsetNanosecondsForFunc,
  },
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, T>,
): string {
  return toString(getTimeZoneRecord, zonedDateTimeSlots0)
}

export function toInstant(
  zonedDateTimeSlots0: ZonedDateTimeSlots<unknown, unknown>
): InstantSlots {
  return {
    epochNanoseconds: zonedDateTimeSlots0.epochNanoseconds,
    branding: InstantBranding,
  }
}

export function toPlainDate<C>(
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, unknown>,
): PlainDateSlots<C> {
  return {
    ...pluckIsoDateInternals(zonedInternalsToIso(zonedDateTimeSlots0 as any)), // TODO!!!
    calendar: zonedDateTimeSlots0.calendar, // TODO!!!
    branding: PlainDateBranding,
  }
}

export function toPlainTime<C>(
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, unknown>,
): PlainTimeSlots {
  return {
    ...pluckIsoTimeFields(zonedInternalsToIso(zonedDateTimeSlots0 as any)), // TODO!!!
    branding: PlainTimeBranding,
  }
}

export function toPlainDateTime<C>(
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, unknown>,
): PlainDateTimeSlots<C> {
  return {
    ...pluckIsoDateTimeInternals(zonedInternalsToIso(zonedDateTimeSlots0 as any)), // TODO!!!
    calendar: zonedDateTimeSlots0.calendar, // TODO!!!
    branding: PlainDateTimeBranding,
  }
}

export function toPlainYearMonth<C>(
  getCalendarRecord: (calendarSlot: C) => {
    yearMonthFromFields: CalendarYearMonthFromFieldsFunc,
    fields: CalendarFieldsFunc,
  },
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, unknown>,
  zonedDateTimeFields: DateBag, // TODO: DateBag correct type?
): PlainYearMonthSlots<C> {
  const calendarSlot = zonedDateTimeSlots0.calendar
  const calendarRecord = getCalendarRecord(calendarSlot)

  return {
    ...convertToPlainYearMonth(calendarRecord, zonedDateTimeFields),
    calendar: calendarSlot,
    branding: PlainYearMonthBranding,
  }
}

export function toPlainMonthDay<C>(
  getCalendarRecord: (calendarSlot: C) => {
    monthDayFromFields: CalendarMonthDayFromFieldsFunc,
    fields: CalendarFieldsFunc,
  },
  zonedDateTimeSlots0: ZonedDateTimeSlots<C, unknown>,
  zonedDateTimeFields: DateBag, // TODO: DateBag correct type?
): PlainMonthDaySlots<C> {
  const calendarSlot = zonedDateTimeSlots0.calendar
  const calendarRecord = getCalendarRecord(calendarSlot)

  return {
    ...convertToPlainMonthDay(calendarRecord, zonedDateTimeFields),
    calendar: calendarSlot,
    branding: PlainMonthDayBranding,
  }
}
