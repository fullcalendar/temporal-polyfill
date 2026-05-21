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
import {
  resolveCoreCalendar,
  resolveCoreCalendarArg,
} from '../../internal/calendarResolver'
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
import { InternalCalendar } from '../../internal/externalCalendar'
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
import { queryTimeZone } from '../../internal/timeZoneImpl'
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
  bindArgs(constructZonedEpochNanoSlots, resolveCoreCalendarArg),
  formatZonedDateTimeIso,
  {
    ...epochGetters,
    ...calendarIdGetters,
    ...adaptDateMethods(dateGetters),
    ...adaptDateMethods(timeGetters),
    offset(
      slots: ZonedEpochNanoFields & { calendar: InternalCalendar },
    ): string {
      return formatOffsetNano(zonedEpochSlotsToIso(slots).offsetNanoseconds)
    },
    offsetNanoseconds(
      slots: ZonedEpochNanoFields & { calendar: InternalCalendar },
    ) {
      return zonedEpochSlotsToIso(slots).offsetNanoseconds
    },
    timeZoneId(
      slots: ZonedEpochNanoFields & { calendar: InternalCalendar },
    ): string {
      return slots.timeZone.id
    },
    hoursInDay(
      slots: ZonedEpochNanoFields & { calendar: InternalCalendar },
    ): number {
      return computeZonedHoursInDay(slots)
    },
  },
  {
    with(
      slots: ZonedEpochNanoFields & { calendar: InternalCalendar },
      mod: Partial<DateTimeFields>,
      options?: ZonedFieldOptions,
    ): ZonedDateTime {
      return createZonedDateTime(
        mergeZonedDateTimeFields(slots, rejectInvalidBag(mod), options),
      )
    },
    withCalendar(
      slots: ZonedEpochNanoFields & { calendar: InternalCalendar },
      calendarArg: CalendarArg,
    ): ZonedDateTime {
      return createZonedDateTime({
        ...slots,
        calendar: refineCalendarArg(calendarArg),
      })
    },
    withTimeZone(
      slots: ZonedEpochNanoFields & { calendar: InternalCalendar },
      timeZoneArg: TimeZoneArg,
    ): ZonedDateTime {
      return createZonedDateTime({
        ...slots,
        timeZone: queryTimeZone(refineTimeZoneArg(timeZoneArg)),
      })
    },
    withPlainTime(
      slots: ZonedEpochNanoFields & { calendar: InternalCalendar },
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
      slots: ZonedEpochNanoFields & { calendar: InternalCalendar },
      durationArg: DurationArg,
      options?: OverflowOptions,
    ): ZonedDateTime {
      return createZonedDateTime(
        moveZonedDateTime(false, slots, toDurationSlots(durationArg), options),
      )
    },
    subtract(
      slots: ZonedEpochNanoFields & { calendar: InternalCalendar },
      durationArg: DurationArg,
      options?: OverflowOptions,
    ): ZonedDateTime {
      return createZonedDateTime(
        moveZonedDateTime(true, slots, toDurationSlots(durationArg), options),
      )
    },
    until(
      slots: ZonedEpochNanoFields & { calendar: InternalCalendar },
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
      slots: ZonedEpochNanoFields & { calendar: InternalCalendar },
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
      slots: ZonedEpochNanoFields & { calendar: InternalCalendar },
      options: DayTimeUnitName | RoundingOptions<DayTimeUnitName>,
    ): ZonedDateTime {
      return createZonedDateTime(roundZonedDateTime(slots, options))
    },
    startOfDay(
      slots: ZonedEpochNanoFields & { calendar: InternalCalendar },
    ): ZonedDateTime {
      return createZonedDateTime(computeZonedStartOfDay(slots))
    },
    equals(
      slots: ZonedEpochNanoFields & { calendar: InternalCalendar },
      otherArg: ZonedDateTimeArg,
    ): boolean {
      return zonedDateTimesEqual(slots, toZonedDateTimeSlots(otherArg))
    },
    toInstant(
      slots: ZonedEpochNanoFields & { calendar: InternalCalendar },
    ): Instant {
      return createInstant(zonedDateTimeToInstant(slots))
    },
    toPlainDateTime(
      slots: ZonedEpochNanoFields & { calendar: InternalCalendar },
    ): PlainDateTime {
      return createPlainDateTime(zonedDateTimeToPlainDateTime(slots))
    },
    toPlainDate(
      slots: ZonedEpochNanoFields & { calendar: InternalCalendar },
    ): PlainDate {
      return createPlainDate(zonedDateTimeToPlainDate(slots))
    },
    toPlainTime(
      slots: ZonedEpochNanoFields & { calendar: InternalCalendar },
    ): PlainTime {
      return createPlainTime(zonedDateTimeToPlainTime(slots))
    },
    toLocaleString(
      slots: ZonedEpochNanoFields & { calendar: InternalCalendar },
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
    getTimeZoneTransition(
      slots: ZonedEpochNanoFields & { calendar: InternalCalendar },
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
): ZonedEpochNanoFields & { calendar: InternalCalendar } {
  if (isObjectLike(arg)) {
    const brandingAndSlots = getBrandingAndSlots(arg)

    if (brandingAndSlots && brandingAndSlots[0] === ZonedDateTimeBranding) {
      refineZonedFieldOptions(options) // parse unused options
      return brandingAndSlots[1] as ZonedEpochNanoFields & {
        calendar: InternalCalendar
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

  return parseZonedDateTime(arg, resolveCoreCalendar, options)
}

function adaptDateMethods(methods: any) {
  return mapProps((method: any) => {
    return (slots: ZonedEpochNanoFields & { calendar: InternalCalendar }) => {
      return method(zonedEpochSlotsToIso(slots))
    }
  }, methods)
}
