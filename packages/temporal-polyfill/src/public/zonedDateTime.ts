import { DateTimeBag } from '../internal/calendarFields'
import { LocalesArg, prepZonedDateTimeFormat } from '../internal/formatIntl'
import { formatOffsetNano } from '../internal/formatIso'
import {
  DiffOptions,
  OverflowOptions,
  RoundingOptions,
  ZonedDateTimeDisplayOptions,
  ZonedFieldOptions,
  prepareOptions,
  refineZonedFieldOptions,
} from '../genericApi/optionsRefine'
import { UnitName } from '../internal/units'
import { NumSign, defineGetters, defineProps, defineStringTag, isObjectlike } from '../internal/utils'
import { getId } from '../internal/cast'
import { IsoDateTimeFields } from '../internal/calendarIsoFields'
import { zonedInternalsToIso } from '../internal/timeZoneOps'
import { ZonedDateTimeBag } from '../genericApi/bagGeneric'
import { DurationBranding, TimeZoneBranding, ZonedDateTimeBranding } from '../genericApi/branding'
import { DurationSlots, ZonedDateTimeSlots } from '../genericApi/slotsGeneric'
import * as ZonedDateTimeFuncs from '../genericApi/zonedDateTime'

// public
import { createViaSlots, getSlots, getSpecificSlots, rejectInvalidBag, setSlots } from './slotsForClasses'
import { CalendarSlot, getCalendarSlotFromBag, refineCalendarSlot } from './calendarSlot'
import { TimeZoneSlot, refineTimeZoneSlot } from './timeZoneSlot'
import { Calendar, CalendarArg } from './calendar'
import { CalendarProtocol } from './calendarProtocol'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { Instant, createInstant } from './instant'
import { PlainDate, PlainDateArg, createPlainDate, toPlainDateSlots } from './plainDate'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import { PlainTime, PlainTimeArg, createPlainTime } from './plainTime'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { TimeZone, TimeZoneArg, createTimeZone } from './timeZone'
import { TimeZoneProtocol } from './timeZoneProtocol'
import { createCalendarGetters, createEpochGetterMethods, createTimeGetterMethods, neverValueOf } from './mixins'
import { optionalToPlainTimeFields } from './utils'
import { createDateModOps, createDateRefineOps, createDiffOps, createMonthDayRefineOps, createMoveOps, createYearMonthRefineOps } from './calendarOpsQuery'
import { createSimpleTimeZoneOps, createTimeZoneOps } from './timeZoneOpsQuery'
import { dateRefiners } from '../genericApi/refiners'

export type ZonedDateTimeArg = ZonedDateTime | ZonedDateTimeBag<CalendarArg, TimeZoneArg> | string

export class ZonedDateTime {
  constructor(
    epochNano: bigint,
    timeZoneArg: TimeZoneArg,
    calendarArg?: CalendarArg,
  ) {
    setSlots(
      this,
      ZonedDateTimeFuncs.create(
        refineCalendarSlot,
        refineTimeZoneSlot,
        epochNano,
        timeZoneArg,
        calendarArg,
      ) as ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>
    )
  }

  with(mod: DateTimeBag, options?: ZonedFieldOptions): ZonedDateTime {
    return createZonedDateTime(
      ZonedDateTimeFuncs.withFields(
        createDateModOps,
        createTimeZoneOps,
        getZonedDateTimeSlots(this),
        this as any, // TODO: needs getters
        rejectInvalidBag(mod),
        prepareOptions(options),
      ),
    )
  }

  withPlainTime(plainTimeArg?: PlainTimeArg): ZonedDateTime {
    return createZonedDateTime(
      ZonedDateTimeFuncs.withPlainTime(
        createTimeZoneOps,
        getZonedDateTimeSlots(this),
        optionalToPlainTimeFields(plainTimeArg) as any, // TODO!!!
      )
    )
  }

  withPlainDate(plainDateArg: PlainDateArg): ZonedDateTime {
    return createZonedDateTime(
      ZonedDateTimeFuncs.withPlainDate(
        createTimeZoneOps,
        getZonedDateTimeSlots(this),
        toPlainDateSlots(plainDateArg),
      )
    )
  }

  withTimeZone(timeZoneArg: TimeZoneArg): ZonedDateTime {
    return createZonedDateTime(
      ZonedDateTimeFuncs.withTimeZone(
        getZonedDateTimeSlots(this),
        refineTimeZoneSlot(timeZoneArg),
      )
    )
  }

  withCalendar(calendarArg: CalendarArg): ZonedDateTime {
    return createZonedDateTime(
      ZonedDateTimeFuncs.withCalendar(
        getZonedDateTimeSlots(this),
        refineCalendarSlot(calendarArg),
      )
    )
  }

  add(durationArg: DurationArg, options?: OverflowOptions): ZonedDateTime {
    return createZonedDateTime(
      ZonedDateTimeFuncs.add(
        createMoveOps,
        createTimeZoneOps,
        getZonedDateTimeSlots(this),
        toDurationSlots(durationArg),
        options,
      )
    )
  }

  subtract(durationArg: DurationArg, options?: OverflowOptions): ZonedDateTime {
    return createZonedDateTime(
      ZonedDateTimeFuncs.subtract(
        createMoveOps,
        createTimeZoneOps,
        getZonedDateTimeSlots(this),
        toDurationSlots(durationArg),
        options,
      )
    )
  }

  until(otherArg: ZonedDateTimeArg, options?: DiffOptions): Duration {
    return createDuration({
      ...ZonedDateTimeFuncs.until(
        createDiffOps,
        createTimeZoneOps,
        getZonedDateTimeSlots(this),
        toZonedDateTimeSlots(otherArg),
        options,
      ),
      branding: DurationBranding,
    })
  }

  since(otherArg: ZonedDateTimeArg, options?: DiffOptions): Duration {
    return createDuration({
      ...ZonedDateTimeFuncs.since(
        createDiffOps,
        createTimeZoneOps,
        getZonedDateTimeSlots(this),
        toZonedDateTimeSlots(otherArg),
        options,
      ),
      branding: DurationBranding,
    })
  }

  round(options: RoundingOptions | UnitName): ZonedDateTime {
    return createZonedDateTime(
      ZonedDateTimeFuncs.round(
        createTimeZoneOps,
        getZonedDateTimeSlots(this),
        options,
      )
    )
  }

  startOfDay(): ZonedDateTime {
    return createZonedDateTime(
      ZonedDateTimeFuncs.startOfDay(
        createTimeZoneOps,
        getZonedDateTimeSlots(this),
      )
    )
  }

  equals(otherArg: ZonedDateTimeArg): boolean {
    return ZonedDateTimeFuncs.equals(
      getZonedDateTimeSlots(this),
      toZonedDateTimeSlots(otherArg),
    )
  }

  toString(options?: ZonedDateTimeDisplayOptions): string {
    return ZonedDateTimeFuncs.toString(
      createSimpleTimeZoneOps,
      getZonedDateTimeSlots(this),
      options,
    )
  }

  toJSON(): string {
    return ZonedDateTimeFuncs.toJSON(
      createSimpleTimeZoneOps,
      getZonedDateTimeSlots(this),
    )
  }

  toLocaleString(locales: LocalesArg, options: Intl.DateTimeFormatOptions = {}): string {
    const [format, epochMilli] = prepZonedDateTimeFormat(locales, options, getZonedDateTimeSlots(this))
    return format.format(epochMilli)
  }

  toInstant(): Instant {
    return createInstant(
      ZonedDateTimeFuncs.toInstant(getZonedDateTimeSlots(this))
    )
  }

  toPlainDate(): PlainDate {
    return createPlainDate(
      ZonedDateTimeFuncs.toPlainDate(createSimpleTimeZoneOps, getZonedDateTimeSlots(this))
    )
  }

  toPlainTime(): PlainTime {
    return createPlainTime(
      ZonedDateTimeFuncs.toPlainTime(createSimpleTimeZoneOps, getZonedDateTimeSlots(this))
    )
  }

  toPlainDateTime(): PlainDateTime {
    return createPlainDateTime(
      ZonedDateTimeFuncs.toPlainDateTime(createSimpleTimeZoneOps, getZonedDateTimeSlots(this))
    )
  }

  toPlainYearMonth(): PlainYearMonth {
    return createPlainYearMonth(
      ZonedDateTimeFuncs.toPlainYearMonth(
        createYearMonthRefineOps,
        getZonedDateTimeSlots(this),
        this as any, // !!!
      )
    )
  }

  toPlainMonthDay(): PlainMonthDay {
    return createPlainMonthDay(
      ZonedDateTimeFuncs.toPlainMonthDay(
        createMonthDayRefineOps,
        getZonedDateTimeSlots(this),
        this as any, // !!!
      )
    )
  }

  getISOFields(): IsoDateTimeFields & { calendar: CalendarSlot, timeZone: TimeZoneSlot, offset: string } {
    return ZonedDateTimeFuncs.getISOFields(createSimpleTimeZoneOps, getZonedDateTimeSlots(this))
  }

  // not DRY
  getCalendar(): CalendarProtocol {
    const { calendar } = getZonedDateTimeSlots(this)
    return typeof calendar === 'string'
      ? new Calendar(calendar)
      : calendar
  }

  // not DRY
  getTimeZone(): TimeZoneProtocol {
    const { timeZone } = getZonedDateTimeSlots(this)
    return typeof timeZone === 'string'
      ? new TimeZone(timeZone)
      : timeZone
  }

  // not DRY
  get calendarId(): string {
    return getId(getZonedDateTimeSlots(this).calendar)
  }

  get hoursInDay(): number {
    return ZonedDateTimeFuncs.hoursInDay(
      createTimeZoneOps,
      getZonedDateTimeSlots(this),
    )
  }

  // TODO: more DRY
  get offsetNanoseconds(): number {
    const slots = getZonedDateTimeSlots(this)
    return slotsToIsoFields(slots).offsetNanoseconds
  }

  // TODO: more DRY
  get offset(): string {
    const slots = getZonedDateTimeSlots(this)
    const offsetNano = slotsToIsoFields(slots).offsetNanoseconds
    return formatOffsetNano(offsetNano)
  }

  get timeZoneId(): string {
    return getId(getZonedDateTimeSlots(this).timeZone)
  }

  static from(arg: any, options?: ZonedFieldOptions) {
    return createZonedDateTime(toZonedDateTimeSlots(arg, options))
  }

  static compare(arg0: ZonedDateTimeArg, arg1: ZonedDateTimeArg): NumSign {
    return ZonedDateTimeFuncs.compare(
      toZonedDateTimeSlots(arg0),
      toZonedDateTimeSlots(arg1),
    )
  }
}

defineStringTag(ZonedDateTime.prototype, ZonedDateTimeBranding)

defineProps(ZonedDateTime.prototype, {
  valueOf: neverValueOf,
})

defineGetters(ZonedDateTime.prototype, {
  ...createCalendarGetters(ZonedDateTimeBranding, dateRefiners, slotsToIsoFields),
  ...createTimeGetterMethods(ZonedDateTimeBranding, slotsToIsoFields),
  ...createEpochGetterMethods(ZonedDateTimeBranding),
})

function slotsToIsoFields(
  slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>
): IsoDateTimeFields & { offsetNanoseconds: number } {
  const timeZoneNative = createSimpleTimeZoneOps(slots.timeZone)
  return zonedInternalsToIso(slots, timeZoneNative)
}

// Utils
// -------------------------------------------------------------------------------------------------

export function createZonedDateTime(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>): ZonedDateTime {
  return createViaSlots(ZonedDateTime, slots)
}

export function getZonedDateTimeSlots(zonedDateTime: ZonedDateTime): ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot> {
  return getSpecificSlots(ZonedDateTimeBranding, zonedDateTime) as ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>
}

export function toZonedDateTimeSlots(arg: ZonedDateTimeArg, options?: ZonedFieldOptions): ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot> {
  options = prepareOptions(options)

  if (isObjectlike(arg)) {
    const slots = (getSlots(arg) || {}) as { branding?: string, calendar?: CalendarSlot }

    if (slots.branding === ZonedDateTimeBranding) {
      refineZonedFieldOptions(options) // parse unused options
      return slots as ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>
    }

    return ZonedDateTimeFuncs.fromFields(
      createDateRefineOps,
      refineTimeZoneSlot,
      createTimeZoneOps,
      slots.calendar || getCalendarSlotFromBag(arg as any), // !!!
      arg as any, // !!!
      options,
    )
  }

  return ZonedDateTimeFuncs.fromString(arg, options)
}
