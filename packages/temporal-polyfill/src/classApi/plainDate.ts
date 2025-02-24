import {
  PlainDateBag,
  plainDateWithFields,
  refinePlainDateBag,
} from '../internal/bagRefine'
import { createNativeStandardOps } from '../internal/calendarNativeQuery'
import { compareIsoDateFields, plainDatesEqual } from '../internal/compare'
import { constructPlainDateSlots } from '../internal/construct'
import {
  plainDateToPlainDateTime,
  plainDateToPlainMonthDay,
  plainDateToPlainYearMonth,
  plainDateToZonedDateTime,
  zonedDateTimeToPlainDate,
} from '../internal/convert'
import { diffPlainDates } from '../internal/diff'
import { DateBag, DateFields } from '../internal/fields'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatPlainDateIso } from '../internal/isoFormat'
import { parsePlainDate } from '../internal/isoParse'
import { slotsWithCalendarId } from '../internal/modify'
import { movePlainDate } from '../internal/move'
import {
  DiffOptions,
  OverflowOptions,
  copyOptions,
  refineOverflowOptions,
} from '../internal/optionsRefine'
import {
  BrandingSlots,
  PlainDateBranding,
  PlainDateSlots,
  PlainDateTimeBranding,
  PlainDateTimeSlots,
  ZonedDateTimeBranding,
  ZonedDateTimeSlots,
  createPlainDateSlots,
} from '../internal/slots'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { DateUnitName } from '../internal/units'
import { NumberSign, bindArgs, isObjectLike } from '../internal/utils'
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
import { prepPlainDateFormat } from './intlFormatConfig'
import {
  calendarIdGetters,
  dateGetters,
  neverValueOf,
  removeBranding,
} from './mixins'
import { PlainDateTime, createPlainDateTime } from './plainDateTime'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import {
  PlainTimeArg,
  optionalToPlainTimeFields,
  toPlainTimeSlots,
} from './plainTime'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { createSlotClass, getSlots, rejectInvalidBag } from './slotClass'
import { TimeZoneArg, refineTimeZoneArg } from './timeZoneArg'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime'

export type PlainDate = any & DateFields
export type PlainDateArg = PlainDate | PlainDateBag | string

// TODO: give `this` a type

export const [PlainDate, createPlainDate, getPlainDateSlots] = createSlotClass(
  PlainDateBranding,
  bindArgs(constructPlainDateSlots, refineCalendarArg),
  {
    ...calendarIdGetters,
    ...dateGetters,
  },
  {
    getISOFields: removeBranding,
    with(slots: PlainDateSlots, mod: DateBag, options?: OverflowOptions) {
      return createPlainDate(
        plainDateWithFields(
          createNativeStandardOps,
          slots,
          this,
          rejectInvalidBag(mod),
          options,
        ),
      )
    },
    withCalendar(slots: PlainDateSlots, calendarArg: CalendarArg): PlainDate {
      return createPlainDate(
        slotsWithCalendarId(slots, refineCalendarArg(calendarArg)),
      )
    },
    add(
      slots: PlainDateSlots,
      durationArg: DurationArg,
      options?: OverflowOptions,
    ): PlainDate {
      return createPlainDate(
        movePlainDate(
          createNativeStandardOps,
          false,
          slots,
          toDurationSlots(durationArg),
          options,
        ),
      )
    },
    subtract(
      slots: PlainDateSlots,
      durationArg: DurationArg,
      options?: OverflowOptions,
    ): PlainDate {
      return createPlainDate(
        movePlainDate(
          createNativeStandardOps,
          true,
          slots,
          toDurationSlots(durationArg),
          options,
        ),
      )
    },
    until(
      slots: PlainDateSlots,
      otherArg: PlainDateArg,
      options?: DiffOptions<DateUnitName>,
    ): Duration {
      return createDuration(
        diffPlainDates(
          createNativeStandardOps,
          false,
          slots,
          toPlainDateSlots(otherArg),
          options,
        ),
      )
    },
    since(
      slots: PlainDateSlots,
      otherArg: PlainDateArg,
      options?: DiffOptions<DateUnitName>,
    ): Duration {
      return createDuration(
        diffPlainDates(
          createNativeStandardOps,
          true,
          slots,
          toPlainDateSlots(otherArg),
          options,
        ),
      )
    },
    equals(slots: PlainDateSlots, otherArg: PlainDateArg): boolean {
      return plainDatesEqual(slots, toPlainDateSlots(otherArg))
    },
    toZonedDateTime(
      slots: PlainDateSlots,
      options:
        | TimeZoneArg
        | { timeZone: TimeZoneArg; plainTime?: PlainTimeArg },
    ): ZonedDateTime {
      const optionsObj = !isObjectLike(options)
        ? { timeZone: options }
        : (options as { timeZone: TimeZoneArg; plainTime?: PlainTimeArg })

      return createZonedDateTime(
        plainDateToZonedDateTime(
          refineTimeZoneArg,
          toPlainTimeSlots,
          queryNativeTimeZone,
          slots,
          optionsObj,
        ),
      )
    },
    toPlainDateTime(
      slots: PlainDateSlots,
      plainTimeArg?: PlainTimeArg,
    ): PlainDateTime {
      return createPlainDateTime(
        plainDateToPlainDateTime(
          slots,
          optionalToPlainTimeFields(plainTimeArg),
        ),
      )
    },
    toPlainYearMonth(slots: PlainDateSlots): PlainYearMonth {
      return createPlainYearMonth(
        plainDateToPlainYearMonth(createNativeStandardOps, slots, this),
      )
    },
    toPlainMonthDay(slots: PlainDateSlots): PlainMonthDay {
      return createPlainMonthDay(
        plainDateToPlainMonthDay(createNativeStandardOps, slots, this),
      )
    },
    toLocaleString(
      slots: PlainDateSlots,
      locales?: LocalesArg,
      options?: Intl.DateTimeFormatOptions,
    ) {
      const [format, epochMilli] = prepPlainDateFormat(locales, options, slots)
      return format.format(epochMilli)
    },
    toString: formatPlainDateIso,
    toJSON(slots: PlainDateSlots): string {
      return formatPlainDateIso(slots)
    },
    valueOf: neverValueOf,
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
): PlainDateSlots {
  options = copyOptions(options)

  if (isObjectLike(arg)) {
    const slots = (getSlots(arg) || {}) as Partial<BrandingSlots>

    switch (slots.branding) {
      case PlainDateBranding:
        refineOverflowOptions(options) // parse unused options
        return slots as PlainDateSlots

      case PlainDateTimeBranding:
        refineOverflowOptions(options) // parse unused options
        return createPlainDateSlots(slots as PlainDateTimeSlots)

      case ZonedDateTimeBranding:
        refineOverflowOptions(options) // parse unused options
        return zonedDateTimeToPlainDate(
          queryNativeTimeZone,
          slots as ZonedDateTimeSlots,
        )
    }

    return refinePlainDateBag(
      createNativeStandardOps(getCalendarIdFromBag(arg as PlainDateBag)),
      arg as PlainDateBag,
      options,
    )
  }

  const res = parsePlainDate(arg)
  refineOverflowOptions(options) // parse unused options
  return res
}
