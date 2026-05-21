import {
  PlainDateBranding,
  PlainDateTimeBranding,
  ZonedDateTimeBranding,
} from '../apiHelpers/branding'
import { prepPlainDateTimeFormat } from '../apiHelpers/intlFormatConfig'
import {
  calendarIdGetters,
  dateGetters,
  timeGetters,
} from '../apiHelpers/mixins'
import {
  createSlotClass,
  getBrandingAndSlots,
  rejectInvalidBag,
} from '../apiHelpers/slotClass'
import { TimeZoneArg, refineTimeZoneArg } from '../apiHelpers/timeZoneArg'
import {
  compareIsoDateTimeFields,
  plainDateTimesEqual,
} from '../internal/compare'
import {
  plainDateTimeToZonedDateTime,
  zonedDateTimeToPlainDateTime,
} from '../internal/convert'
import { refinePlainDateTimeObjectLike } from '../internal/createFromFields'
import { diffPlainDateTimes, getCommonCalendar } from '../internal/diff'
import { InternalCalendar } from '../internal/externalCalendar'
import { timeFieldDefaults } from '../internal/fieldNames'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  DateLikeObject,
  DateTimeLikeObject,
} from '../internal/fieldTypes'
import { DateTimeFields } from '../internal/fieldTypes'
import { combineDateAndTime } from '../internal/fieldUtils'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatPlainDateTimeIso } from '../internal/isoFormat'
import { parsePlainDateTime } from '../internal/isoParse'
import { mergePlainDateTimeFields } from '../internal/merge'
import { movePlainDateTime } from '../internal/move'
import { refineOverflowOptions } from '../internal/optionsFieldRefine'
import {
  DiffOptions,
  EpochDisambigOptions,
  OverflowOptions,
  RoundingOptions,
} from '../internal/optionsModel'
import { roundPlainDateTime } from '../internal/round'
import {
  ZonedEpochNanoFields,
  createDateSlots,
  createDateTimeSlots,
  createTimeSlots,
} from '../internal/slots'
import { createPlainDateTimeFromRefinedFields } from '../internal/slotsFromRefinedFields'
import { queryTimeZone } from '../internal/timeZoneImpl'
import { DayTimeUnitName, UnitName } from '../internal/units'
import { NumberSign, isObjectLike } from '../internal/utils'
import {
  CalendarArg,
  getCalendarFromBag,
  refineCalendarArg,
  resolveFullCalendar,
} from './calendarArg'
import { constructDateTimeSlots } from './construct'
import {
  Duration,
  DurationArg,
  createDuration,
  toDurationSlots,
} from './duration'
import { PlainDate, createPlainDate } from './plainDate'
import {
  PlainTime,
  PlainTimeArg,
  createPlainTime,
  optionalToPlainTimeFields,
} from './plainTime'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'

export type PlainDateTime = DateTimeFields // and other getters/methods
export type PlainDateTimeArg = PlainDateTime | DateTimeLikeObject | string

export const [PlainDateTime, createPlainDateTime] = createSlotClass(
  PlainDateTimeBranding,
  constructDateTimeSlots,
  formatPlainDateTimeIso,
  {
    ...calendarIdGetters,
    ...dateGetters,
    ...timeGetters,
  },
  {
    with(
      slots: CalendarDateTimeFields & { calendar: InternalCalendar },
      mod: Partial<DateTimeFields>,
      options?: OverflowOptions,
    ): PlainDateTime {
      return createPlainDateTime(
        mergePlainDateTimeFields(slots, rejectInvalidBag(mod), options),
      )
    },
    withCalendar(
      slots: CalendarDateTimeFields & { calendar: InternalCalendar },
      calendarArg: CalendarArg,
    ): PlainDateTime {
      return createPlainDateTime(
        createDateTimeSlots(slots, refineCalendarArg(calendarArg)),
      )
    },
    withPlainTime(
      slots: CalendarDateTimeFields & { calendar: InternalCalendar },
      plainTimeArg?: PlainTimeArg,
    ): PlainDateTime {
      return createPlainDateTime(
        createPlainDateTimeFromRefinedFields(
          slots,
          optionalToPlainTimeFields(plainTimeArg),
          slots.calendar,
        ),
      )
    },
    add(
      slots: CalendarDateTimeFields & { calendar: InternalCalendar },
      durationArg: DurationArg,
      options?: OverflowOptions,
    ): PlainDateTime {
      return createPlainDateTime(
        movePlainDateTime(false, slots, toDurationSlots(durationArg), options),
      )
    },
    subtract(
      slots: CalendarDateTimeFields & { calendar: InternalCalendar },
      durationArg: DurationArg,
      options?: OverflowOptions,
    ): PlainDateTime {
      return createPlainDateTime(
        movePlainDateTime(true, slots, toDurationSlots(durationArg), options),
      )
    },
    until(
      slots: CalendarDateTimeFields & { calendar: InternalCalendar },
      otherArg: PlainDateTimeArg,
      options?: DiffOptions<UnitName>,
    ): Duration {
      const other = toPlainDateTimeSlots(otherArg)
      const calendar = getCommonCalendar(slots.calendar, other.calendar)
      return createDuration(
        diffPlainDateTimes(false, calendar, slots, other, options),
      )
    },
    since(
      slots: CalendarDateTimeFields & { calendar: InternalCalendar },
      otherArg: PlainDateTimeArg,
      options?: DiffOptions<UnitName>,
    ): Duration {
      const other = toPlainDateTimeSlots(otherArg)
      const calendar = getCommonCalendar(slots.calendar, other.calendar)
      return createDuration(
        diffPlainDateTimes(true, calendar, slots, other, options),
      )
    },
    round(
      slots: CalendarDateTimeFields & { calendar: InternalCalendar },
      options: DayTimeUnitName | RoundingOptions<DayTimeUnitName>,
    ): PlainDateTime {
      return createPlainDateTime(roundPlainDateTime(slots, options))
    },
    equals(
      slots: CalendarDateTimeFields & { calendar: InternalCalendar },
      otherArg: PlainDateTimeArg,
    ): boolean {
      return plainDateTimesEqual(slots, toPlainDateTimeSlots(otherArg))
    },
    toZonedDateTime(
      slots: CalendarDateTimeFields & { calendar: InternalCalendar },
      timeZoneArg: TimeZoneArg,
      options?: EpochDisambigOptions,
    ): ZonedDateTime {
      return createZonedDateTime(
        plainDateTimeToZonedDateTime(
          slots,
          queryTimeZone(refineTimeZoneArg(timeZoneArg)),
          options,
        ),
      )
    },
    toPlainDate(
      slots: CalendarDateTimeFields & { calendar: InternalCalendar },
    ): PlainDate {
      return createPlainDate(createDateSlots(slots, slots.calendar))
    },
    toPlainTime(
      slots: CalendarDateTimeFields & { calendar: InternalCalendar },
    ): PlainTime {
      return createPlainTime(createTimeSlots(slots))
    },
    toLocaleString(
      slots: CalendarDateTimeFields & { calendar: InternalCalendar },
      locales?: LocalesArg,
      options?: Intl.DateTimeFormatOptions,
    ) {
      const [format, epochMilli] = prepPlainDateTimeFormat(
        locales,
        options,
        slots,
      )
      return format.format(epochMilli)
    },
  },
  {
    from(arg: PlainDateTimeArg, options: OverflowOptions): PlainDateTime {
      return createPlainDateTime(toPlainDateTimeSlots(arg, options))
    },
    compare(arg0: PlainDateTimeArg, arg1: PlainDateTimeArg): NumberSign {
      const slots0 = toPlainDateTimeSlots(arg0)
      const slots1 = toPlainDateTimeSlots(arg1)
      return compareIsoDateTimeFields(slots0, slots1)
    },
  },
)

// Utils
// -----------------------------------------------------------------------------

export function toPlainDateTimeSlots(
  arg: PlainDateTimeArg,
  options?: OverflowOptions,
): CalendarDateTimeFields & { calendar: InternalCalendar } {
  if (isObjectLike(arg)) {
    const brandingAndSlots = getBrandingAndSlots(arg)

    if (brandingAndSlots) {
      const [branding, slots] = brandingAndSlots
      switch (branding) {
        case PlainDateTimeBranding:
          refineOverflowOptions(options) // parse unused options
          return slots as CalendarDateTimeFields & {
            calendar: InternalCalendar
          }

        case PlainDateBranding:
          refineOverflowOptions(options) // parse unused options
          return createDateTimeSlots(
            combineDateAndTime(
              slots as CalendarDateFields & { calendar: InternalCalendar },
              timeFieldDefaults,
            ),
            (slots as CalendarDateFields & { calendar: InternalCalendar })
              .calendar,
          )

        case ZonedDateTimeBranding:
          refineOverflowOptions(options) // parse unused options
          return zonedDateTimeToPlainDateTime(
            slots as ZonedEpochNanoFields & { calendar: InternalCalendar },
          )
      }
    }

    const calendar = getCalendarFromBag(arg as DateLikeObject)
    return refinePlainDateTimeObjectLike(
      calendar,
      arg as DateLikeObject,
      options,
    )
  }

  const res = parsePlainDateTime(arg, resolveFullCalendar)
  refineOverflowOptions(options) // parse unused options
  return res
}
