import { isoCalendarId } from '../internal/calendarConfig'
import { DateBag, TimeBag, dateGetterNames } from '../internal/calendarFields'
import { ensureString } from '../internal/cast'
import { convertPlainDateTimeToZoned, convertToPlainMonthDay, convertToPlainYearMonth, mergePlainDateTimeBag, refinePlainDateTimeBag, rejectInvalidBag } from '../internal/convert'
import { diffPlainDateTimes } from '../internal/diff'
import { negateDurationInternals } from '../internal/durationFields'
import { isPlainDateTimesEqual } from '../internal/equality'
import { createToLocaleStringMethods } from '../internal/intlFormat'
import { IsoDateTimeFields, isoDateTimeFieldNames, isoTimeFieldDefaults, pluckIsoTimeFields } from '../internal/isoFields'
import { formatPlainDateTimeIso } from '../internal/isoFormat'
import { IsoDateTimePublic, pluckIsoDateInternals, pluckIsoDateTimeInternals, refineIsoDateTimeInternals } from '../internal/isoInternals'
import { compareIsoDateTimeFields } from '../internal/isoMath'
import { parsePlainDateTime } from '../internal/isoParse'
import { movePlainDateTime } from '../internal/move'
import { DateTimeDisplayOptions, DiffOptions, EpochDisambigOptions, OverflowOptions, RoundingOptions, prepareOptions, refineOverflowOptions } from '../internal/options'
import { roundPlainDateTime } from '../internal/round'
import { CalendarBranding, DurationBranding, PlainDateBranding, PlainDateSlots, PlainDateTimeBranding, PlainDateTimeSlots, PlainMonthDayBranding, PlainTimeBranding, PlainYearMonthBranding, ZonedDateTimeBranding, ZonedDateTimeSlots, createViaSlots, getSlots, getSpecificSlots, setSlots } from '../internal/slots'
import { UnitName } from '../internal/units'
import { NumSign, defineGetters, defineProps, defineStringTag, isObjectlike, pluckProps } from '../internal/utils'
import { getPreferredCalendarSlot, refineCalendarSlot } from '../internal/calendarSlot'
import { refineTimeZoneSlot, zonedInternalsToIso } from '../internal/timeZoneSlot'

// public
import { CalendarArg, CalendarProtocol, createCalendar } from './calendar'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { PlainDate, PlainDateArg, PlainDateBag, createPlainDate, toPlainDateSlots } from './plainDate'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import { PlainTime, PlainTimeArg, createPlainTime } from './plainTime'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { TimeZoneArg } from './timeZone'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'
import { createCalendarGetterMethods, createCalendarIdGetterMethods, createTimeGetterMethods, neverValueOf } from './publicMixins'
import { optionalToPlainTimeFields } from './publicUtils'

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
      ...mergePlainDateTimeBag(this, rejectInvalidBag(mod), prepareOptions(options)),
      branding: PlainDateTimeBranding,
    })
  }

  withPlainTime(plainTimeArg?: PlainTimeArg): PlainDateTime {
    return createPlainDateTime({
      ...getPlainDateTimeSlots(this),
      ...optionalToPlainTimeFields(plainTimeArg),
      branding: PlainDateTimeBranding,
    })
  }

  withPlainDate(plainDateArg: PlainDateArg): PlainDateTime {
    const slots = getPlainDateTimeSlots(this)
    const plainDateSlots = toPlainDateSlots(plainDateArg)
    return createPlainDateTime({
      ...slots,
      ...plainDateSlots,
      // TODO: more DRY with other datetime types
      calendar: getPreferredCalendarSlot(slots.calendar, plainDateSlots.calendar),
      branding: PlainDateTimeBranding,
    })
  }

  withCalendar(calendarArg: CalendarArg): PlainDateTime {
    return createPlainDateTime({
      ...getPlainDateTimeSlots(this),
      calendar: refineCalendarSlot(calendarArg),
    })
  }

  add(durationArg: DurationArg, options?: OverflowOptions): PlainDateTime {
    return createPlainDateTime({
      ...movePlainDateTime(
        getPlainDateTimeSlots(this),
        toDurationSlots(durationArg),
        options,
      ),
      branding: PlainDateTimeBranding,
    })
  }

  subtract(durationArg: DurationArg, options?: OverflowOptions): PlainDateTime {
    return createPlainDateTime({
      ...movePlainDateTime(
        getPlainDateTimeSlots(this),
        negateDurationInternals(toDurationSlots(durationArg)),
        options,
      ),
      branding: PlainDateTimeBranding,
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
      ...roundPlainDateTime(getPlainDateTimeSlots(this), options),
      branding: PlainDateTimeBranding,
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
        refineTimeZoneSlot(timeZoneArg),
        options,
      ),
    })
  }

  toPlainDate(): PlainDate {
    return createPlainDate({
      ...pluckIsoDateInternals(getPlainDateTimeSlots(this)),
      branding: PlainDateBranding,
    })
  }

  toPlainYearMonth(): PlainYearMonth {
    getPlainDateTimeSlots(this) // validate `this`
    return createPlainYearMonth({
      ...convertToPlainYearMonth(this),
      branding: PlainYearMonthBranding,
    })
  }

  toPlainMonthDay(): PlainMonthDay {
    getPlainDateTimeSlots(this) // validate `this`
    return createPlainMonthDay({
      ...convertToPlainMonthDay(this),
      branding: PlainMonthDayBranding,
    })
  }

  toPlainTime(): PlainTime {
    return createPlainTime({
      ...pluckIsoTimeFields(getPlainDateTimeSlots(this)),
      branding: PlainTimeBranding,
    })
  }

  getISOFields(): IsoDateTimePublic {
    const slots = getPlainDateTimeSlots(this)
    return { // !!!
      calendar: slots.calendar,
      ...pluckProps<IsoDateTimeFields>(isoDateTimeFieldNames, slots),
    }
  }

  getCalendar(): CalendarProtocol {
    const { calendar } = getPlainDateTimeSlots(this)
    return typeof calendar === 'string'
      ? createCalendar({ branding: CalendarBranding, id: calendar })
      : calendar
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

defineStringTag(PlainDateTime.prototype, PlainDateTimeBranding)

defineProps(PlainDateTime.prototype, {
  ...createToLocaleStringMethods(PlainDateTimeBranding),
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
  options = prepareOptions(options)

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

  const res = { ...parsePlainDateTime(ensureString(arg)), branding: PlainDateTimeBranding } // will validate arg
  refineOverflowOptions(options) // parse unused options
  return res
}
