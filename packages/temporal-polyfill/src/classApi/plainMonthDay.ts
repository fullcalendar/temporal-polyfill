import { plainMonthDaysEqual } from '../internal/compare'
import { constructPlainMonthDaySlots } from '../internal/construct'
import { convertPlainMonthDayToDate } from '../internal/convert'
import { refinePlainMonthDayObjectLike } from '../internal/createFromFields'
import {
  InternalCalendar,
  getInternalCalendar,
} from '../internal/externalCalendar'
import { CalendarDateFields, MonthDayLikeObject } from '../internal/fieldTypes'
import { MonthDayFields, YearFields } from '../internal/fieldTypes'
import { isoCalendarId } from '../internal/intlCalendarConfig'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatPlainMonthDayIso } from '../internal/isoFormat'
import { parsePlainMonthDay } from '../internal/isoParse'
import { mergePlainMonthDayFields } from '../internal/merge'
import { refineOverflowOptions } from '../internal/optionsFieldRefine'
import { OverflowOptions } from '../internal/optionsModel'
import { isObjectLike } from '../internal/utils'
import { PlainMonthDayBranding } from './branding'
import { extractCalendarIdFromBag } from './calendarArg'
import { prepPlainMonthDayFormat } from './intlFormatConfig'
import { calendarIdGetters, monthDayFieldGetters } from './mixins'
import { PlainDate, createPlainDate } from './plainDate'
import {
  createSlotClass,
  getBrandingAndSlots,
  rejectInvalidBag,
} from './slotClass'

export type PlainMonthDay = { monthCode: string; day: number } // and other getters/methods
export type PlainMonthDayArg = PlainMonthDay | MonthDayLikeObject | string

export const [PlainMonthDay, createPlainMonthDay, getPlainMonthDaySlots] =
  createSlotClass(
    PlainMonthDayBranding,
    constructPlainMonthDaySlots,
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

    const calendarIdMaybe = extractCalendarIdFromBag(arg as { calendar?: any })
    const calendarId = calendarIdMaybe || isoCalendarId
    const calendar = getInternalCalendar(calendarId)

    return refinePlainMonthDayObjectLike(
      calendar,
      !calendarIdMaybe,
      arg as Partial<MonthDayFields>,
      options,
    )
  }

  const res = parsePlainMonthDay(arg)
  refineOverflowOptions(options) // parse unused options
  return res
}
