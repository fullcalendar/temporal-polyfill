import { plainMonthDaysEqual } from '../internal/compare'
import { constructPlainMonthDaySlots } from '../internal/construct'
import { convertPlainMonthDayToDate } from '../internal/convert'
import { refinePlainMonthDayObjectLike } from '../internal/createFromFields'
import { MonthDayLikeObject } from '../internal/fieldTypes'
import { MonthDayFields, YearFields } from '../internal/fieldTypes'
import { isoCalendarId } from '../internal/intlCalendarConfig'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatPlainMonthDayIso } from '../internal/isoFormat'
import { parsePlainMonthDay } from '../internal/isoParse'
import { mergePlainMonthDayFields } from '../internal/merge'
import { refineOverflowOptions } from '../internal/optionsFieldRefine'
import { OverflowOptions } from '../internal/optionsModel'
import { PlainMonthDayBranding, PlainMonthDaySlots } from '../internal/slots'
import { isObjectLike } from '../internal/utils'
import { extractCalendarIdFromBag } from './calendarArg'
import { prepPlainMonthDayFormat } from './intlFormatConfig'
import { calendarIdGetters, monthDayGetters, neverValueOf } from './mixins'
import { PlainDate, createPlainDate } from './plainDate'
import { createSlotClass, getSlots, rejectInvalidBag } from './slotClass'

export type PlainMonthDay = any & MonthDayFields
export type PlainMonthDayArg = PlainMonthDay | MonthDayLikeObject | string

export const [PlainMonthDay, createPlainMonthDay, getPlainMonthDaySlots] =
  createSlotClass(
    PlainMonthDayBranding,
    constructPlainMonthDaySlots,
    {
      ...calendarIdGetters,
      ...monthDayGetters,
    },
    {
      with(
        slots: PlainMonthDaySlots,
        mod: Partial<MonthDayFields>,
        options?: OverflowOptions,
      ): PlainMonthDay {
        return createPlainMonthDay(
          mergePlainMonthDayFields(slots, rejectInvalidBag(mod), options),
        )
      },
      equals(slots: PlainMonthDaySlots, otherArg: PlainMonthDayArg): boolean {
        return plainMonthDaysEqual(slots, toPlainMonthDaySlots(otherArg))
      },
      toPlainDate(slots: PlainMonthDaySlots, bag: YearFields): PlainDate {
        return createPlainDate(
          convertPlainMonthDayToDate(slots.calendarId, this, bag),
        )
      },
      toLocaleString(
        slots: PlainMonthDaySlots,
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
      toString: formatPlainMonthDayIso,
      toJSON(slots: PlainMonthDaySlots): string {
        return formatPlainMonthDayIso(slots)
      },
      valueOf: neverValueOf,
    },
    {
      from(arg: PlainMonthDayArg, options?: OverflowOptions): PlainMonthDay {
        return createPlainMonthDay(toPlainMonthDaySlots(arg, options))
      },
    },
    formatPlainMonthDayIso,
  )

// Utils
// -----------------------------------------------------------------------------

export function toPlainMonthDaySlots(
  arg: PlainMonthDayArg,
  options?: OverflowOptions,
): PlainMonthDaySlots {
  if (isObjectLike(arg)) {
    const slots = getSlots(arg)

    if (slots && slots.branding === PlainMonthDayBranding) {
      refineOverflowOptions(options) // parse unused options
      return slots as PlainMonthDaySlots
    }

    const calendarIdMaybe = extractCalendarIdFromBag(arg as { calendar?: any })
    const calendarId = calendarIdMaybe || isoCalendarId

    return refinePlainMonthDayObjectLike(
      calendarId,
      !calendarIdMaybe,
      arg as Partial<MonthDayFields>,
      options,
    )
  }

  const res = parsePlainMonthDay(arg)
  refineOverflowOptions(options) // parse unused options
  return res
}
