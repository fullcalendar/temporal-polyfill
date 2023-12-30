import { DateTimeBag } from '../internal/calendarFields'
import { isoTimeFieldDefaults } from '../internal/calendarIsoFields'
import { DateTimeDisplayOptions, DiffOptions, EpochDisambigOptions, OverflowOptions, RoundingOptions, copyOptions, refineOverflowOptions } from '../internal/optionsRefine'
import { UnitName } from '../internal/units'
import { NumSign, defineGetters, defineProps, defineStringTag, isObjectlike, pluckProps } from '../internal/utils'
import { zonedInternalsToIso } from '../internal/timeZoneOps'
import { PlainDateBranding, PlainDateSlots, PlainDateTimeBranding, PlainDateTimeSlots, ZonedDateTimeBranding, ZonedDateTimeSlots, createPlainDateTimeSlots, createPlainDateSlots, createPlainTimeSlots, getId, removeBranding } from '../internal/slots'
import { createViaSlots, getSlots, getSpecificSlots, setSlots, rejectInvalidBag, PublicDateTimeSlots } from './slotsForClasses'
import { CalendarSlot, getCalendarSlotFromBag, refineCalendarSlot } from './slotsForClasses'
import { TimeZoneSlot, refineTimeZoneSlot } from './slotsForClasses'
import { Calendar, CalendarArg } from './calendar'
import { CalendarProtocol } from './calendarProtocol'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { PlainDate, PlainDateArg, createPlainDate, toPlainDateSlots } from './plainDate'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import { PlainTime, PlainTimeArg, createPlainTime } from './plainTime'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { TimeZoneArg } from './timeZone'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'
import { createTimeGetterMethods, neverValueOf } from './mixins'
import { optionalToPlainTimeFields } from './utils'
import { createDateModOps, createDateRefineOps, createDiffOps, createMonthDayRefineOps, createMoveOps, createYearMonthRefineOps } from './calendarOpsQuery'
import { dateTimeCalendarGetters } from './mixins'
import { createSimpleTimeZoneOps, createTimeZoneOps } from './timeZoneOpsQuery'
import { PlainDateBag, PlainDateTimeBag, plainDateTimeWithFields, refinePlainDateTimeBag } from '../internal/bag'
import { constructPlainDateTimeSlots } from '../internal/construct'
import { plainDateTimeWithPlainDate, plainDateTimeWithPlainTime, slotsWithCalendar } from '../internal/mod'
import { movePlainDateTime } from '../internal/move'
import { diffPlainDateTimes } from '../internal/diff'
import { roundPlainDateTime } from '../internal/round'
import { plainDateTimesEqual, compareIsoDateTimeFields } from '../internal/compare'
import { formatPlainDateTimeIso } from '../internal/formatIso'
import { plainDateTimeToPlainMonthDay, plainDateTimeToPlainYearMonth, plainDateTimeToZonedDateTime, zonedDateTimeToPlainDateTime } from '../internal/convert'
import { parsePlainDateTime } from '../internal/parseIso'
import { prepPlainDateTimeFormat } from './dateTimeFormat'
import { LocalesArg } from '../internal/formatIntl'

export type PlainDateTimeArg = PlainDateTime | PlainDateTimeBag<CalendarArg> | string

export class PlainDateTime {
  constructor(
    isoYear: number,
    isoMonth: number,
    isoDay: number,
    isoHour?: number,
    isoMinute?: number,
    isoSecond?: number,
    isoMillisecond?: number,
    isoMicrosecond?: number,
    isoNanosecond?: number,
    calendar?: CalendarArg,
  ) {
    setSlots(
      this,
      constructPlainDateTimeSlots(
        refineCalendarSlot,
        isoYear, isoMonth, isoDay,
        isoHour, isoMinute, isoSecond,
        isoMillisecond, isoMicrosecond, isoNanosecond,
        calendar,
      ) as PlainDateTimeSlots<CalendarSlot>
    )
  }

  with(mod: DateTimeBag, options?: OverflowOptions): PlainDateTime {
    return createPlainDateTime(
      plainDateTimeWithFields(
        createDateModOps,
        getPlainDateTimeSlots(this),
        this as any, // TODO: needs getters
        rejectInvalidBag(mod),
        options,
      )
    )
  }

  withPlainTime(plainTimeArg?: PlainTimeArg): PlainDateTime {
    return createPlainDateTime(
      plainDateTimeWithPlainTime(
        getPlainDateTimeSlots(this),
        optionalToPlainTimeFields(plainTimeArg),
      )
    )
  }

  withPlainDate(plainDateArg: PlainDateArg): PlainDateTime {
    return createPlainDateTime(
      plainDateTimeWithPlainDate(
        getPlainDateTimeSlots(this),
        toPlainDateSlots(plainDateArg),
      )
    )
  }

  withCalendar(calendarArg: CalendarArg): PlainDateTime {
    return createPlainDateTime(
      slotsWithCalendar(
        getPlainDateTimeSlots(this),
        refineCalendarSlot(calendarArg),
      )
    )
  }

  add(durationArg: DurationArg, options?: OverflowOptions): PlainDateTime {
    return createPlainDateTime(
      movePlainDateTime(
        createMoveOps,
        false,
        getPlainDateTimeSlots(this),
        toDurationSlots(durationArg),
        options,
      )
    )
  }

  subtract(durationArg: DurationArg, options?: OverflowOptions): PlainDateTime {
    return createPlainDateTime(
      movePlainDateTime(
        createMoveOps,
        true,
        getPlainDateTimeSlots(this),
        toDurationSlots(durationArg),
        options,
      )
    )
  }

  until(otherArg: PlainDateTimeArg, options?: DiffOptions): Duration {
    return createDuration(
      diffPlainDateTimes(
        createDiffOps,
        getPlainDateTimeSlots(this),
        toPlainDateTimeSlots(otherArg),
        options,
      )
    )
  }

  since(otherArg: PlainDateTimeArg, options?: DiffOptions): Duration {
    return createDuration(
      diffPlainDateTimes(
        createDiffOps,
        getPlainDateTimeSlots(this),
        toPlainDateTimeSlots(otherArg),
        options,
        true,
      )
    )
  }

  round(options: RoundingOptions | UnitName): PlainDateTime {
    return createPlainDateTime(
      roundPlainDateTime(
        getPlainDateTimeSlots(this),
        options,
      )
    )
  }

  equals(otherArg: PlainDateTimeArg): boolean {
    return plainDateTimesEqual(getPlainDateTimeSlots(this), toPlainDateTimeSlots(otherArg))
  }

  toString(options?: DateTimeDisplayOptions): string {
    return formatPlainDateTimeIso(getPlainDateTimeSlots(this), options)
  }

  toJSON(): string {
    return formatPlainDateTimeIso(getPlainDateTimeSlots(this))
  }

  toLocaleString(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions) {
    const [format, epochMilli] = prepPlainDateTimeFormat(locales, options, getPlainDateTimeSlots(this))
    return format.format(epochMilli)
  }

  toZonedDateTime(
    timeZoneArg: TimeZoneArg,
    options?: EpochDisambigOptions,
  ): ZonedDateTime {
    return createZonedDateTime(
      plainDateTimeToZonedDateTime(
       createTimeZoneOps,
       getPlainDateTimeSlots(this),
       refineTimeZoneSlot(timeZoneArg),
       options,
     )
    )
  }

  toPlainDate(): PlainDate {
    return createPlainDate(
      createPlainDateSlots(getPlainDateTimeSlots(this))
    )
  }

  toPlainYearMonth(): PlainYearMonth {
    return createPlainYearMonth(
      plainDateTimeToPlainYearMonth(
        createYearMonthRefineOps,
        getPlainDateTimeSlots(this),
        this as any, // TODO!!!
      )
    )
  }

  toPlainMonthDay(): PlainMonthDay {
    return createPlainMonthDay(
      plainDateTimeToPlainMonthDay(
        createMonthDayRefineOps,
        getPlainDateTimeSlots(this),
        this as any, // TODO!!!
      )
    )
  }

  toPlainTime(): PlainTime {
    return createPlainTime(
      createPlainTimeSlots(getPlainDateTimeSlots(this)),
    )
  }

  // not DRY
  getISOFields(): PublicDateTimeSlots {
    return removeBranding(getPlainDateTimeSlots(this))
  }

  // not DRY
  getCalendar(): CalendarProtocol {
    const { calendar } = getPlainDateTimeSlots(this)
    return typeof calendar === 'string'
      ? new Calendar(calendar)
      : calendar
  }

  // not DRY
  get calendarId(): string {
    return getId(getPlainDateTimeSlots(this).calendar)
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
  valueOf: neverValueOf,
})

defineGetters(PlainDateTime.prototype, {
  ...dateTimeCalendarGetters,
  ...createTimeGetterMethods(PlainDateTimeBranding),
})

// Utils
// -------------------------------------------------------------------------------------------------

export function createPlainDateTime(slots: PlainDateTimeSlots<CalendarSlot>): PlainDateTime {
  return createViaSlots(PlainDateTime, slots)
}

export function getPlainDateTimeSlots(plainDateTime: PlainDateTime): PlainDateTimeSlots<CalendarSlot> {
  return getSpecificSlots(PlainDateTimeBranding, plainDateTime) as PlainDateTimeSlots<CalendarSlot>
}

export function toPlainDateTimeSlots(arg: PlainDateTimeArg, options?: OverflowOptions): PlainDateTimeSlots<CalendarSlot> {
  options = copyOptions(options)

  if (isObjectlike(arg)) {
    const slots = (getSlots(arg) || {}) as { branding?: string, calendar?: CalendarSlot }

    switch (slots.branding) {
      case PlainDateTimeBranding:
        refineOverflowOptions(options) // parse unused options
        return slots as PlainDateTimeSlots<CalendarSlot>

      case PlainDateBranding:
        refineOverflowOptions(options) // parse unused options
        return createPlainDateTimeSlots({
          ...(slots as PlainDateSlots<CalendarSlot>),
          ...isoTimeFieldDefaults,
        })

      case ZonedDateTimeBranding:
        refineOverflowOptions(options) // parse unused options
        return zonedDateTimeToPlainDateTime(
          createSimpleTimeZoneOps,
          slots as ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>,
        )
    }

    return refinePlainDateTimeBag(
      createDateRefineOps(getCalendarSlotFromBag(arg as PlainDateBag<CalendarArg>)),
      arg as PlainDateBag<CalendarArg>,
      options,
    )
  }

  const res = parsePlainDateTime(arg)
  refineOverflowOptions(options) // parse unused options
  return res
}
