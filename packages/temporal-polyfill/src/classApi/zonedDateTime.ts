import { compareZonedDateTimes, zonedDateTimesEqual } from '../internal/compare'
import { constructZonedDateTimeSlots } from '../internal/construct'
import {
  zonedDateTimeToInstant,
  zonedDateTimeToPlainDate,
  zonedDateTimeToPlainDateTime,
  zonedDateTimeToPlainTime,
} from '../internal/convert'
import { refineZonedDateTimeObjectLike } from '../internal/createFromFields'
import { diffZonedDateTimes, getCommonCalendar } from '../internal/diff'
import { getInternalCalendar } from '../internal/externalCalendar'
import { ZonedDateTimeLikeObject } from '../internal/fieldTypes'
import { DateTimeFields } from '../internal/fieldTypes'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatOffsetNano, formatZonedDateTimeIso } from '../internal/isoFormat'
import { parseZonedDateTime } from '../internal/isoParse'
import { mergeZonedDateTimeFields } from '../internal/merge'
import { zonedDateTimeWithPlainTime } from '../internal/modify'
import { moveZonedDateTime } from '../internal/move'
import { refineZonedFieldOptions } from '../internal/optionsFieldRefine'
import {
  DiffOptions,
  DirectionName,
  DirectionOptions,
  OverflowOptions,
  RoundingOptions,
  ZonedFieldOptions,
} from '../internal/optionsModel'
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
import { queryTimeZone } from '../internal/timeZoneImpl'
import {
  FixedIsoZonedFields,
  getTimeZoneTransitionEpochNanoseconds,
  zonedEpochSlotsToIso,
} from '../internal/timeZoneMath'
import { DayTimeUnitName, UnitName } from '../internal/units'
import { NumberSign, isObjectLike, mapProps } from '../internal/utils'
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
  timeGetters,
} from './mixins'
import { PlainDate, createPlainDate } from './plainDate'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import {
  PlainTime,
  PlainTimeArg,
  createPlainTime,
  optionalToPlainTimeFields,
} from './plainTime'
import { createSlotClass, getSlots, rejectInvalidBag } from './slotClass'
import { TimeZoneArg, refineTimeZoneArg } from './timeZoneArg'

export type ZonedDateTime = any
export type ZonedDateTimeArg = ZonedDateTime | ZonedDateTimeLikeObject | string

export const [ZonedDateTime, createZonedDateTime] = createSlotClass(
  ZonedDateTimeBranding,
  constructZonedDateTimeSlots,
  formatZonedDateTimeIso,
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
      return slots.timeZone.id
    },
    hoursInDay(slots: ZonedDateTimeSlots): number {
      return computeZonedHoursInDay(slots)
    },
  },
  {
    with(
      slots: ZonedDateTimeSlots,
      mod: Partial<DateTimeFields>,
      options?: ZonedFieldOptions,
    ): ZonedDateTime {
      return createZonedDateTime(
        mergeZonedDateTimeFields(slots, rejectInvalidBag(mod), options),
      )
    },
    withCalendar(
      slots: ZonedDateTimeSlots,
      calendarArg: CalendarArg,
    ): ZonedDateTime {
      return createZonedDateTime({
        ...slots,
        calendar: getInternalCalendar(refineCalendarArg(calendarArg)),
      })
    },
    withTimeZone(
      slots: ZonedDateTimeSlots,
      timeZoneArg: TimeZoneArg,
    ): ZonedDateTime {
      return createZonedDateTime({
        ...slots,
        timeZone: queryTimeZone(refineTimeZoneArg(timeZoneArg)),
      })
    },
    withPlainTime(
      slots: ZonedDateTimeSlots,
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
      slots: ZonedDateTimeSlots,
      durationArg: DurationArg,
      options?: OverflowOptions,
    ): ZonedDateTime {
      return createZonedDateTime(
        moveZonedDateTime(false, slots, toDurationSlots(durationArg), options),
      )
    },
    subtract(
      slots: ZonedDateTimeSlots,
      durationArg: DurationArg,
      options?: OverflowOptions,
    ): ZonedDateTime {
      return createZonedDateTime(
        moveZonedDateTime(true, slots, toDurationSlots(durationArg), options),
      )
    },
    until(
      slots: ZonedDateTimeSlots,
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
      slots: ZonedDateTimeSlots,
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
      slots: ZonedDateTimeSlots,
      options: DayTimeUnitName | RoundingOptions<DayTimeUnitName>,
    ): ZonedDateTime {
      return createZonedDateTime(roundZonedDateTime(slots, options))
    },
    startOfDay(slots: ZonedDateTimeSlots): ZonedDateTime {
      return createZonedDateTime(computeZonedStartOfDay(slots))
    },
    equals(slots: ZonedDateTimeSlots, otherArg: ZonedDateTimeArg): boolean {
      return zonedDateTimesEqual(slots, toZonedDateTimeSlots(otherArg))
    },
    toInstant(slots: ZonedDateTimeSlots): Instant {
      return createInstant(zonedDateTimeToInstant(slots))
    },
    toPlainDateTime(slots: ZonedDateTimeSlots): PlainDateTime {
      return createPlainDateTime(zonedDateTimeToPlainDateTime(slots))
    },
    toPlainDate(slots: ZonedDateTimeSlots): PlainDate {
      return createPlainDate(zonedDateTimeToPlainDate(slots))
    },
    toPlainTime(slots: ZonedDateTimeSlots): PlainTime {
      return createPlainTime(zonedDateTimeToPlainTime(slots))
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
    getTimeZoneTransition(
      slots: ZonedDateTimeSlots,
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
): ZonedDateTimeSlots {
  if (isObjectLike(arg)) {
    const slots = getSlots(arg)

    if (slots && slots.branding === ZonedDateTimeBranding) {
      refineZonedFieldOptions(options) // parse unused options
      return slots as ZonedDateTimeSlots
    }

    const calendarId = getCalendarIdFromBag(arg as any)
    const calendar = getInternalCalendar(calendarId)

    return refineZonedDateTimeObjectLike(
      refineTimeZoneArg,
      calendar,
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

function slotsToIso(slots: ZonedDateTimeSlots): FixedIsoZonedFields {
  return zonedEpochSlotsToIso(slots)
}
