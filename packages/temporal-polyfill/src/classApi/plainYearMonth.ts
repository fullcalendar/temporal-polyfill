import { compareIsoDateFields, plainYearMonthsEqual } from '../internal/compare'
import { constructPlainYearMonthSlots } from '../internal/construct'
import { convertPlainYearMonthToDate } from '../internal/convert'
import { refinePlainYearMonthObjectLike } from '../internal/createFromFields'
import { diffPlainYearMonth, getCommonCalendar } from '../internal/diff'
import { getInternalCalendar } from '../internal/externalCalendar'
import { YearMonthLikeObject } from '../internal/fieldTypes'
import { YearMonthFields } from '../internal/fieldTypes'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatPlainYearMonthIso } from '../internal/isoFormat'
import { parsePlainYearMonth } from '../internal/isoParse'
import { mergePlainYearMonthFields } from '../internal/merge'
import { movePlainYearMonth } from '../internal/move'
import { refineOverflowOptions } from '../internal/optionsFieldRefine'
import { DiffOptions, OverflowOptions } from '../internal/optionsModel'
import { PlainYearMonthBranding, PlainYearMonthSlots } from '../internal/slots'
import { YearMonthUnitName } from '../internal/units'
import { NumberSign, isObjectLike } from '../internal/utils'
import { getCalendarIdFromBag } from './calendarArg'
import {
  Duration,
  DurationArg,
  createDuration,
  toDurationSlots,
} from './duration'
import { prepPlainYearMonthFormat } from './intlFormatConfig'
import { calendarIdGetters, neverValueOf, yearMonthGetters } from './mixins'
import { PlainDate, createPlainDate } from './plainDate'
import { createSlotClass, getSlots, rejectInvalidBag } from './slotClass'

export type PlainYearMonth = any & YearMonthFields
export type PlainYearMonthArg = PlainYearMonth | YearMonthLikeObject | string

export const [PlainYearMonth, createPlainYearMonth, getPlainYearMonthSlots] =
  createSlotClass(
    PlainYearMonthBranding,
    constructPlainYearMonthSlots,
    {
      ...calendarIdGetters,
      ...yearMonthGetters,
    },
    {
      with(
        slots: PlainYearMonthSlots,
        mod: Partial<YearMonthFields>,
        options?: OverflowOptions,
      ): PlainYearMonth {
        return createPlainYearMonth(
          mergePlainYearMonthFields(slots, rejectInvalidBag(mod), options),
        )
      },
      add(
        slots: PlainYearMonthSlots,
        durationArg: DurationArg,
        options?: OverflowOptions,
      ): PlainYearMonth {
        return createPlainYearMonth(
          movePlainYearMonth(
            false,
            slots,
            toDurationSlots(durationArg),
            options,
          ),
        )
      },
      subtract(
        slots: PlainYearMonthSlots,
        durationArg: DurationArg,
        options?: OverflowOptions,
      ): PlainYearMonth {
        return createPlainYearMonth(
          movePlainYearMonth(
            true,
            slots,
            toDurationSlots(durationArg),
            options,
          ),
        )
      },
      until(
        slots: PlainYearMonthSlots,
        otherArg: PlainYearMonthArg,
        options?: DiffOptions<YearMonthUnitName>,
      ): Duration {
        const other = toPlainYearMonthSlots(otherArg)
        const calendar = getCommonCalendar(slots.calendar, other.calendar)
        return createDuration(
          diffPlainYearMonth(false, calendar, slots, other, options),
        )
      },
      since(
        slots: PlainYearMonthSlots,
        otherArg: PlainYearMonthArg,
        options?: DiffOptions<YearMonthUnitName>,
      ): Duration {
        const other = toPlainYearMonthSlots(otherArg)
        const calendar = getCommonCalendar(slots.calendar, other.calendar)
        return createDuration(
          diffPlainYearMonth(true, calendar, slots, other, options),
        )
      },
      equals(slots: PlainYearMonthSlots, otherArg: PlainYearMonthArg): boolean {
        return plainYearMonthsEqual(slots, toPlainYearMonthSlots(otherArg))
      },
      toPlainDate(slots: PlainYearMonthSlots, bag: { day: number }): PlainDate {
        return createPlainDate(
          convertPlainYearMonthToDate(slots.calendar, this, bag),
        )
      },
      toLocaleString(
        slots: PlainYearMonthSlots,
        locales?: LocalesArg,
        options?: Intl.DateTimeFormatOptions,
      ): string {
        const [format, epochMilli] = prepPlainYearMonthFormat(
          locales,
          options,
          slots,
        )
        return format.format(epochMilli)
      },
      toString: formatPlainYearMonthIso,
      toJSON(slots: PlainYearMonthSlots) {
        return formatPlainYearMonthIso(slots)
      },
      valueOf: neverValueOf,
    },
    {
      from(arg: PlainYearMonthArg, options?: OverflowOptions): PlainYearMonth {
        return createPlainYearMonth(toPlainYearMonthSlots(arg, options))
      },
      compare(arg0: PlainYearMonthArg, arg1: PlainYearMonthArg): NumberSign {
        return compareIsoDateFields(
          toPlainYearMonthSlots(arg0),
          toPlainYearMonthSlots(arg1),
        )
      },
    },
    formatPlainYearMonthIso,
  )

// Utils
// -----------------------------------------------------------------------------

export function toPlainYearMonthSlots(
  arg: PlainYearMonthArg,
  options?: OverflowOptions,
) {
  if (isObjectLike(arg)) {
    const slots = getSlots(arg)

    if (slots && slots.branding === PlainYearMonthBranding) {
      refineOverflowOptions(options) // parse unused options
      return slots as PlainYearMonthSlots
    }

    const calendarId = getCalendarIdFromBag(arg as any)
    const calendar = getInternalCalendar(calendarId)
    return refinePlainYearMonthObjectLike(calendar, arg as any, options)
  }

  const res = parsePlainYearMonth(arg)
  refineOverflowOptions(options) // parse unused options
  return res
}
