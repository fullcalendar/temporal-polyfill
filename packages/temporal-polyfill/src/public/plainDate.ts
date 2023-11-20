import { isoCalendarId } from '../internal/calendarConfig'
import { DateBag, DateFields, dateGetterNames } from '../internal/calendarFields'
import { diffDates } from '../internal/diff'
import { DurationFieldsWithSign, negateDurationInternals, updateDurationFieldsSign } from '../internal/durationFields'
import { IsoDateFields, isoDateFieldNames } from '../internal/isoFields'
import { formatPlainDateIso } from '../internal/isoFormat'
import { LocalesArg, formatDateLocaleString } from '../internal/intlFormat'
import { checkIsoDateTimeInBounds, compareIsoDateFields } from '../internal/isoMath'
import { parsePlainDate } from '../internal/isoParse'
import { DateTimeDisplayOptions, DiffOptions, OverflowOptions, prepareOptions, refineDiffOptions, refineOverflowOptions } from '../internal/options'
import { NumSign, defineGetters, defineProps, defineStringTag, isObjectlike, pluckProps } from '../internal/utils'
import { ensureObjectlike, ensureString } from '../internal/cast'
import { moveDateEasy } from '../internal/move'
import { calendarImplDateAdd, calendarImplDateFromFields, calendarImplDateUntil, calendarImplFields, calendarImplMergeFields, calendarImplMonthDayFromFields, calendarImplYearMonthFromFields } from '../internal/calendarRecordSimple'
import { Unit } from '../internal/units'
import { getSingleInstantFor } from '../internal/timeZoneMath'
import { timeZoneImplGetOffsetNanosecondsFor, timeZoneImplGetPossibleInstantsFor } from '../internal/timeZoneRecordSimple'
import { convertToPlainMonthDay, convertToPlainYearMonth, mergePlainDateBag, refinePlainDateBag } from '../internal/convert'
import { PlainDateBag } from '../internal/genericBag'

// public
import { CalendarBranding, DurationBranding, IsoDateSlots, PlainDateBranding, PlainDateSlots, PlainDateTimeBranding, PlainDateTimeSlots, PlainMonthDayBranding, PlainYearMonthBranding, ZonedDateTimeBranding, ZonedDateTimeSlots, createViaSlots, getSlots, getSpecificSlots, setSlots, refineIsoDateSlots, pluckIsoDateInternals, rejectInvalidBag } from './slots'
import { calendarProtocolDateAdd, calendarProtocolDateFromFields, calendarProtocolDateUntil, calendarProtocolFields, calendarProtocolMergeFields, calendarProtocolMonthDayFromFields, calendarProtocolYearMonthFromFields, createCalendarSlotRecord } from './calendarRecordComplex'
import { getBagCalendarSlot, getCommonCalendarSlot, isCalendarSlotsEqual, refineCalendarSlot } from './calendarSlot'
import { zonedInternalsToIso } from './zonedInternalsToIso'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import { PlainTimeArg } from './plainTime'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { CalendarArg, CalendarProtocol, createCalendar } from './calendar'
import { createCalendarGetterMethods, createCalendarIdGetterMethods, neverValueOf } from './publicMixins'
import { optionalToPlainTimeFields } from './publicUtils'
import { TimeZone, TimeZoneArg } from './timeZone'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { refineTimeZoneSlot } from './timeZoneSlot'
import { createTimeZoneSlotRecord, timeZoneProtocolGetOffsetNanosecondsFor, timeZoneProtocolGetPossibleInstantsFor } from './timeZoneRecordComplex'

export type PlainDateArg = PlainDate | PlainDateBag<CalendarArg> | string

export class PlainDate {
  constructor(
    isoYear: number,
    isoMonth: number,
    isoDay: number,
    calendar: CalendarArg = isoCalendarId,
  ) {
    setSlots(this, {
      branding: PlainDateBranding,
      ...refineIsoDateSlots({
        isoYear,
        isoMonth,
        isoDay,
        calendar,
      })
    })
  }

  with(mod: DateBag, options?: OverflowOptions): PlainDate {
    const { calendar } = getPlainDateSlots(this)
    const calendarRecord = createCalendarSlotRecord(calendar, {
      dateFromFields: calendarImplDateFromFields,
      fields: calendarImplFields,
      mergeFields: calendarImplMergeFields,
    }, {
      dateFromFields: calendarProtocolDateFromFields,
      fields: calendarProtocolFields,
      mergeFields: calendarProtocolMergeFields,
    })

    return createPlainDate({
      ...mergePlainDateBag(calendarRecord, this, rejectInvalidBag(mod), prepareOptions(options)),
      calendar,
      branding: PlainDateBranding,
    })
  }

  withCalendar(calendarArg: CalendarArg): PlainDate {
    return createPlainDate({
      ...getPlainDateSlots(this),
      calendar: refineCalendarSlot(calendarArg),
    })
  }

  // TODO: more DRY
  add(durationArg: DurationArg, options?: OverflowOptions): PlainDate {
    const slots = getPlainDateSlots(this)

    const calendarRecord = createCalendarSlotRecord(slots.calendar, {
      dateAdd: calendarImplDateAdd,
    }, {
      dateAdd: calendarProtocolDateAdd,
    })

    return createPlainDate({
      ...slots,
      ...moveDateEasy(
        calendarRecord,
        slots,
        toDurationSlots(durationArg),
        options,
      ),
    })
  }

  // TODO: more DRY
  subtract(durationArg: DurationArg, options?: OverflowOptions): PlainDate {
    const slots = getPlainDateSlots(this)
    const calendarRecord = createCalendarSlotRecord(slots.calendar, {
      dateAdd: calendarImplDateAdd,
    }, {
      dateAdd: calendarProtocolDateAdd,
    })

    return createPlainDate({
      ...slots,
      ...moveDateEasy(
        calendarRecord,
        slots,
        negateDurationInternals(toDurationSlots(durationArg)),
        options,
      ),
    })
  }

  until(otherArg: PlainDateArg, options?: DiffOptions): Duration {
    return createDuration({
      branding: DurationBranding,
      ...diffPlainDates(getPlainDateSlots(this), toPlainDateSlots(otherArg), options),
    })
  }

  since(otherArg: PlainDateArg, options?: DiffOptions): Duration {
    return createDuration({
      branding: DurationBranding,
      ...diffPlainDates(getPlainDateSlots(this), toPlainDateSlots(otherArg), options, true),
    })
  }

  equals(otherArg: PlainDateArg): boolean {
    return isPlainDatesEqual(getPlainDateSlots(this), toPlainDateSlots(otherArg))
  }

  toString(options?: DateTimeDisplayOptions): string {
    const slots = getPlainDateSlots(this)
    return formatPlainDateIso(createCalendarSlotRecord(slots.calendar), slots, options)
  }

  toJSON(): string {
    const slots = getPlainDateSlots(this)
    return formatPlainDateIso(createCalendarSlotRecord(slots.calendar), slots)
  }

  toLocaleString(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) {
    const slots = getPlainDateSlots(this)
    return formatDateLocaleString(createCalendarSlotRecord(slots.calendar), slots, locales, options)
  }

  toZonedDateTime(
    options: TimeZoneArg | { timeZone: TimeZoneArg, plainTime?: PlainTimeArg },
  ): ZonedDateTime {
    const slots = getPlainDateSlots(this)
    const normalOptions = isObjectlike(options) && !(options instanceof TimeZone)
      ? options as { timeZone: TimeZoneArg, plainTime?: PlainTimeArg }
      : { timeZone: options as TimeZoneArg }

    const timeZoneSlot = refineTimeZoneSlot(normalOptions.timeZone)
    const plainTimeSlots = optionalToPlainTimeFields(normalOptions.plainTime)

    const timeZoneRecord = createTimeZoneSlotRecord(timeZoneSlot, {
      getOffsetNanosecondsFor: timeZoneImplGetOffsetNanosecondsFor,
      getPossibleInstantsFor: timeZoneImplGetPossibleInstantsFor,
    }, {
      getOffsetNanosecondsFor: timeZoneProtocolGetOffsetNanosecondsFor,
      getPossibleInstantsFor: timeZoneProtocolGetPossibleInstantsFor,
    })

    return createZonedDateTime({
      epochNanoseconds: getSingleInstantFor(timeZoneRecord, { ...slots, ...plainTimeSlots }),
      calendar: slots.calendar,
      timeZone: timeZoneSlot,
      branding: ZonedDateTimeBranding,
    })
  }

  toPlainDateTime(timeArg: PlainTimeArg): PlainDateTime {
    return createPlainDateTime({
      ...checkIsoDateTimeInBounds({
        ...getPlainDateSlots(this),
        ...optionalToPlainTimeFields(timeArg),
      }),
      branding: PlainDateTimeBranding,
    })
  }

  toPlainYearMonth(): PlainYearMonth {
    const { calendar } = getPlainDateSlots(this)
    const calendarRecord = createCalendarSlotRecord(calendar, {
      yearMonthFromFields: calendarImplYearMonthFromFields,
      fields: calendarImplFields,
    }, {
      yearMonthFromFields: calendarProtocolYearMonthFromFields,
      fields: calendarProtocolFields,
    })

    return createPlainYearMonth({
      ...convertToPlainYearMonth(calendarRecord, this),
      calendar,
      branding: PlainYearMonthBranding,
    })
  }

  toPlainMonthDay(): PlainMonthDay {
    const { calendar } = getPlainDateSlots(this)
    const calendarRecord = createCalendarSlotRecord(calendar, {
      monthDayFromFields: calendarImplMonthDayFromFields,
      fields: calendarImplFields,
    }, {
      monthDayFromFields: calendarProtocolMonthDayFromFields,
      fields: calendarProtocolFields,
    })

    return createPlainMonthDay({
      ...convertToPlainMonthDay(calendarRecord, this),
      calendar,
      branding: PlainMonthDayBranding,
    })
  }

  // not DRY
  getISOFields(): IsoDateSlots {
    const slots = getPlainDateSlots(this)
    return { // !!!
      calendar: slots.calendar,
      ...pluckProps<IsoDateFields>(isoDateFieldNames, slots),
    }
  }

  // not DRY
  getCalendar(): CalendarProtocol {
    const { calendar } = getPlainDateSlots(this)
    return typeof calendar === 'string'
      ? createCalendar({ branding: CalendarBranding, id: calendar })
      : calendar
  }

  static from(arg: any, options?: OverflowOptions): PlainDate {
    return createPlainDate(toPlainDateSlots(arg, options))
  }

  static compare(arg0: PlainDateArg, arg1: PlainDateArg): NumSign {
    return compareIsoDateFields(
      toPlainDateSlots(arg0),
      toPlainDateSlots(arg1),
    )
  }
}

export interface PlainDate extends DateFields {}

defineStringTag(PlainDate.prototype, PlainDateBranding)

defineProps(PlainDate.prototype, {
  valueOf: neverValueOf,
})

defineGetters(PlainDate.prototype, {
  ...createCalendarIdGetterMethods(PlainDateBranding),
  ...createCalendarGetterMethods(PlainDateBranding, dateGetterNames),
})

// Utils
// -------------------------------------------------------------------------------------------------

export function createPlainDate(slots: PlainDateSlots): PlainDate {
  return createViaSlots(PlainDate, slots)
}

export function getPlainDateSlots(plainDate: PlainDate): PlainDateSlots {
  return getSpecificSlots(PlainDateBranding, plainDate) as PlainDateSlots
}

export function toPlainDateSlots(arg: PlainDateArg, options?: OverflowOptions): PlainDateSlots {
  options = prepareOptions(options)

  if (isObjectlike(arg)) {
    const slots = getSlots(arg)
    if (slots) {
      switch (slots.branding) {
        case PlainDateBranding:
          refineOverflowOptions(options) // parse unused options
          return slots as PlainDateSlots
        case PlainDateTimeBranding:
          refineOverflowOptions(options) // parse unused options
          return { ...pluckIsoDateInternals(slots as PlainDateTimeSlots), branding: PlainDateBranding }
        case ZonedDateTimeBranding:
          refineOverflowOptions(options) // parse unused options
          return { ...pluckIsoDateInternals(zonedInternalsToIso(slots as ZonedDateTimeSlots)), branding: PlainDateBranding }
      }
    }

    const calendar = getBagCalendarSlot(arg) // TODO: double-access of slots(.calendar)
    const calendarRecord = createCalendarSlotRecord(calendar, {
      dateFromFields: calendarImplDateFromFields,
      fields: calendarImplFields,
    }, {
      dateFromFields: calendarProtocolDateFromFields,
      fields: calendarProtocolFields,
    })

    return {
      ...refinePlainDateBag(calendarRecord, arg as any, options),
      calendar,
      branding: PlainDateBranding,
    }
  }

  const res = { ...parsePlainDate(ensureString(arg)), branding: PlainDateBranding } // will validate arg
  refineOverflowOptions(options) // parse unused options
  return res
}

export function diffPlainDates(
  internals0: IsoDateSlots,
  internals1: IsoDateSlots,
  options: DiffOptions | undefined,
  invert?: boolean,
): DurationFieldsWithSign {
  const calendar = getCommonCalendarSlot(internals0.calendar, internals1.calendar)
  const calendarRecord = createCalendarSlotRecord(calendar, {
    dateAdd: calendarImplDateAdd,
    dateUntil: calendarImplDateUntil,
  }, {
    dateAdd: calendarProtocolDateAdd,
    dateUntil: calendarProtocolDateUntil,
  })

  let durationInternals = updateDurationFieldsSign(
    diffDates(
      calendarRecord,
      internals0,
      internals1,
      ...refineDiffOptions(
        invert,
        options === undefined ? options : { ...ensureObjectlike(options) }, // YUCK
        Unit.Day,
        Unit.Year,
        Unit.Day,
      ),
    )
  )

  if (invert) {
    durationInternals = negateDurationInternals(durationInternals)
  }

  return durationInternals
}

export function isPlainDatesEqual(
  a: IsoDateSlots,
  b: IsoDateSlots
): boolean {
  return !compareIsoDateFields(a, b) &&
    isCalendarSlotsEqual(a.calendar, b.calendar)
}
