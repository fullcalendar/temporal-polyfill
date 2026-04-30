import { compareZonedDateTimes, zonedDateTimesEqual } from '../internal/compare'
import { constructZonedDateTimeSlots } from '../internal/construct'
import {
  zonedDateTimeToInstant,
  zonedDateTimeToPlainDate,
  zonedDateTimeToPlainDateTime,
  zonedDateTimeToPlainTime,
} from '../internal/convert'
import { refineZonedDateTimeObjectLike } from '../internal/createFromFields'
import { diffZonedDateTimes } from '../internal/diff'
import { ZonedDateTimeLikeObject } from '../internal/fieldTypes'
import { DateTimeFields } from '../internal/fieldTypes'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatOffsetNano, formatZonedDateTimeIso } from '../internal/isoFormat'
import { parseZonedDateTime } from '../internal/isoParse'
import { mergeZonedDateTimeFields } from '../internal/merge'
import {
  slotsWithCalendarId,
  slotsWithTimeZoneId,
  zonedDateTimeWithPlainTime,
} from '../internal/modify'
import { moveZonedDateTime } from '../internal/move'
import { refineZonedFieldOptions } from '../internal/optionsFieldRefine'
import {
  DiffOptions,
  DirectionOptions,
  OverflowOptions,
  RoundingOptions,
  ZonedDateTimeDisplayOptions,
  ZonedFieldOptions,
} from '../internal/optionsModel'
import { refineDirectionOptions } from '../internal/optionsTransitionRefine'
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
  FixedCalendarDateTimeFields,
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
  neverValueOf,
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
      return createDuration(
        createDurationSlots(
          diffZonedDateTimes(
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
    toString(
      slots: ZonedDateTimeSlots,
      options?: ZonedDateTimeDisplayOptions,
    ): string {
      return formatZonedDateTimeIso(slots, options)
    },
    toJSON(slots: ZonedDateTimeSlots): string {
      return formatZonedDateTimeIso(slots)
    },
    valueOf: neverValueOf,

    // TODO: optimize minification of this method
    getTimeZoneTransition(
      slots: ZonedDateTimeSlots,
      options: DirectionOptions,
    ): ZonedDateTime | null {
      const { timeZone: timeZoneId, epochNanoseconds: epochNano } = slots

      const direction = refineDirectionOptions(options)
      const timeZoneImpl = queryTimeZone(timeZoneId)
      const newEpochNano = timeZoneImpl.getTransition(epochNano, direction)

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
  (slots: ZonedDateTimeSlots) => formatZonedDateTimeIso(slots),
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

    return refineZonedDateTimeObjectLike(
      refineTimeZoneArg,
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

function slotsToIso(slots: ZonedDateTimeSlots): FixedCalendarDateTimeFields {
  return zonedEpochSlotsToIso(slots)
}
