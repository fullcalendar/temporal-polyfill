import { isoCalendarId } from '../internal/calendarConfig'
import { YearMonthBag, YearMonthFieldsIntl } from '../internal/calendarFields'
import { CalendarDateAddFunc, CalendarDateFromFieldsFunc, CalendarDateUntilFunc, CalendarDayFunc, CalendarDaysInMonthFunc, CalendarFieldsFunc, CalendarMergeFieldsFunc, CalendarYearMonthFromFieldsFunc } from '../internal/calendarRecordTypes'
import { ensureString, toInteger } from '../internal/cast'
import { convertPlainYearMonthToDate, mergePlainYearMonthBag, refinePlainYearMonthBag } from '../internal/convert'
import { diffDates } from '../internal/diff'
import { negateDurationFields, updateDurationFieldsSign } from '../internal/durationFields'
import { IdLike, getCommonCalendarSlot, isIdLikeEqual } from '../internal/idLike'
import { IsoDateFields } from '../internal/isoFields'
import { formatIsoYearMonthFields, formatPossibleDate } from '../internal/isoFormat'
import { checkIsoYearMonthInBounds, compareIsoDateFields, moveByIsoDays } from '../internal/isoMath'
import { parsePlainYearMonth } from '../internal/isoParse'
import { DateTimeDisplayOptions, DiffOptions, OverflowOptions, refineDiffOptions } from '../internal/options'
import { Unit } from '../internal/units'
import { NumSign } from '../internal/utils'
import { DurationBranding, PlainDateBranding, PlainYearMonthBranding } from './branding'
import { DurationSlots, PlainDateSlots, PlainYearMonthSlots } from './genericTypes'

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
  const referenceIsoDayInt = toInteger(referenceIsoDay)

  return {
    ...checkIsoYearMonthInBounds({
      isoYear: isoYearInt,
      isoMonth: isoMonthInt,
      isoDay: referenceIsoDayInt
    }),
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
  getCalendarRecord: (calendar: C) => {
    yearMonthFromFields: CalendarYearMonthFromFieldsFunc,
    fields: CalendarFieldsFunc,
  },
  calendarSlot: C,
  bag: YearMonthBag,
  options?: OverflowOptions,
): PlainYearMonthSlots<C> {
  return {
    ...refinePlainYearMonthBag(getCalendarRecord(calendarSlot), bag, options),
    calendar: calendarSlot,
    branding: PlainYearMonthBranding,
  }
}

export function withFields<C>(
  getCalendarRecord: (calendar: C) => {
    yearMonthFromFields: CalendarYearMonthFromFieldsFunc,
    fields: CalendarFieldsFunc,
    mergeFields: CalendarMergeFieldsFunc,
  },
  plainYearMonthSlots: PlainYearMonthSlots<C>,
  initialFields: YearMonthFieldsIntl,
  mod: YearMonthBag,
  options?: OverflowOptions,
): PlainYearMonthSlots<C> {
  const calendarSlot = plainYearMonthSlots.calendar
  const calendarRecord = getCalendarRecord(calendarSlot)

  return {
    ...mergePlainYearMonthBag(calendarRecord, initialFields, mod, options),
    calendar: calendarSlot,
    branding: PlainYearMonthBranding,
  }
}

export function add<C>(
  getCalendarRecord: (calendar: C) => {
    dateAdd: CalendarDateAddFunc,
    daysInMonth: CalendarDaysInMonthFunc,
    day: CalendarDayFunc,
  },
  plainYearMonthSlots: PlainYearMonthSlots<C>,
  durationSlots: DurationSlots,
  options?: OverflowOptions,
): PlainYearMonthSlots<C> {
  const calendarSlot = plainYearMonthSlots.calendar
  const calendarRecord = getCalendarRecord(calendarSlot)

  const isoDateFields = movePlainYearMonthToDay(
    calendarRecord,
    plainYearMonthSlots,
    durationSlots.sign < 0
      ? calendarRecord.daysInMonth(plainYearMonthSlots)
      : 1,
  )

  const movedIsoDateFields = calendarRecord.dateAdd(isoDateFields, durationSlots, options)

  return {
    ...movePlainYearMonthToDay(calendarRecord, movedIsoDateFields),
    calendar: calendarSlot,
    branding: PlainYearMonthBranding,
  }
}

export function subtract<C>(
  getCalendarRecord: (calendar: C) => {
    dateAdd: CalendarDateAddFunc,
    daysInMonth: CalendarDaysInMonthFunc,
    day: CalendarDayFunc,
  },
  plainYearMonthSlots: PlainYearMonthSlots<C>,
  durationSlots: DurationSlots,
  options?: OverflowOptions,
): PlainYearMonthSlots<C> {
  return add(getCalendarRecord, plainYearMonthSlots, negateDurationFields(durationSlots) as any, options) // !!!
}

export function until<C extends IdLike>(
  getCalendarRecord: (calendar: C) => {
    dateAdd: CalendarDateAddFunc,
    dateUntil: CalendarDateUntilFunc,
    day: CalendarDayFunc,
  },
  plainYearMonthSlots0: PlainYearMonthSlots<C>,
  plainYearMonthSlots1: PlainYearMonthSlots<C>,
  options?: DiffOptions,
  invertRoundingMode?: boolean,
): DurationSlots {
  const calendarSlot = getCommonCalendarSlot(plainYearMonthSlots0.calendar, plainYearMonthSlots1.calendar)
  const calendarRecord = getCalendarRecord(calendarSlot)

  return {
    ...updateDurationFieldsSign(
      diffDates(
        calendarRecord,
        movePlainYearMonthToDay(calendarRecord, plainYearMonthSlots0),
        movePlainYearMonthToDay(calendarRecord, plainYearMonthSlots1),
        ...refineDiffOptions(invertRoundingMode, options, Unit.Year, Unit.Year, Unit.Month),
        options,
      ),
    ),
    branding: DurationBranding,
  }
}

export function since<C extends IdLike>(
  getCalendarRecord: (calendar: C) => {
    dateAdd: CalendarDateAddFunc,
    dateUntil: CalendarDateUntilFunc,
    day: CalendarDayFunc,
  },
  plainYearMonthSlots0: PlainYearMonthSlots<C>,
  plainYearMonthSlots1: PlainYearMonthSlots<C>,
  options?: DiffOptions,
): DurationSlots {
  return negateDurationFields(until(getCalendarRecord, plainYearMonthSlots1, plainYearMonthSlots0, options, true)) as any // !!!
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
    options,
  )
}

export function toJSON(
  plainYearMonthSlots: PlainYearMonthSlots<IdLike>,
): string {
  return toString(plainYearMonthSlots)
}

export function toPlainDate<C>(
  getCalendarRecord: (calendar: C) => {
    dateFromFields: CalendarDateFromFieldsFunc,
    fields: CalendarFieldsFunc,
    mergeFields: CalendarMergeFieldsFunc,
  },
  plainYearMonthSlots: PlainYearMonthSlots<C>,
  plainYearMonthFields: YearMonthFieldsIntl,
  bag: { day: number },
): PlainDateSlots<C> {
  const calendarSlot = plainYearMonthSlots.calendar
  const calendarRecord = getCalendarRecord(calendarSlot)

  return {
    ...convertPlainYearMonthToDate(calendarRecord, plainYearMonthFields, bag),
    calendar: calendarSlot,
    branding: PlainDateBranding,
  }
}

// Utils
// -----

function movePlainYearMonthToDay(
  calendarRecord: { day: CalendarDayFunc },
  isoFields: IsoDateFields,
  day = 1,
): IsoDateFields {
  return moveByIsoDays(
    isoFields,
    day - calendarRecord.day(isoFields),
  )
}
