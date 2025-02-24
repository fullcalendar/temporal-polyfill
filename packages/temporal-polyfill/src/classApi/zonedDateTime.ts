import {
  ZonedDateTimeBag,
  refineZonedDateTimeBag,
  zonedDateTimeWithFields,
} from '../internal/bagRefine'
import { createNativeStandardOps } from '../internal/calendarNativeQuery'
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
  slotsWithCalendarId,
  slotsWithTimeZoneId,
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
  computeZonedHoursInDay,
  computeZonedStartOfDay,
  roundZonedDateTime,
} from '../internal/round'
import {
  ZonedDateTimeBranding,
  ZonedDateTimeSlots,
  createDurationSlots,
} from '../internal/slots'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
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
  getCalendarIdFromBag,
  refineCalendarArg,
} from './calendarArg'
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
import { TimeZoneArg, refineTimeZoneArg } from './timeZoneArg'

export type ZonedDateTime = any
export type ZonedDateTimeArg = ZonedDateTime | ZonedDateTimeBag | string

export const [ZonedDateTime, createZonedDateTime] = createSlotClass(
  ZonedDateTimeBranding,
  bindArgs(constructZonedDateTimeSlots, refineCalendarArg, refineTimeZoneArg),
  {
    ...epochGetters,
    ...calendarIdGetters,
    ...adaptDateMethods(dateGetters),
    ...adaptDateMethods(timeGetters),
    offset(slots: ZonedDateTimeSlots): string {
      return formatOffsetNano(slotsToIso(slots).offsetNanoseconds)
    },
    offsetNanoseconds(slots: ZonedDateTimeSlots) {
      return slotsToIso(slots).offsetNanoseconds
    },
    timeZoneId(slots: ZonedDateTimeSlots): string {
      return slots.timeZone
    },
    hoursInDay(slots: ZonedDateTimeSlots): number {
      return computeZonedHoursInDay(queryNativeTimeZone, slots)
    },
  },
  {
    getISOFields(slots: ZonedDateTimeSlots): ZonedIsoFields {
      return buildZonedIsoFields(queryNativeTimeZone, slots)
    },
    with(
      slots: ZonedDateTimeSlots,
      mod: DateTimeBag,
      options?: ZonedFieldOptions,
    ): ZonedDateTime {
      return createZonedDateTime(
        zonedDateTimeWithFields(
          createNativeStandardOps,
          queryNativeTimeZone,
          slots,
          this,
          rejectInvalidBag(mod),
          options,
        ),
      )
    },
    withCalendar(
      slots: ZonedDateTimeSlots,
      calendarArg: CalendarArg,
    ): ZonedDateTime {
      return createZonedDateTime(
        slotsWithCalendarId(slots, refineCalendarArg(calendarArg)),
      )
    },
    withTimeZone(
      slots: ZonedDateTimeSlots,
      timeZoneArg: TimeZoneArg,
    ): ZonedDateTime {
      return createZonedDateTime(
        slotsWithTimeZoneId(slots, refineTimeZoneArg(timeZoneArg)),
      )
    },
    withPlainDate(
      slots: ZonedDateTimeSlots,
      plainDateArg: PlainDateArg,
    ): ZonedDateTime {
      return createZonedDateTime(
        zonedDateTimeWithPlainDate(
          queryNativeTimeZone,
          slots,
          toPlainDateSlots(plainDateArg),
        ),
      )
    },
    withPlainTime(
      slots: ZonedDateTimeSlots,
      plainTimeArg?: PlainTimeArg,
    ): ZonedDateTime {
      return createZonedDateTime(
        zonedDateTimeWithPlainTime(
          queryNativeTimeZone,
          slots,
          optionalToPlainTimeFields(plainTimeArg),
        ),
      )
    },
    add(
      slots: ZonedDateTimeSlots,
      durationArg: DurationArg,
      options?: OverflowOptions,
    ): ZonedDateTime {
      return createZonedDateTime(
        moveZonedDateTime(
          createNativeStandardOps,
          queryNativeTimeZone,
          false,
          slots,
          toDurationSlots(durationArg),
          options,
        ),
      )
    },
    subtract(
      slots: ZonedDateTimeSlots,
      durationArg: DurationArg,
      options?: OverflowOptions,
    ): ZonedDateTime {
      return createZonedDateTime(
        moveZonedDateTime(
          createNativeStandardOps,
          queryNativeTimeZone,
          true,
          slots,
          toDurationSlots(durationArg),
          options,
        ),
      )
    },
    until(
      slots: ZonedDateTimeSlots,
      otherArg: ZonedDateTimeArg,
      options?: DiffOptions<UnitName>,
    ): Duration {
      return createDuration(
        createDurationSlots(
          diffZonedDateTimes(
            createNativeStandardOps,
            queryNativeTimeZone,
            false,
            slots,
            toZonedDateTimeSlots(otherArg),
            options,
          ),
        ),
      )
    },
    since(
      slots: ZonedDateTimeSlots,
      otherArg: ZonedDateTimeArg,
      options?: DiffOptions<UnitName>,
    ): Duration {
      return createDuration(
        createDurationSlots(
          diffZonedDateTimes(
            createNativeStandardOps,
            queryNativeTimeZone,
            true,
            slots,
            toZonedDateTimeSlots(otherArg),
            options,
          ),
        ),
      )
    },
    round(
      slots: ZonedDateTimeSlots,
      options: DayTimeUnitName | RoundingOptions<DayTimeUnitName>,
    ): ZonedDateTime {
      return createZonedDateTime(
        roundZonedDateTime(queryNativeTimeZone, slots, options),
      )
    },
    startOfDay(slots: ZonedDateTimeSlots): ZonedDateTime {
      return createZonedDateTime(
        computeZonedStartOfDay(queryNativeTimeZone, slots),
      )
    },
    equals(slots: ZonedDateTimeSlots, otherArg: ZonedDateTimeArg): boolean {
      return zonedDateTimesEqual(slots, toZonedDateTimeSlots(otherArg))
    },
    toInstant(slots: ZonedDateTimeSlots): Instant {
      return createInstant(zonedDateTimeToInstant(slots))
    },
    toPlainDateTime(slots: ZonedDateTimeSlots): PlainDateTime {
      return createPlainDateTime(
        zonedDateTimeToPlainDateTime(queryNativeTimeZone, slots),
      )
    },
    toPlainDate(slots: ZonedDateTimeSlots): PlainDate {
      return createPlainDate(
        zonedDateTimeToPlainDate(queryNativeTimeZone, slots),
      )
    },
    toPlainTime(slots: ZonedDateTimeSlots): PlainTime {
      return createPlainTime(
        zonedDateTimeToPlainTime(queryNativeTimeZone, slots),
      )
    },
    toPlainYearMonth(slots: ZonedDateTimeSlots): PlainYearMonth {
      return createPlainYearMonth(
        zonedDateTimeToPlainYearMonth(createNativeStandardOps, slots, this),
      )
    },
    toPlainMonthDay(slots: ZonedDateTimeSlots): PlainMonthDay {
      return createPlainMonthDay(
        zonedDateTimeToPlainMonthDay(createNativeStandardOps, slots, this),
      )
    },
    toLocaleString(
      slots: ZonedDateTimeSlots,
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
      slots: ZonedDateTimeSlots,
      options?: ZonedDateTimeDisplayOptions,
    ): string {
      return formatZonedDateTimeIso(queryNativeTimeZone, slots, options)
    },
    toJSON(slots: ZonedDateTimeSlots): string {
      return formatZonedDateTimeIso(queryNativeTimeZone, slots)
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
): ZonedDateTimeSlots {
  options = copyOptions(options)

  if (isObjectLike(arg)) {
    const slots = getSlots(arg)

    if (slots && slots.branding === ZonedDateTimeBranding) {
      refineZonedFieldOptions(options) // parse unused options
      return slots as ZonedDateTimeSlots
    }

    const calendarId = getCalendarIdFromBag(arg as any)

    return refineZonedDateTimeBag(
      refineTimeZoneArg,
      queryNativeTimeZone,
      createNativeStandardOps(calendarId),
      calendarId,
      arg as any, // !!!
      options,
    )
  }

  return parseZonedDateTime(arg, options)
}

function adaptDateMethods(methods: any) {
  return mapProps((method: any) => {
    return (slots: ZonedDateTimeSlots) => {
      return method(slotsToIso(slots))
    }
  }, methods)
}

function slotsToIso(slots: ZonedDateTimeSlots): FixedIsoFields {
  return zonedEpochSlotsToIso(slots, queryNativeTimeZone)
}
