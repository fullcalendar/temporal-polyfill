import { DateTimeBag, dateGetterNames } from '../internal/calendarFields'
import { LocalesArg, prepZonedDateTimeFormat } from '../internal/intlFormat'
import { formatOffsetNano } from '../internal/isoFormat'
import {
  DiffOptions,
  OverflowOptions,
  RoundingOptions,
  ZonedDateTimeDisplayOptions,
  ZonedFieldOptions,
  prepareOptions,
  refineZonedFieldOptions,
} from '../genericApi/options'
import { UnitName } from '../internal/units'
import { NumSign, defineGetters, defineProps, defineStringTag, isObjectlike } from '../internal/utils'
import { getId } from '../internal/idLike'
import { IsoDateTimeFields } from '../internal/isoFields'
import { zonedInternalsToIso } from '../internal/timeZoneMath'
import { ZonedDateTimeBag } from '../genericApi/genericBag'
import { CalendarBranding, TimeZoneBranding, ZonedDateTimeBranding } from '../genericApi/branding'
import { DurationSlots, ZonedDateTimeSlots } from '../genericApi/genericTypes'
import * as ZonedDateTimeFuncs from '../genericApi/zonedDateTime'

// public
import { createViaSlots, getSlots, getSpecificSlots, rejectInvalidBag, setSlots } from './slots'
import { CalendarSlot, getCalendarSlotFromBag, refineCalendarSlot } from './calendarSlot'
import { TimeZoneSlot, refineTimeZoneSlot } from './timeZoneSlot'
import { CalendarArg, CalendarProtocol, createCalendar } from './calendar'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { Instant, createInstant } from './instant'
import { PlainDate, PlainDateArg, createPlainDate, toPlainDateSlots } from './plainDate'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import { PlainTime, PlainTimeArg, createPlainTime } from './plainTime'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { TimeZoneArg, TimeZoneProtocol, createTimeZone } from './timeZone'
import { createCalendarGetterMethods, createEpochGetterMethods, createTimeGetterMethods, neverValueOf } from './publicMixins'
import { optionalToPlainTimeFields } from './publicUtils'
import { createDateNewCalendarRecord, createMonthDayNewCalendarRecord, createSimpleTimeZoneRecord, createTypicalTimeZoneRecord, createYearMonthNewCalendarRecord, getDateModCalendarRecord, getDiffCalendarRecord, getMoveCalendarRecord } from './recordCreators'

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
        getDateModCalendarRecord,
        createTypicalTimeZoneRecord,
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
        createTypicalTimeZoneRecord,
        getZonedDateTimeSlots(this),
        optionalToPlainTimeFields(plainTimeArg) as any, // TODO!!!
      )
    )
  }

  withPlainDate(plainDateArg: PlainDateArg): ZonedDateTime {
    return createZonedDateTime(
      ZonedDateTimeFuncs.withPlainDate(
        createTypicalTimeZoneRecord,
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
        getMoveCalendarRecord,
        createTypicalTimeZoneRecord,
        getZonedDateTimeSlots(this),
        toDurationSlots(durationArg),
        options,
      )
    )
  }

  subtract(durationArg: DurationArg, options?: OverflowOptions): ZonedDateTime {
    return createZonedDateTime(
      ZonedDateTimeFuncs.subtract(
        getMoveCalendarRecord,
        createTypicalTimeZoneRecord,
        getZonedDateTimeSlots(this),
        toDurationSlots(durationArg),
        options,
      )
    )
  }

  until(otherArg: ZonedDateTimeArg, options?: DiffOptions): Duration {
    return createDuration(
      ZonedDateTimeFuncs.until(
        getDiffCalendarRecord,
        createTypicalTimeZoneRecord,
        getZonedDateTimeSlots(this),
        toZonedDateTimeSlots(otherArg),
        prepareOptions(options),
      ) as unknown as DurationSlots // !!!
    )
  }

  since(otherArg: ZonedDateTimeArg, options?: DiffOptions): Duration {
    return createDuration(
      ZonedDateTimeFuncs.since(
        getDiffCalendarRecord,
        createTypicalTimeZoneRecord,
        getZonedDateTimeSlots(this),
        toZonedDateTimeSlots(otherArg),
        prepareOptions(options),
      ) as unknown as DurationSlots // !!!
    )
  }

  round(options: RoundingOptions | UnitName): ZonedDateTime {
    return createZonedDateTime(
      ZonedDateTimeFuncs.round(
        createTypicalTimeZoneRecord,
        getZonedDateTimeSlots(this),
        options,
      )
    )
  }

  startOfDay(): ZonedDateTime {
    return createZonedDateTime(
      ZonedDateTimeFuncs.startOfDay(
        createTypicalTimeZoneRecord,
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
      createSimpleTimeZoneRecord,
      getZonedDateTimeSlots(this),
      options,
    )
  }

  toJSON(): string {
    return ZonedDateTimeFuncs.toJSON(
      createSimpleTimeZoneRecord,
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
      ZonedDateTimeFuncs.toPlainDate(createSimpleTimeZoneRecord, getZonedDateTimeSlots(this))
    )
  }

  toPlainTime(): PlainTime {
    return createPlainTime(
      ZonedDateTimeFuncs.toPlainTime(createSimpleTimeZoneRecord, getZonedDateTimeSlots(this))
    )
  }

  toPlainDateTime(): PlainDateTime {
    return createPlainDateTime(
      ZonedDateTimeFuncs.toPlainDateTime(createSimpleTimeZoneRecord, getZonedDateTimeSlots(this))
    )
  }

  toPlainYearMonth(): PlainYearMonth {
    return createPlainYearMonth(
      ZonedDateTimeFuncs.toPlainYearMonth(
        createYearMonthNewCalendarRecord,
        getZonedDateTimeSlots(this),
        this as any, // !!!
      )
    )
  }

  toPlainMonthDay(): PlainMonthDay {
    return createPlainMonthDay(
      ZonedDateTimeFuncs.toPlainMonthDay(
        createMonthDayNewCalendarRecord,
        getZonedDateTimeSlots(this),
        this as any, // !!!
      )
    )
  }

  getISOFields(): IsoDateTimeFields & { calendar: CalendarSlot, timeZone: TimeZoneSlot, offset: string } {
    return ZonedDateTimeFuncs.getISOFields(createSimpleTimeZoneRecord, getZonedDateTimeSlots(this))
  }

  // not DRY
  getCalendar(): CalendarProtocol {
    const { calendar } = getZonedDateTimeSlots(this)
    return typeof calendar === 'string'
      ? createCalendar({ branding: CalendarBranding, id: calendar })
      : calendar
  }

  // not DRY
  getTimeZone(): TimeZoneProtocol {
    const { timeZone } = getZonedDateTimeSlots(this)
    return typeof timeZone === 'string'
      ? createTimeZone({ branding: TimeZoneBranding, id: timeZone })
      : timeZone
  }

  // not DRY
  get calendarId(): string {
    return getId(getZonedDateTimeSlots(this).calendar)
  }

  get hoursInDay(): number {
    return ZonedDateTimeFuncs.hoursInDay(
      createTypicalTimeZoneRecord,
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
  ...createCalendarGetterMethods(ZonedDateTimeBranding, dateGetterNames, slotsToIsoFields),
  ...createTimeGetterMethods(ZonedDateTimeBranding, slotsToIsoFields),
  ...createEpochGetterMethods(ZonedDateTimeBranding),
})

function slotsToIsoFields(
  slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>
): IsoDateTimeFields & { offsetNanoseconds: number } {
  const timeZoneRecord = createSimpleTimeZoneRecord(slots.timeZone)
  return zonedInternalsToIso(slots, timeZoneRecord)
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
      createDateNewCalendarRecord,
      refineTimeZoneSlot,
      createTypicalTimeZoneRecord,
      slots.calendar || getCalendarSlotFromBag(arg as any), // !!!
      arg as any, // !!!
      options,
    )
  }

  return ZonedDateTimeFuncs.fromString(arg, options)
}
