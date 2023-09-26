import { CalendarArg, CalendarProtocol } from './calendar'
import { isoCalendarId } from './calendarConfig'
import { DateBag, TimeBag, dateGetterNames } from './calendarFields'
import { CalendarOps } from './calendarOps'
import { queryCalendarOps } from './calendarOpsQuery'
import { getPublicCalendar } from './calendarPublic'
import { ensureString } from './cast'
import { convertPlainDateTimeToZoned, convertToPlainMonthDay, convertToPlainYearMonth, mergePlainDateTimeBag, refinePlainDateTimeBag } from './convert'
import { diffPlainDateTimes } from './diff'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { negateDurationInternals } from './durationFields'
import { isPlainDateTimesEqual } from './equality'
import { createToLocaleStringMethod } from './intlFormat'
import { IsoDateTimeFields, IsoTimeFields, isoDateTimeFieldNames, isoTimeFieldDefaults, pluckIsoTimeFields } from './isoFields'
import { formatPlainDateTimeIso } from './isoFormat'
import { IsoDateTimePublic, getPublicIdOrObj, pluckIsoDateInternals, pluckIsoDateTimeInternals, refineIsoDateTimeInternals } from './isoInternals'
import { compareIsoDateTimeFields } from './isoMath'
import { parsePlainDateTime } from './isoParse'
import { movePlainDateTime } from './move'
import { DateTimeDisplayOptions, DiffOptions, EpochDisambigOptions, OverflowOptions, RoundingOptions, refineOverflowOptions } from './options'
import { PlainDate, PlainDateArg, PlainDateBag, createPlainDate, toPlainDateSlots } from './plainDate'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import { PlainTime, PlainTimeArg, createPlainTime, toPlainTimeSlots } from './plainTime'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { roundPlainDateTime } from './round'
import { DurationBranding, PlainDateBranding, PlainDateSlots, PlainDateTimeBranding, PlainDateTimeSlots, PlainMonthDayBranding, PlainTimeBranding, PlainYearMonthBranding, ZonedDateTimeBranding, ZonedDateTimeSlots, createCalendarGetterMethods, createCalendarIdGetterMethods, createTimeGetterMethods, createViaSlots, getSlots, getSpecificSlots, neverValueOf, setSlots } from './slots'
import { TimeZoneArg } from './timeZone'
import { queryTimeZoneOps, zonedInternalsToIso } from './timeZoneOps'
import { UnitName } from './units'
import { NumSign, defineGetters, defineProps, isObjectlike, pluckProps } from './utils'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'

export type PlainDateTimeBag = DateBag & TimeBag & { calendar?: CalendarArg }
export type PlainDateTimeMod = DateBag & TimeBag
export type PlainDateTimeArg = PlainDateTime | PlainDateTimeBag | string

export class PlainDateTime {
  constructor(
    isoYear: number,
    isoMonth: number,
    isoDay: number,
    isoHour: number = 0,
    isoMinute: number = 0,
    isoSecond: number = 0,
    isoMillisecond: number = 0,
    isoMicrosecond: number = 0,
    isoNanosecond: number = 0,
    calendar: CalendarArg = isoCalendarId,
  ) {
    setSlots(this, {
      branding: PlainDateTimeBranding,
      ...refineIsoDateTimeInternals({
        isoYear,
        isoMonth,
        isoDay,
        isoHour,
        isoMinute,
        isoSecond,
        isoMillisecond,
        isoMicrosecond,
        isoNanosecond,
        calendar,
      })
    })
  }

  with(mod: PlainDateTimeMod, options?: OverflowOptions): PlainDateTime {
    getPlainDateTimeSlots(this) // validate `this`
    return createPlainDateTime({
      branding: PlainDateTimeBranding,
      ...mergePlainDateTimeBag(this, mod, options),
    })
  }

  withPlainTime(plainTimeArg?: PlainTimeArg): PlainDateTime {
    return createPlainDateTime({
      ...getPlainDateTimeSlots(this),
      ...optionalToPlainTimeFields(plainTimeArg),
    })
  }

  withPlainDate(plainDateArg: PlainDateArg): PlainDateTime {
    const slots = getPlainDateTimeSlots(this)
    const plainDateSlots = toPlainDateSlots(plainDateArg)
    return createPlainDateTime({
      ...slots,
      ...plainDateSlots,
      // TODO: more DRY with other datetime types
      calendar: getPreferredCalendar(plainDateSlots.calendar, slots.calendar),
      branding: PlainDateTimeBranding,
    })
  }

  withCalendar(calendarArg: CalendarArg): PlainDateTime {
    return createPlainDateTime({
      ...getPlainDateTimeSlots(this),
      calendar: queryCalendarOps(calendarArg),
    })
  }

  add(durationArg: DurationArg, options?: OverflowOptions): PlainDateTime {
    return createPlainDateTime({
      branding: PlainDateTimeBranding,
      ...movePlainDateTime(
        getPlainDateTimeSlots(this),
        toDurationSlots(durationArg),
        options,
      ),
    })
  }

  subtract(durationArg: DurationArg, options?: OverflowOptions): PlainDateTime {
    return createPlainDateTime({
      branding: PlainDateTimeBranding,
      ...movePlainDateTime(
        getPlainDateTimeSlots(this),
        negateDurationInternals(toDurationSlots(durationArg)),
        options,
      ),
    })
  }

  until(otherArg: PlainDateTimeArg, options?: DiffOptions): Duration {
    return createDuration({
      branding: DurationBranding,
      ...diffPlainDateTimes(getPlainDateTimeSlots(this), toPlainDateTimeSlots(otherArg), options)
    })
  }

  since(otherArg: PlainDateTimeArg, options?: DiffOptions): Duration {
    return createDuration({
      branding: DurationBranding,
      ...diffPlainDateTimes(getPlainDateTimeSlots(this), toPlainDateTimeSlots(otherArg), options, true)
    })
  }

  round(options: RoundingOptions | UnitName): PlainDateTime {
    return createPlainDateTime({
      branding: PlainDateTimeBranding,
      ...roundPlainDateTime(getPlainDateTimeSlots(this), options)
    })
  }

  equals(otherArg: PlainDateTimeArg): boolean {
    return isPlainDateTimesEqual(getPlainDateTimeSlots(this), toPlainDateTimeSlots(otherArg))
  }

  toString(options?: DateTimeDisplayOptions): string {
    return formatPlainDateTimeIso(getPlainDateTimeSlots(this), options)
  }

  toJSON(): string {
    return formatPlainDateTimeIso(getPlainDateTimeSlots(this))
  }

  toZonedDateTime(
    timeZoneArg: TimeZoneArg,
    options?: EpochDisambigOptions,
  ): ZonedDateTime {
    return createZonedDateTime({
      branding: ZonedDateTimeBranding,
      ...convertPlainDateTimeToZoned(
        getPlainDateTimeSlots(this),
        queryTimeZoneOps(timeZoneArg),
        options,
      ),
    })
  }

  toPlainDate(): PlainDate {
    return createPlainDate({
      branding: PlainDateBranding,
      ...pluckIsoDateInternals(getPlainDateTimeSlots(this))
    })
  }

  toPlainYearMonth(): PlainYearMonth {
    getPlainDateTimeSlots(this) // validate `this`
    return createPlainYearMonth({
      branding: PlainYearMonthBranding,
      ...convertToPlainYearMonth(this),
    })
  }

  toPlainMonthDay(): PlainMonthDay {
    getPlainDateTimeSlots(this) // validate `this`
    return createPlainMonthDay({
      branding: PlainMonthDayBranding,
      ...convertToPlainMonthDay(this)
    })
  }

  toPlainTime(): PlainTime {
    return createPlainTime({
      branding: PlainTimeBranding,
      ...pluckIsoTimeFields(getPlainDateTimeSlots(this)),
    })
  }

  getISOFields(): IsoDateTimePublic {
    const slots = getPlainDateTimeSlots(this)
    return {
      calendar: getPublicIdOrObj(slots.calendar) as any, // !!!
      ...pluckProps<IsoDateTimeFields>(isoDateTimeFieldNames, slots), // !!!
    }
  }

  getCalendar(): CalendarProtocol {
    return getPublicCalendar(getPlainDateTimeSlots(this))
  }

  static from(arg: PlainDateTimeArg, options: OverflowOptions): PlainDateTime {
    return createPlainDateTime(toPlainDateTimeSlots(arg, options))
  }

  static compare(arg0: PlainDateTimeArg, arg1: PlainDateTimeArg): NumSign {
    return compareIsoDateTimeFields(
      toPlainDateTimeSlots(arg0),
      toPlainDateTimeSlots(arg1),
    )
  }
}

defineProps(PlainDateTime.prototype, {
  [Symbol.toStringTag]: 'Temporal.' + PlainDateTimeBranding,
  toLocaleString: createToLocaleStringMethod(PlainDateTimeBranding),
  valueOf: neverValueOf,
})

defineGetters(PlainDateTime.prototype, {
  ...createCalendarIdGetterMethods(PlainDateTimeBranding),
  ...createCalendarGetterMethods(PlainDateTimeBranding, dateGetterNames),
  ...createTimeGetterMethods(PlainDateTimeBranding),
})

// Utils
// -------------------------------------------------------------------------------------------------

export function createPlainDateTime(slots: PlainDateTimeSlots): PlainDateTime {
  return createViaSlots(PlainDateTime, slots)
}

export function getPlainDateTimeSlots(plainDateTime: PlainDateTime): PlainDateTimeSlots {
  return getSpecificSlots(PlainDateTimeBranding, plainDateTime) as PlainDateTimeSlots
}

export function toPlainDateTimeSlots(arg: PlainDateTimeArg, options?: OverflowOptions): PlainDateTimeSlots {
  if (isObjectlike(arg)) {
    const slots = getSlots(arg)
    if (slots) {
      switch (slots.branding) {
        case PlainDateTimeBranding:
          refineOverflowOptions(options) // parse unused options
          return slots as PlainDateTimeSlots
        case PlainDateBranding:
          refineOverflowOptions(options) // parse unused options
          return { ...(slots as PlainDateSlots), ...isoTimeFieldDefaults, branding: PlainDateTimeBranding}
        case ZonedDateTimeBranding:
          refineOverflowOptions(options) // parse unused options
          return { ...pluckIsoDateTimeInternals(zonedInternalsToIso(slots as ZonedDateTimeSlots)), branding: PlainDateTimeBranding }
      }
    }
    return { ...refinePlainDateTimeBag(arg as PlainDateBag, options), branding: PlainDateTimeBranding }
  }
  refineOverflowOptions(options) // parse unused options
  return { ...parsePlainDateTime(ensureString(arg)), branding: PlainDateTimeBranding }
}

// TODO: DRY
function optionalToPlainTimeFields(timeArg: PlainTimeArg | undefined): IsoTimeFields {
  return timeArg === undefined ? isoTimeFieldDefaults : toPlainTimeSlots(timeArg)
}

// TODO: DRY
// similar to checkCalendarsCompatible
// `a` takes precedence if both the same ID
function getPreferredCalendar(a: CalendarOps, b: CalendarOps): CalendarOps {
  // fast path. doesn't read IDs
  if (a === b) {
    return a
  }

  const aId = a.id
  const bId = b.id

  if (aId !== isoCalendarId) {
    if (aId !== bId && bId !== isoCalendarId) {
      throw new RangeError('Incompatible calendars')
    }

    return a
  }

  return b
}
