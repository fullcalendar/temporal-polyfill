import { DateTimeBag } from '../internal/calendarFields'
import { LocalesArg } from '../internal/formatIntl'
import { formatOffsetNano, formatZonedDateTimeIso } from '../internal/formatIso'
import {
  DiffOptions,
  OverflowOptions,
  RoundingOptions,
  ZonedDateTimeDisplayOptions,
  ZonedFieldOptions,
  copyOptions,
  refineZonedFieldOptions,
} from '../internal/optionsRefine'
import { UnitName } from '../internal/units'
import { NumSign, defineGetters, defineProps, defineStringTag, isObjectlike } from '../internal/utils'
import { IsoDateTimeFields } from '../internal/calendarIsoFields'
import { ZonedIsoDateTimeSlots, computeHoursInDay, computeStartOfDay, getZonedIsoDateTimeSlots, zonedInternalsToIso } from '../internal/timeZoneOps'
import { ZonedDateTimeBranding, ZonedDateTimeSlots, createDurationSlots, getId } from '../internal/slots'
import { createViaSlots, getSlots, getSpecificSlots, rejectInvalidBag, setSlots } from './slotsForClasses'
import { CalendarSlot, getCalendarSlotFromBag, refineCalendarSlot } from './slotsForClasses'
import { TimeZoneSlot, refineTimeZoneSlot } from './slotsForClasses'
import { Calendar, CalendarArg } from './calendar'
import { CalendarProtocol } from './calendarProtocol'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { Instant, createInstant } from './instant'
import { PlainDate, PlainDateArg, createPlainDate, toPlainDateSlots } from './plainDate'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import { PlainTime, PlainTimeArg, createPlainTime } from './plainTime'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { TimeZone, TimeZoneArg } from './timeZone'
import { TimeZoneProtocol } from './timeZoneProtocol'
import { createCalendarGetters, createEpochGetterMethods, createTimeGetterMethods, neverValueOf } from './mixins'
import { dateRefiners } from './calendarRefiners'
import { optionalToPlainTimeFields } from './utils'
import { createDateModOps, createDateRefineOps, createDiffOps, createMonthDayRefineOps, createMoveOps, createYearMonthRefineOps } from './calendarOpsQuery'
import { createSimpleTimeZoneOps, createTimeZoneOps } from './timeZoneOpsQuery'
import { ZonedDateTimeBag, refineZonedDateTimeBag, zonedDateTimeWithFields } from '../internal/bag'
import { constructZonedDateTimeSlots } from '../internal/construct'
import { slotsWithCalendar, slotsWithTimeZone, zonedDateTimeWithPlainDate, zonedDateTimeWithPlainTime } from '../internal/mod'
import { moveZonedDateTime } from '../internal/move'
import { diffZonedDateTimes } from '../internal/diff'
import { roundZonedDateTime } from '../internal/round'
import { compareZonedDateTimes, zonedDateTimesEqual } from '../internal/compare'
import { zonedDateTimeToInstant, zonedDateTimeToPlainDate, zonedDateTimeToPlainDateTime, zonedDateTimeToPlainMonthDay, zonedDateTimeToPlainTime, zonedDateTimeToPlainYearMonth } from '../internal/convert'
import { parseZonedDateTime } from '../internal/parseIso'
import { prepZonedDateTimeFormat } from './dateTimeFormat'

export type ZonedDateTimeArg = ZonedDateTime | ZonedDateTimeBag<CalendarArg, TimeZoneArg> | string

export class ZonedDateTime {
  constructor(
    epochNano: bigint,
    timeZoneArg: TimeZoneArg,
    calendarArg?: CalendarArg,
  ) {
    setSlots(
      this,
      constructZonedDateTimeSlots(
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
      zonedDateTimeWithFields(
        createDateModOps,
        createTimeZoneOps,
        getZonedDateTimeSlots(this),
        this as any, // TODO: needs getters
        rejectInvalidBag(mod),
        options,
      ),
    )
  }

  withPlainTime(plainTimeArg?: PlainTimeArg): ZonedDateTime {
    return createZonedDateTime(
      zonedDateTimeWithPlainTime(
        createTimeZoneOps,
        getZonedDateTimeSlots(this),
        optionalToPlainTimeFields(plainTimeArg),
      )
    )
  }

  withPlainDate(plainDateArg: PlainDateArg): ZonedDateTime {
    return createZonedDateTime(
      zonedDateTimeWithPlainDate(
        createTimeZoneOps,
        getZonedDateTimeSlots(this),
        toPlainDateSlots(plainDateArg),
      )
    )
  }

  withTimeZone(timeZoneArg: TimeZoneArg): ZonedDateTime {
    return createZonedDateTime(
      slotsWithTimeZone(
        getZonedDateTimeSlots(this),
        refineTimeZoneSlot(timeZoneArg),
      )
    )
  }

  withCalendar(calendarArg: CalendarArg): ZonedDateTime {
    return createZonedDateTime(
      slotsWithCalendar(
        getZonedDateTimeSlots(this),
        refineCalendarSlot(calendarArg),
      )
    )
  }

  add(durationArg: DurationArg, options?: OverflowOptions): ZonedDateTime {
    return createZonedDateTime(
      moveZonedDateTime(
        createMoveOps,
        createTimeZoneOps,
        false,
        getZonedDateTimeSlots(this),
        toDurationSlots(durationArg),
        options,
      )
    )
  }

  subtract(durationArg: DurationArg, options?: OverflowOptions): ZonedDateTime {
    return createZonedDateTime(
      moveZonedDateTime(
        createMoveOps,
        createTimeZoneOps,
        true,
        getZonedDateTimeSlots(this),
        toDurationSlots(durationArg),
        options,
      )
    )
  }

  until(otherArg: ZonedDateTimeArg, options?: DiffOptions): Duration {
    return createDuration(
      createDurationSlots(
        diffZonedDateTimes(
          createDiffOps,
          createTimeZoneOps,
          getZonedDateTimeSlots(this),
          toZonedDateTimeSlots(otherArg),
          options,
        ),
      )
    )
  }

  since(otherArg: ZonedDateTimeArg, options?: DiffOptions): Duration {
    return createDuration(
      createDurationSlots(
        diffZonedDateTimes(
          createDiffOps,
          createTimeZoneOps,
          getZonedDateTimeSlots(this),
          toZonedDateTimeSlots(otherArg),
          options,
          true,
        ),
      )
    )
  }

  round(options: RoundingOptions | UnitName): ZonedDateTime {
    return createZonedDateTime(
      roundZonedDateTime(
        createTimeZoneOps,
        getZonedDateTimeSlots(this),
        options,
      )
    )
  }

  startOfDay(): ZonedDateTime {
    return createZonedDateTime(
      computeStartOfDay(
        createTimeZoneOps,
        getZonedDateTimeSlots(this),
      )
    )
  }

  equals(otherArg: ZonedDateTimeArg): boolean {
    return zonedDateTimesEqual(
      getZonedDateTimeSlots(this),
      toZonedDateTimeSlots(otherArg),
    )
  }

  toString(options?: ZonedDateTimeDisplayOptions): string {
    return formatZonedDateTimeIso(
      createSimpleTimeZoneOps,
      getZonedDateTimeSlots(this),
      options,
    )
  }

  toJSON(): string {
    return formatZonedDateTimeIso(
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
      zonedDateTimeToInstant(getZonedDateTimeSlots(this))
    )
  }

  toPlainDate(): PlainDate {
    return createPlainDate(
      zonedDateTimeToPlainDate(createSimpleTimeZoneOps, getZonedDateTimeSlots(this))
    )
  }

  toPlainTime(): PlainTime {
    return createPlainTime(
      zonedDateTimeToPlainTime(createSimpleTimeZoneOps, getZonedDateTimeSlots(this))
    )
  }

  toPlainDateTime(): PlainDateTime {
    return createPlainDateTime(
      zonedDateTimeToPlainDateTime(createSimpleTimeZoneOps, getZonedDateTimeSlots(this))
    )
  }

  toPlainYearMonth(): PlainYearMonth {
    return createPlainYearMonth(
      zonedDateTimeToPlainYearMonth(
        createYearMonthRefineOps,
        getZonedDateTimeSlots(this),
        this as any, // !!!
      )
    )
  }

  toPlainMonthDay(): PlainMonthDay {
    return createPlainMonthDay(
      zonedDateTimeToPlainMonthDay(
        createMonthDayRefineOps,
        getZonedDateTimeSlots(this),
        this as any, // !!!
      )
    )
  }

  getISOFields(): ZonedIsoDateTimeSlots<CalendarSlot, TimeZoneSlot> {
    return getZonedIsoDateTimeSlots(createSimpleTimeZoneOps, getZonedDateTimeSlots(this))
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
    return computeHoursInDay(
      createTimeZoneOps,
      getZonedDateTimeSlots(this),
    )
  }

  get offsetNanoseconds(): number {
    return getOffsetNanoseconds(getZonedDateTimeSlots(this))
  }

  get offset(): string {
    return getOffsetStr(getZonedDateTimeSlots(this))
  }

  get timeZoneId(): string {
    return getId(getZonedDateTimeSlots(this).timeZone)
  }

  static from(arg: any, options?: ZonedFieldOptions) {
    return createZonedDateTime(toZonedDateTimeSlots(arg, options))
  }

  static compare(arg0: ZonedDateTimeArg, arg1: ZonedDateTimeArg): NumSign {
    return compareZonedDateTimes(
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
  options = copyOptions(options)

  if (isObjectlike(arg)) {
    const slots = (getSlots(arg) || {}) as { branding?: string, calendar?: CalendarSlot }

    if (slots.branding === ZonedDateTimeBranding) {
      refineZonedFieldOptions(options) // parse unused options
      return slots as ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>
    }

    const calendarSlot = getCalendarSlotFromBag(arg as any)

    return refineZonedDateTimeBag(
      refineTimeZoneSlot,
      createTimeZoneOps,
      createDateRefineOps(calendarSlot),
      calendarSlot,
      arg as any, // !!!
      options,
    )
  }

  return parseZonedDateTime(arg, options)
}

function getOffsetNanoseconds(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>): number {
  return slotsToIsoFields(slots).offsetNanoseconds
}

function getOffsetStr(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>): string {
  return formatOffsetNano(getOffsetNanoseconds(slots))
}
