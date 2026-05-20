import { PlainMonthDayBranding } from '../apiHelpers/branding'
import { calendarIdGetters, monthDayFieldGetters } from '../apiHelpers/mixins'
import {
  createSlotClass,
  getBrandingAndSlots,
  rejectInvalidBag,
} from '../apiHelpers/slotClass'
import { plainMonthDaysEqual } from '../internal/compare'
import { convertPlainMonthDayToDate } from '../internal/convert'
import { refinePlainMonthDayObjectLike } from '../internal/createFromFields'
import { InternalCalendar, isoCalendar } from '../internal/externalCalendar'
import { CalendarDateFields, MonthDayLikeObject } from '../internal/fieldTypes'
import { MonthDayFields, YearFields } from '../internal/fieldTypes'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatPlainMonthDayIso } from '../internal/isoFormat'
import { parsePlainMonthDay } from '../internal/isoParse'
import { mergePlainMonthDayFields } from '../internal/merge'
import { refineOverflowOptions } from '../internal/optionsFieldRefine'
import { OverflowOptions } from '../internal/optionsModel'
import { isObjectLike } from '../internal/utils'
import { extractCalendarFromBag, resolveFullCalendar } from './calendarArg'
import { constructMonthDaySlots } from './construct'
import { prepPlainMonthDayFormat } from './intlFormatConfig'
import { PlainDate, createPlainDate } from './plainDate'

export type PlainMonthDay = { monthCode: string; day: number } // and other getters/methods
export type PlainMonthDayArg = PlainMonthDay | MonthDayLikeObject | string

export const [PlainMonthDay, createPlainMonthDay, getPlainMonthDaySlots] =
  createSlotClass(
    PlainMonthDayBranding,
    constructMonthDaySlots,
    formatPlainMonthDayIso,
    {
      ...calendarIdGetters,
      ...monthDayFieldGetters,
    },
    {
      with(
        slots: CalendarDateFields & { calendar: InternalCalendar },
        mod: Partial<MonthDayFields>,
        options?: OverflowOptions,
      ): PlainMonthDay {
        return createPlainMonthDay(
          mergePlainMonthDayFields(slots, rejectInvalidBag(mod), options),
        )
      },
      equals(
        slots: CalendarDateFields & { calendar: InternalCalendar },
        otherArg: PlainMonthDayArg,
      ): boolean {
        return plainMonthDaysEqual(slots, toPlainMonthDaySlots(otherArg))
      },
      toPlainDate(
        this: PlainMonthDay,
        slots: CalendarDateFields & { calendar: InternalCalendar },
        bag: YearFields,
      ): PlainDate {
        return createPlainDate(
          convertPlainMonthDayToDate(slots.calendar, this, bag),
        )
      },
      toLocaleString(
        slots: CalendarDateFields & { calendar: InternalCalendar },
        locales?: LocalesArg,
        options?: Intl.DateTimeFormatOptions,
      ): string {
        const [format, epochMilli] = prepPlainMonthDayFormat(
          locales,
          options,
          slots,
        )
        return format.format(epochMilli)
      },
    },
    {
      from(arg: PlainMonthDayArg, options?: OverflowOptions): PlainMonthDay {
        return createPlainMonthDay(toPlainMonthDaySlots(arg, options))
      },
    },
  )

// Utils
// -----------------------------------------------------------------------------

export function toPlainMonthDaySlots(
  arg: PlainMonthDayArg,
  options?: OverflowOptions,
): CalendarDateFields & { calendar: InternalCalendar } {
  if (isObjectLike(arg)) {
    const brandingAndSlots = getBrandingAndSlots(arg)

    if (brandingAndSlots && brandingAndSlots[0] === PlainMonthDayBranding) {
      refineOverflowOptions(options) // parse unused options
      return brandingAndSlots[1] as CalendarDateFields & {
        calendar: InternalCalendar
      }
    }

    const calendarMaybe = extractCalendarFromBag(arg as { calendar?: any })
    const calendar = calendarMaybe || isoCalendar

    return refinePlainMonthDayObjectLike(
      calendar,
      !calendarMaybe,
      arg as Partial<MonthDayFields>,
      options,
    )
  }

  const res = parsePlainMonthDay(arg, resolveFullCalendar)
  refineOverflowOptions(options) // parse unused options
  return res
}
