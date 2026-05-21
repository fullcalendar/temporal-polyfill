import { ZonedDateTimeBranding } from '../../apiHelpers/branding'
import {
  calendarIdGetters,
  dateGetters,
  epochGetters,
  timeGetters,
} from '../../apiHelpers/mixins'
import {
  createSlotClass,
  getBrandingAndSlots,
  rejectInvalidBag,
} from '../../apiHelpers/slotClass'
import { CalendarSlot } from '../../internal/calendarSlot'
import {
  compareZonedDateTimes,
  zonedDateTimesEqual,
} from '../../internal/compare'
import { constructZonedEpochNanoSlots } from '../../internal/construct'
import {
  zonedDateTimeToInstant,
  zonedDateTimeToPlainDate,
  zonedDateTimeToPlainDateTime,
  zonedDateTimeToPlainTime,
} from '../../internal/convert'
import { refineZonedDateTimeObjectLike } from '../../internal/createFromFields'
import { diffZonedDateTimes, getCommonCalendar } from '../../internal/diff'
import { ZonedDateTimeLikeObject } from '../../internal/fieldTypes'
import { DateTimeFields } from '../../internal/fieldTypes'
import { LocalesArg } from '../../internal/intlFormatUtils'
import {
  formatOffsetNano,
  formatZonedDateTimeIso,
} from '../../internal/isoFormat'
import { parseZonedDateTime } from '../../internal/isoParse'
import { mergeZonedDateTimeFields } from '../../internal/merge'
import { zonedDateTimeWithPlainTime } from '../../internal/modify'
import { moveZonedDateTime } from '../../internal/move'
import { refineZonedFieldOptions } from '../../internal/optionsFieldRefine'
import {
  DiffOptions,
  DirectionName,
  DirectionOptions,
  OverflowOptions,
  RoundingOptions,
  ZonedFieldOptions,
} from '../../internal/optionsModel'
import {
  computeZonedHoursInDay,
  computeZonedStartOfDay,
  roundZonedDateTime,
} from '../../internal/round'
import { ZonedEpochNanoFields, createDurationSlots } from '../../internal/slots'
import { queryTimeZone } from '../../internal/timeZone'
import {
  getTimeZoneTransitionEpochNanoseconds,
  zonedEpochSlotsToIso,
} from '../../internal/timeZoneMath'
import { DayTimeUnitName, UnitName } from '../../internal/units'
import {
  NumberSign,
  bindArgs,
  isObjectLike,
  mapProps,
} from '../../internal/utils'
import { prepZonedDateTimeFormat } from '../intlFormatConfig'
import { TimeZoneArg, refineTimeZoneArg } from '../timeZoneArg'
import {
  CalendarArg,
  getCalendarFromBag,
  refineCalendarArg,
} from './calendarArg'
import { resolveAnyCalendar, resolveAnyCalendarArg } from './calendarResolve'
import {
  Duration,
  DurationArg,
  createDuration,
  toDurationSlots,
} from './duration'
import { Instant, createInstant } from './instant'
import { PlainDate, createPlainDate } from './plainDate'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import {
  PlainTime,
  PlainTimeArg,
  createPlainTime,
  optionalToPlainTimeFields,
} from './plainTime'

export type ZonedDateTime = any
export type ZonedDateTimeArg = ZonedDateTime | ZonedDateTimeLikeObject | string

export const [ZonedDateTime, createZonedDateTime] = createSlotClass(
  ZonedDateTimeBranding,
  bindArgs(constructZonedEpochNanoSlots, resolveAnyCalendarArg),
  formatZonedDateTimeIso,
  {
    ...epochGetters,
    ...calendarIdGetters,
    ...adaptDateMethods(dateGetters),
    ...adaptDateMethods(timeGetters),
    offset(slots: ZonedEpochNanoFields & { calendar: CalendarSlot }): string {
      return formatOffsetNano(zonedEpochSlotsToIso(slots).offsetNanoseconds)
    },
    offsetNanoseconds(
      slots: ZonedEpochNanoFields & { calendar: CalendarSlot },
    ) {
      return zonedEpochSlotsToIso(slots).offsetNanoseconds
    },
    timeZoneId(
      slots: ZonedEpochNanoFields & { calendar: CalendarSlot },
    ): string {
      return slots.timeZone.id
    },
    hoursInDay(
      slots: ZonedEpochNanoFields & { calendar: CalendarSlot },
    ): number {
      return computeZonedHoursInDay(slots)
    },
  },
  {
    with(
      slots: ZonedEpochNanoFields & { calendar: CalendarSlot },
      mod: Partial<DateTimeFields>,
      options?: ZonedFieldOptions,
    ): ZonedDateTime {
      return createZonedDateTime(
        mergeZonedDateTimeFields(slots, rejectInvalidBag(mod), options),
      )
    },
    withCalendar(
      slots: ZonedEpochNanoFields & { calendar: CalendarSlot },
      calendarArg: CalendarArg,
    ): ZonedDateTime {
      return createZonedDateTime({
        ...slots,
        calendar: refineCalendarArg(calendarArg),
      })
    },
    withTimeZone(
      slots: ZonedEpochNanoFields & { calendar: CalendarSlot },
      timeZoneArg: TimeZoneArg,
    ): ZonedDateTime {
      return createZonedDateTime({
        ...slots,
        timeZone: queryTimeZone(refineTimeZoneArg(timeZoneArg)),
      })
    },
    withPlainTime(
      slots: ZonedEpochNanoFields & { calendar: CalendarSlot },
      plainTimeArg?: PlainTimeArg,
    ): ZonedDateTime {
      return createZonedDateTime(
        zonedDateTimeWithPlainTime(
          slots,
          optionalToPlainTimeFields(plainTimeArg),
        ),
      )
    },
    add(
      slots: ZonedEpochNanoFields & { calendar: CalendarSlot },
      durationArg: DurationArg,
      options?: OverflowOptions,
    ): ZonedDateTime {
      return createZonedDateTime(
        moveZonedDateTime(false, slots, toDurationSlots(durationArg), options),
      )
    },
    subtract(
      slots: ZonedEpochNanoFields & { calendar: CalendarSlot },
      durationArg: DurationArg,
      options?: OverflowOptions,
    ): ZonedDateTime {
      return createZonedDateTime(
        moveZonedDateTime(true, slots, toDurationSlots(durationArg), options),
      )
    },
    until(
      slots: ZonedEpochNanoFields & { calendar: CalendarSlot },
      otherArg: ZonedDateTimeArg,
      options?: DiffOptions<UnitName>,
    ): Duration {
      const other = toZonedDateTimeSlots(otherArg)
      const calendar = getCommonCalendar(slots.calendar, other.calendar)
      return createDuration(
        createDurationSlots(
          diffZonedDateTimes(false, calendar, slots, other, options),
        ),
      )
    },
    since(
      slots: ZonedEpochNanoFields & { calendar: CalendarSlot },
      otherArg: ZonedDateTimeArg,
      options?: DiffOptions<UnitName>,
    ): Duration {
      const other = toZonedDateTimeSlots(otherArg)
      const calendar = getCommonCalendar(slots.calendar, other.calendar)
      return createDuration(
        createDurationSlots(
          diffZonedDateTimes(true, calendar, slots, other, options),
        ),
      )
    },
    round(
      slots: ZonedEpochNanoFields & { calendar: CalendarSlot },
      options: DayTimeUnitName | RoundingOptions<DayTimeUnitName>,
    ): ZonedDateTime {
      return createZonedDateTime(roundZonedDateTime(slots, options))
    },
    startOfDay(
      slots: ZonedEpochNanoFields & { calendar: CalendarSlot },
    ): ZonedDateTime {
      return createZonedDateTime(computeZonedStartOfDay(slots))
    },
    equals(
      slots: ZonedEpochNanoFields & { calendar: CalendarSlot },
      otherArg: ZonedDateTimeArg,
    ): boolean {
      return zonedDateTimesEqual(slots, toZonedDateTimeSlots(otherArg))
    },
    toInstant(
      slots: ZonedEpochNanoFields & { calendar: CalendarSlot },
    ): Instant {
      return createInstant(zonedDateTimeToInstant(slots))
    },
    toPlainDateTime(
      slots: ZonedEpochNanoFields & { calendar: CalendarSlot },
    ): PlainDateTime {
      return createPlainDateTime(zonedDateTimeToPlainDateTime(slots))
    },
    toPlainDate(
      slots: ZonedEpochNanoFields & { calendar: CalendarSlot },
    ): PlainDate {
      return createPlainDate(zonedDateTimeToPlainDate(slots))
    },
    toPlainTime(
      slots: ZonedEpochNanoFields & { calendar: CalendarSlot },
    ): PlainTime {
      return createPlainTime(zonedDateTimeToPlainTime(slots))
    },
    toLocaleString(
      slots: ZonedEpochNanoFields & { calendar: CalendarSlot },
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
    toString: formatZonedDateTimeIso,
    getTimeZoneTransition(
      slots: ZonedEpochNanoFields & { calendar: CalendarSlot },
      options: DirectionOptions | DirectionName,
    ): ZonedDateTime | null {
      const newEpochNano = getTimeZoneTransitionEpochNanoseconds(slots, options)

      if (newEpochNano) {
        return createZonedDateTime({
          ...slots,
          epochNanoseconds: newEpochNano,
        })
      }

      return null
    },
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
): ZonedEpochNanoFields & { calendar: CalendarSlot } {
  if (isObjectLike(arg)) {
    const brandingAndSlots = getBrandingAndSlots(arg)

    if (brandingAndSlots && brandingAndSlots[0] === ZonedDateTimeBranding) {
      refineZonedFieldOptions(options) // parse unused options
      return brandingAndSlots[1] as ZonedEpochNanoFields & {
        calendar: CalendarSlot
      }
    }

    const calendar = getCalendarFromBag(arg as any)

    return refineZonedDateTimeObjectLike(
      refineTimeZoneArg,
      calendar,
      arg as any, // !!!
      options,
    )
  }

  return parseZonedDateTime(arg, resolveAnyCalendar, options)
}

function adaptDateMethods(methods: any) {
  return mapProps((method: any) => {
    return (slots: ZonedEpochNanoFields & { calendar: CalendarSlot }) => {
      return method(zonedEpochSlotsToIso(slots))
    }
  }, methods)
}
