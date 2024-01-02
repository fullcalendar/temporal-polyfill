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
import { NumSign, bindArgs, isObjectlike, mapProps } from '../internal/utils'
import { IsoDateTimeFields } from '../internal/calendarIsoFields'
import { ZonedIsoDateTimeSlots, computeHoursInDay, computeStartOfDay, getZonedIsoDateTimeSlots, zonedInternalsToIso } from '../internal/timeZoneOps'
import { ZonedDateTimeBranding, ZonedDateTimeSlots, createDurationSlots, getId } from '../internal/slots'
import { createSlotClass, createViaSlots, getSlots, getSpecificSlots, rejectInvalidBag, setSlots } from './slotsForClasses'
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
import { neverValueOf, dateGetters, timeGetters, epochGetters, getCalendarFromSlots } from './mixins'
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

export type ZonedDateTime = any
export type ZonedDateTimeArg = ZonedDateTime | ZonedDateTimeBag<CalendarArg, TimeZoneArg> | string

export const ZonedDateTime = createSlotClass(
  ZonedDateTimeBranding,
  bindArgs(constructZonedDateTimeSlots, refineCalendarSlot, refineTimeZoneSlot),
  {
    calendarId(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>): string {
      return getId(slots.calendar)
    },
    hoursInDay(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>): number {
      return computeHoursInDay(createTimeZoneOps, slots)
    },
    offsetNanoseconds(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>): number {
      return getOffsetNanoseconds(slots)
    },
    offset(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>): string {
      return getOffsetStr(slots)
    },
    timeZoneId(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>): string {
      return getId(slots.timeZone)
    },
    ...adaptToIsoFields(dateGetters),
    ...adaptToIsoFields(timeGetters),
    ...epochGetters,
  },
  {
    with(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>, mod: DateTimeBag, options?: ZonedFieldOptions): ZonedDateTime {
      return createZonedDateTime(
        zonedDateTimeWithFields(createDateModOps, createTimeZoneOps, slots, this, rejectInvalidBag(mod), options),
      )
    },
    withPlainTime(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>, plainTimeArg?: PlainTimeArg): ZonedDateTime {
      return createZonedDateTime(
        zonedDateTimeWithPlainTime(createTimeZoneOps, slots, optionalToPlainTimeFields(plainTimeArg))
      )
    },
    withPlainDate(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>, plainDateArg: PlainDateArg): ZonedDateTime {
      return createZonedDateTime(
        zonedDateTimeWithPlainDate(createTimeZoneOps, slots, toPlainDateSlots(plainDateArg))
      )
    },
    withTimeZone(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>, timeZoneArg: TimeZoneArg): ZonedDateTime {
      return createZonedDateTime(
        slotsWithTimeZone(slots, refineTimeZoneSlot(timeZoneArg))
      )
    },
    withCalendar(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>, calendarArg: CalendarArg): ZonedDateTime {
      return createZonedDateTime(
        slotsWithCalendar(slots, refineCalendarSlot(calendarArg))
      )
    },
    add(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>, durationArg: DurationArg, options?: OverflowOptions): ZonedDateTime {
      return createZonedDateTime(
        moveZonedDateTime(
          createMoveOps,
          createTimeZoneOps,
          false,
          slots,
          toDurationSlots(durationArg),
          options,
        )
      )
    },
    subtract(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>, durationArg: DurationArg, options?: OverflowOptions): ZonedDateTime {
      return createZonedDateTime(
        moveZonedDateTime(
          createMoveOps,
          createTimeZoneOps,
          true,
          slots,
          toDurationSlots(durationArg),
          options,
        )
      )
    },
    until(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>, otherArg: ZonedDateTimeArg, options?: DiffOptions): Duration {
      return createDuration(
        createDurationSlots(
          diffZonedDateTimes(
            createDiffOps,
            createTimeZoneOps,
            slots,
            toZonedDateTimeSlots(otherArg),
            options,
          ),
        )
      )
    },
    since(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>, otherArg: ZonedDateTimeArg, options?: DiffOptions): Duration {
      return createDuration(
        createDurationSlots(
          diffZonedDateTimes(
            createDiffOps,
            createTimeZoneOps,
            slots,
            toZonedDateTimeSlots(otherArg),
            options,
            true,
          ),
        )
      )
    },
    round(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>, options: RoundingOptions | UnitName): ZonedDateTime {
      return createZonedDateTime(
        roundZonedDateTime(createTimeZoneOps, slots, options)
      )
    },
    startOfDay(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>): ZonedDateTime {
      return createZonedDateTime(
        computeStartOfDay(createTimeZoneOps, slots)
      )
    },
    equals(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>, otherArg: ZonedDateTimeArg): boolean {
      return zonedDateTimesEqual(slots, toZonedDateTimeSlots(otherArg))
    },
    toString(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>, options?: ZonedDateTimeDisplayOptions): string {
      return formatZonedDateTimeIso(createSimpleTimeZoneOps, slots, options)
    },
    toJSON(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>): string {
      return formatZonedDateTimeIso(createSimpleTimeZoneOps, slots)
    },
    toLocaleString(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>, locales: LocalesArg, options: Intl.DateTimeFormatOptions = {}): string {
      const [format, epochMilli] = prepZonedDateTimeFormat(locales, options, slots)
      return format.format(epochMilli)
    },
    toInstant(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>): Instant {
      return createInstant(
        zonedDateTimeToInstant(slots)
      )
    },
    toPlainDate(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>): PlainDate {
      return createPlainDate(
        zonedDateTimeToPlainDate(createSimpleTimeZoneOps, slots)
      )
    },
    toPlainTime(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>): PlainTime {
      return createPlainTime(
        zonedDateTimeToPlainTime(createSimpleTimeZoneOps, slots)
      )
    },
    toPlainDateTime(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>): PlainDateTime {
      return createPlainDateTime(
        zonedDateTimeToPlainDateTime(createSimpleTimeZoneOps, slots)
      )
    },
    toPlainYearMonth(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>): PlainYearMonth {
      return createPlainYearMonth(
        zonedDateTimeToPlainYearMonth(createYearMonthRefineOps, slots, this)
      )
    },
    toPlainMonthDay(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>): PlainMonthDay {
      return createPlainMonthDay(
        zonedDateTimeToPlainMonthDay(createMonthDayRefineOps, slots, this)
      )
    },
    getISOFields(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>): ZonedIsoDateTimeSlots<CalendarSlot, TimeZoneSlot> {
      return getZonedIsoDateTimeSlots(createSimpleTimeZoneOps, slots)
    },
    getCalendar: getCalendarFromSlots,
    getTimeZone({ timeZone }: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>): TimeZoneProtocol {
      return typeof timeZone === 'string'
        ? new TimeZone(timeZone)
        : timeZone
    },
    valueOf: neverValueOf,
  },
  {
    from(arg: any, options?: ZonedFieldOptions) {
      return createZonedDateTime(toZonedDateTimeSlots(arg, options))
    },
    compare(arg0: ZonedDateTimeArg, arg1: ZonedDateTimeArg): NumSign {
      return compareZonedDateTimes(
        toZonedDateTimeSlots(arg0),
        toZonedDateTimeSlots(arg1),
      )
    }
  }
)

function adaptToIsoFields(methods: any) {
  return mapProps(
    (method: any) => {
      return (slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>) => {
        return method(slotsToIsoFields(slots))
      }
    },
    methods,
  )
}

function slotsToIsoFields(
  slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>
): IsoDateTimeFields & { offsetNanoseconds: number, calendar: CalendarSlot } {
  const timeZoneNative = createSimpleTimeZoneOps(slots.timeZone)
  return {
    ...zonedInternalsToIso(slots, timeZoneNative),
    calendar: slots.calendar, // TODO: have zonedInternalsToIso do this?
  }
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
    const slots = getSlots(arg)

    if (slots && slots.branding === ZonedDateTimeBranding) {
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
