import {
  ZonedDateTimeBag,
  refineZonedDateTimeBag,
  zonedDateTimeWithFields,
} from '../internal/bagRefine'
import { compareZonedDateTimes, zonedDateTimesEqual } from '../internal/compare'
import { constructZonedDateTimeSlots } from '../internal/construct'
import {
  zonedDateTimeToInstant,
  zonedDateTimeToPlainDate,
  zonedDateTimeToPlainDateTime,
  zonedDateTimeToPlainMonthDay,
  zonedDateTimeToPlainTime,
  zonedDateTimeToPlainYearMonth,
} from '../internal/convert'
import { diffZonedDateTimes } from '../internal/diff'
import { DateTimeBag } from '../internal/fields'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatOffsetNano, formatZonedDateTimeIso } from '../internal/isoFormat'
import { parseZonedDateTime } from '../internal/isoParse'
import {
  slotsWithCalendar,
  slotsWithTimeZone,
  zonedDateTimeWithPlainDate,
  zonedDateTimeWithPlainTime,
} from '../internal/modify'
import { moveZonedDateTime } from '../internal/move'
import {
  DiffOptions,
  OverflowOptions,
  RoundingOptions,
  ZonedDateTimeDisplayOptions,
  ZonedFieldOptions,
  copyOptions,
  refineZonedFieldOptions,
} from '../internal/optionsRefine'
import {
  computeDayFloor,
  computeZonedEdge,
  computeZonedHoursInDay,
  roundZonedDateTime,
} from '../internal/round'
import {
  ZonedDateTimeBranding,
  ZonedDateTimeSlots,
  createDurationSlots,
  getId,
} from '../internal/slots'
import {
  FixedIsoFields,
  ZonedIsoFields,
  buildZonedIsoFields,
  zonedEpochSlotsToIso,
} from '../internal/timeZoneOps'
import { DayTimeUnitName, UnitName } from '../internal/units'
import { NumberSign, bindArgs, isObjectLike, mapProps } from '../internal/utils'
import {
  CalendarArg,
  CalendarSlot,
  getCalendarSlotFromBag,
  refineCalendarSlot,
} from './calendar'
import {
  createDateModOps,
  createDateRefineOps,
  createDiffOps,
  createMonthDayRefineOps,
  createMoveOps,
  createYearMonthRefineOps,
} from './calendarOpsQuery'
import {
  Duration,
  DurationArg,
  createDuration,
  toDurationSlots,
} from './duration'
import { Instant, createInstant } from './instant'
import { prepZonedDateTimeFormat } from './intlFormatConfig'
import {
  calendarIdGetters,
  createCalendarFromSlots,
  dateGetters,
  epochGetters,
  neverValueOf,
  timeGetters,
} from './mixins'
import {
  PlainDate,
  PlainDateArg,
  createPlainDate,
  toPlainDateSlots,
} from './plainDate'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import {
  PlainTime,
  PlainTimeArg,
  createPlainTime,
  optionalToPlainTimeFields,
} from './plainTime'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { createSlotClass, getSlots, rejectInvalidBag } from './slotClass'
import {
  TimeZone,
  TimeZoneArg,
  TimeZoneProtocol,
  TimeZoneSlot,
  refineTimeZoneSlot,
} from './timeZone'
import { createTimeZoneOffsetOps, createTimeZoneOps } from './timeZoneOpsQuery'

export type ZonedDateTime = any
export type ZonedDateTimeArg =
  | ZonedDateTime
  | ZonedDateTimeBag<CalendarArg, TimeZoneArg>
  | string

export const [ZonedDateTime, createZonedDateTime] = createSlotClass(
  ZonedDateTimeBranding,
  bindArgs(constructZonedDateTimeSlots, refineCalendarSlot, refineTimeZoneSlot),
  {
    ...epochGetters,
    ...calendarIdGetters,
    ...adaptDateMethods(dateGetters),
    ...adaptDateMethods(timeGetters),
    offset(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>): string {
      return formatOffsetNano(slotsToIso(slots).offsetNanoseconds)
    },
    offsetNanoseconds(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>) {
      return slotsToIso(slots).offsetNanoseconds
    },
    timeZoneId(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>): string {
      return getId(slots.timeZone)
    },
    hoursInDay(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>): number {
      return computeZonedHoursInDay(createTimeZoneOps, slots)
    },
  },
  {
    getISOFields(
      slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>,
    ): ZonedIsoFields<CalendarSlot, TimeZoneSlot> {
      return buildZonedIsoFields(createTimeZoneOffsetOps, slots)
    },
    getCalendar: createCalendarFromSlots,
    getTimeZone({
      timeZone,
    }: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>): TimeZoneProtocol {
      return typeof timeZone === 'string' ? new TimeZone(timeZone) : timeZone
    },
    with(
      slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>,
      mod: DateTimeBag,
      options?: ZonedFieldOptions,
    ): ZonedDateTime {
      return createZonedDateTime(
        zonedDateTimeWithFields(
          createDateModOps,
          createTimeZoneOps,
          slots,
          this,
          rejectInvalidBag(mod),
          options,
        ),
      )
    },
    withCalendar(
      slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>,
      calendarArg: CalendarArg,
    ): ZonedDateTime {
      return createZonedDateTime(
        slotsWithCalendar(slots, refineCalendarSlot(calendarArg)),
      )
    },
    withTimeZone(
      slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>,
      timeZoneArg: TimeZoneArg,
    ): ZonedDateTime {
      return createZonedDateTime(
        slotsWithTimeZone(slots, refineTimeZoneSlot(timeZoneArg)),
      )
    },
    withPlainDate(
      slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>,
      plainDateArg: PlainDateArg,
    ): ZonedDateTime {
      return createZonedDateTime(
        zonedDateTimeWithPlainDate(
          createTimeZoneOps,
          slots,
          toPlainDateSlots(plainDateArg),
        ),
      )
    },
    withPlainTime(
      slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>,
      plainTimeArg?: PlainTimeArg,
    ): ZonedDateTime {
      return createZonedDateTime(
        zonedDateTimeWithPlainTime(
          createTimeZoneOps,
          slots,
          optionalToPlainTimeFields(plainTimeArg),
        ),
      )
    },
    add(
      slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>,
      durationArg: DurationArg,
      options?: OverflowOptions,
    ): ZonedDateTime {
      return createZonedDateTime(
        moveZonedDateTime(
          createMoveOps,
          createTimeZoneOps,
          false,
          slots,
          toDurationSlots(durationArg),
          options,
        ),
      )
    },
    subtract(
      slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>,
      durationArg: DurationArg,
      options?: OverflowOptions,
    ): ZonedDateTime {
      return createZonedDateTime(
        moveZonedDateTime(
          createMoveOps,
          createTimeZoneOps,
          true,
          slots,
          toDurationSlots(durationArg),
          options,
        ),
      )
    },
    until(
      slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>,
      otherArg: ZonedDateTimeArg,
      options?: DiffOptions<UnitName>,
    ): Duration {
      return createDuration(
        createDurationSlots(
          diffZonedDateTimes(
            createDiffOps,
            createTimeZoneOps,
            false,
            slots,
            toZonedDateTimeSlots(otherArg),
            options,
          ),
        ),
      )
    },
    since(
      slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>,
      otherArg: ZonedDateTimeArg,
      options?: DiffOptions<UnitName>,
    ): Duration {
      return createDuration(
        createDurationSlots(
          diffZonedDateTimes(
            createDiffOps,
            createTimeZoneOps,
            true,
            slots,
            toZonedDateTimeSlots(otherArg),
            options,
          ),
        ),
      )
    },
    round(
      slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>,
      options: DayTimeUnitName | RoundingOptions<DayTimeUnitName>,
    ): ZonedDateTime {
      return createZonedDateTime(
        roundZonedDateTime(createTimeZoneOps, slots, options),
      )
    },
    startOfDay(
      slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>,
    ): ZonedDateTime {
      return createZonedDateTime(
        computeZonedEdge(createTimeZoneOps, computeDayFloor, slots),
      )
    },
    equals(
      slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>,
      otherArg: ZonedDateTimeArg,
    ): boolean {
      return zonedDateTimesEqual(slots, toZonedDateTimeSlots(otherArg))
    },
    toInstant(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>): Instant {
      return createInstant(zonedDateTimeToInstant(slots))
    },
    toPlainDateTime(
      slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>,
    ): PlainDateTime {
      return createPlainDateTime(
        zonedDateTimeToPlainDateTime(createTimeZoneOffsetOps, slots),
      )
    },
    toPlainDate(
      slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>,
    ): PlainDate {
      return createPlainDate(
        zonedDateTimeToPlainDate(createTimeZoneOffsetOps, slots),
      )
    },
    toPlainTime(
      slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>,
    ): PlainTime {
      return createPlainTime(
        zonedDateTimeToPlainTime(createTimeZoneOffsetOps, slots),
      )
    },
    toPlainYearMonth(
      slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>,
    ): PlainYearMonth {
      return createPlainYearMonth(
        zonedDateTimeToPlainYearMonth(createYearMonthRefineOps, slots, this),
      )
    },
    toPlainMonthDay(
      slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>,
    ): PlainMonthDay {
      return createPlainMonthDay(
        zonedDateTimeToPlainMonthDay(createMonthDayRefineOps, slots, this),
      )
    },
    toLocaleString(
      slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>,
      locales: LocalesArg,
      options: Intl.DateTimeFormatOptions = {},
    ): string {
      const [format, epochMilli] = prepZonedDateTimeFormat(
        locales,
        options,
        slots,
      )
      return format.format(epochMilli)
    },
    toString(
      slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>,
      options?: ZonedDateTimeDisplayOptions,
    ): string {
      return formatZonedDateTimeIso(createTimeZoneOffsetOps, slots, options)
    },
    toJSON(slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>): string {
      return formatZonedDateTimeIso(createTimeZoneOffsetOps, slots)
    },
    valueOf: neverValueOf,
  },
  {
    from(arg: any, options?: ZonedFieldOptions) {
      return createZonedDateTime(toZonedDateTimeSlots(arg, options))
    },
    compare(arg0: ZonedDateTimeArg, arg1: ZonedDateTimeArg): NumberSign {
      return compareZonedDateTimes(
        toZonedDateTimeSlots(arg0),
        toZonedDateTimeSlots(arg1),
      )
    },
  },
)

// Utils
// -----------------------------------------------------------------------------

export function toZonedDateTimeSlots(
  arg: ZonedDateTimeArg,
  options?: ZonedFieldOptions,
): ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot> {
  options = copyOptions(options)

  if (isObjectLike(arg)) {
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

function adaptDateMethods(methods: any) {
  return mapProps((method: any) => {
    return (slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>) => {
      return method(slotsToIso(slots))
    }
  }, methods)
}

function slotsToIso(
  slots: ZonedDateTimeSlots<CalendarSlot, TimeZoneSlot>,
): FixedIsoFields<CalendarSlot> {
  return zonedEpochSlotsToIso(slots, createTimeZoneOffsetOps)
}
