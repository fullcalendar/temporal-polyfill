import {
  PlainDateBranding,
  PlainDateTimeBranding,
  ZonedDateTimeBranding,
} from '../apiHelpers/branding'
import { prepPlainDateFormat } from '../apiHelpers/intlFormatConfig'
import { calendarIdGetters, dateGetters } from '../apiHelpers/mixins'
import {
  createSlotClass,
  getBrandingAndSlots,
  rejectInvalidBag,
} from '../apiHelpers/slotClass'
import { TimeZoneArg, refineTimeZoneArg } from '../apiHelpers/timeZoneArg'
import {
  resolveCoreCalendar,
  resolveCoreCalendarArg,
} from '../internal/calendarResolver'
import { compareIsoDateFields, plainDatesEqual } from '../internal/compare'
import { constructDateSlots } from '../internal/construct'
import {
  convertToPlainMonthDay,
  convertToPlainYearMonth,
  plainDateToZonedDateTime,
  zonedDateTimeToPlainDate,
} from '../internal/convert'
import { refinePlainDateObjectLike } from '../internal/createFromFields'
import { diffPlainDates, getCommonCalendar } from '../internal/diff'
import { InternalCalendar } from '../internal/externalCalendar'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  DateLikeObject,
} from '../internal/fieldTypes'
import { DateFields } from '../internal/fieldTypes'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatPlainDateIso } from '../internal/isoFormat'
import { parsePlainDate } from '../internal/isoParse'
import { mergePlainDateFields } from '../internal/merge'
import { movePlainDate } from '../internal/move'
import { refineOverflowOptions } from '../internal/optionsFieldRefine'
import { DiffOptions, OverflowOptions } from '../internal/optionsModel'
import { ZonedEpochNanoFields, createDateSlots } from '../internal/slots'
import { createPlainDateTimeFromRefinedFields } from '../internal/slotsFromRefinedFields'
import { DateUnitName } from '../internal/units'
import { NumberSign, bindArgs, isObjectLike } from '../internal/utils'
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
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import {
  PlainTimeArg,
  optionalToPlainTimeFields,
  toPlainTimeSlots,
} from './plainTime'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'

export type PlainDate = DateFields // and other getters/methods
export type PlainDateArg = PlainDate | DateLikeObject | string

// TODO: give `this` a type

export const [PlainDate, createPlainDate, getPlainDateSlots] = createSlotClass(
  PlainDateBranding,
  bindArgs(constructDateSlots, resolveCoreCalendarArg),
  formatPlainDateIso,
  {
    ...calendarIdGetters,
    ...dateGetters,
  },
  {
    with(
      slots: CalendarDateFields & { calendar: InternalCalendar },
      mod: Partial<DateFields>,
      options?: OverflowOptions,
    ) {
      return createPlainDate(
        mergePlainDateFields(slots, rejectInvalidBag(mod), options),
      )
    },
    withCalendar(
      slots: CalendarDateFields & { calendar: InternalCalendar },
      calendarArg: CalendarArg,
    ): PlainDate {
      return createPlainDate(
        createDateSlots(slots, refineCalendarArg(calendarArg)),
      )
    },
    add(
      slots: CalendarDateFields & { calendar: InternalCalendar },
      durationArg: DurationArg,
      options?: OverflowOptions,
    ): PlainDate {
      return createPlainDate(
        movePlainDate(false, slots, toDurationSlots(durationArg), options),
      )
    },
    subtract(
      slots: CalendarDateFields & { calendar: InternalCalendar },
      durationArg: DurationArg,
      options?: OverflowOptions,
    ): PlainDate {
      return createPlainDate(
        movePlainDate(true, slots, toDurationSlots(durationArg), options),
      )
    },
    until(
      slots: CalendarDateFields & { calendar: InternalCalendar },
      otherArg: PlainDateArg,
      options?: DiffOptions<DateUnitName>,
    ): Duration {
      const other = toPlainDateSlots(otherArg)
      const calendar = getCommonCalendar(slots.calendar, other.calendar)
      return createDuration(
        diffPlainDates(false, calendar, slots, other, options),
      )
    },
    since(
      slots: CalendarDateFields & { calendar: InternalCalendar },
      otherArg: PlainDateArg,
      options?: DiffOptions<DateUnitName>,
    ): Duration {
      const other = toPlainDateSlots(otherArg)
      const calendar = getCommonCalendar(slots.calendar, other.calendar)
      return createDuration(
        diffPlainDates(true, calendar, slots, other, options),
      )
    },
    equals(
      slots: CalendarDateFields & { calendar: InternalCalendar },
      otherArg: PlainDateArg,
    ): boolean {
      return plainDatesEqual(slots, toPlainDateSlots(otherArg))
    },
    toZonedDateTime(
      slots: CalendarDateFields & { calendar: InternalCalendar },
      options:
        | TimeZoneArg
        | { timeZone: TimeZoneArg; plainTime?: PlainTimeArg },
    ): ZonedDateTime {
      const optionsObj = !isObjectLike(options)
        ? { timeZone: options }
        : {
            timeZone: (options as { timeZone: TimeZoneArg }).timeZone,
            plainTime: (options as { plainTime?: PlainTimeArg }).plainTime,
          }

      return createZonedDateTime(
        plainDateToZonedDateTime(
          refineTimeZoneArg,
          (plainTimeArg) => toPlainTimeSlots(plainTimeArg),
          slots,
          optionsObj,
        ),
      )
    },
    toPlainDateTime(
      slots: CalendarDateFields & { calendar: InternalCalendar },
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
    toPlainYearMonth(
      this: PlainDate,
      slots: CalendarDateFields & { calendar: InternalCalendar },
    ): PlainYearMonth {
      return createPlainYearMonth(convertToPlainYearMonth(slots.calendar, this))
    },
    toPlainMonthDay(
      this: PlainDate,
      slots: CalendarDateFields & { calendar: InternalCalendar },
    ): PlainMonthDay {
      return createPlainMonthDay(convertToPlainMonthDay(slots.calendar, this))
    },
    toLocaleString(
      slots: CalendarDateFields & { calendar: InternalCalendar },
      locales?: LocalesArg,
      options?: Intl.DateTimeFormatOptions,
    ) {
      const [format, epochMilli] = prepPlainDateFormat(locales, options, slots)
      return format.format(epochMilli)
    },
  },
  {
    from(arg: any, options?: OverflowOptions): PlainDate {
      return createPlainDate(toPlainDateSlots(arg, options))
    },
    compare(arg0: PlainDateArg, arg1: PlainDateArg): NumberSign {
      return compareIsoDateFields(
        toPlainDateSlots(arg0),
        toPlainDateSlots(arg1),
      )
    },
  },
)

// Utils
// -----------------------------------------------------------------------------

export function toPlainDateSlots(
  arg: PlainDateArg,
  options?: OverflowOptions,
): CalendarDateFields & { calendar: InternalCalendar } {
  if (isObjectLike(arg)) {
    const brandingAndSlots = getBrandingAndSlots(arg)

    if (brandingAndSlots) {
      const [branding, slots] = brandingAndSlots
      switch (branding) {
        case PlainDateBranding:
          refineOverflowOptions(options) // parse unused options
          return slots as CalendarDateFields & { calendar: InternalCalendar }

        case PlainDateTimeBranding:
          refineOverflowOptions(options) // parse unused options
          return createDateSlots(
            slots as CalendarDateTimeFields & { calendar: InternalCalendar },
            (slots as CalendarDateTimeFields & { calendar: InternalCalendar })
              .calendar,
          )

        case ZonedDateTimeBranding:
          refineOverflowOptions(options) // parse unused options
          return zonedDateTimeToPlainDate(
            slots as ZonedEpochNanoFields & { calendar: InternalCalendar },
          )
      }
    }

    const calendar = getCalendarFromBag(arg as DateLikeObject)
    return refinePlainDateObjectLike(calendar, arg as DateLikeObject, options)
  }

  const res = parsePlainDate(arg, resolveCoreCalendar)
  refineOverflowOptions(options) // parse unused options
  return res
}
