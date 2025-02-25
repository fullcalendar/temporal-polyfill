import {
  PlainMonthDayBag,
  plainMonthDayWithFields,
  refinePlainMonthDayBag,
} from '../internal/bagRefine'
import { isoCalendarId } from '../internal/calendarConfig'
import { createNativeStandardOps } from '../internal/calendarNativeQuery'
import { plainMonthDaysEqual } from '../internal/compare'
import { constructPlainMonthDaySlots } from '../internal/construct'
import { plainMonthDayToPlainDate } from '../internal/convert'
import { MonthDayBag, MonthDayFields, YearFields } from '../internal/fields'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatPlainMonthDayIso } from '../internal/isoFormat'
import { parsePlainMonthDay } from '../internal/isoParse'
import {
  OverflowOptions,
  copyOptions,
  refineOverflowOptions,
} from '../internal/optionsRefine'
import { PlainMonthDayBranding, PlainMonthDaySlots } from '../internal/slots'
import { bindArgs, isObjectLike } from '../internal/utils'
import { extractCalendarIdFromBag, refineCalendarArg } from './calendarArg'
import { prepPlainMonthDayFormat } from './intlFormatConfig'
import { calendarIdGetters, monthDayGetters, neverValueOf } from './mixins'
import { PlainDate, createPlainDate } from './plainDate'
import { createSlotClass, getSlots, rejectInvalidBag } from './slotClass'

export type PlainMonthDay = any & MonthDayFields
export type PlainMonthDayArg = PlainMonthDay | PlainMonthDayBag | string

export const [PlainMonthDay, createPlainMonthDay, getPlainMonthDaySlots] =
  createSlotClass(
    PlainMonthDayBranding,
    bindArgs(constructPlainMonthDaySlots, refineCalendarArg),
    {
      ...calendarIdGetters,
      ...monthDayGetters,
    },
    {
      with(
        slots: PlainMonthDaySlots,
        mod: MonthDayBag,
        options?: OverflowOptions,
      ): PlainMonthDay {
        return createPlainMonthDay(
          plainMonthDayWithFields(
            createNativeStandardOps,
            slots,
            this,
            rejectInvalidBag(mod),
            options,
          ),
        )
      },
      equals(slots: PlainMonthDaySlots, otherArg: PlainMonthDayArg): boolean {
        return plainMonthDaysEqual(slots, toPlainMonthDaySlots(otherArg))
      },
      toPlainDate(slots: PlainMonthDaySlots, bag: YearFields): PlainDate {
        return createPlainDate(
          plainMonthDayToPlainDate(createNativeStandardOps, slots, this, bag),
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
  )

// Utils
// -----------------------------------------------------------------------------

export function toPlainMonthDaySlots(
  arg: PlainMonthDayArg,
  options?: OverflowOptions,
): PlainMonthDaySlots {
  options = copyOptions(options)

  if (isObjectLike(arg)) {
    const slots = getSlots(arg)

    if (slots && slots.branding === PlainMonthDayBranding) {
      refineOverflowOptions(options) // parse unused options
      return slots as PlainMonthDaySlots
    }

    const calendarIdMaybe = extractCalendarIdFromBag(arg as PlainMonthDaySlots)
    const calendarId = calendarIdMaybe || isoCalendarId

    return refinePlainMonthDayBag(
      createNativeStandardOps(calendarId),
      !calendarIdMaybe,
      arg as MonthDayBag,
      options,
    )
  }

  const res = parsePlainMonthDay(createNativeStandardOps, arg)
  refineOverflowOptions(options) // parse unused options
  return res
}
