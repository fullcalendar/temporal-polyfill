import { isoCalendarId } from '../internal/calendarConfig'
import { MonthDayBag, MonthDayFieldsIntl, YearFields } from '../internal/calendarFields'
import { LocalesArg } from '../internal/formatIntl'
import { DateTimeDisplayOptions, OverflowOptions, copyOptions, refineOverflowOptions } from '../internal/optionsRefine'
import { bindArgs, isObjectLike } from '../internal/utils'
import { PlainMonthDayBranding, PlainMonthDaySlots, getId, removeBranding } from '../internal/slots'
import { createSlotClass, getSlots, rejectInvalidBag } from './slotsForClasses'
import { PlainDate, createPlainDate } from './plainDate'
import { CalendarSlot, extractCalendarSlotFromBag, refineCalendarSlot } from './slotsForClasses'
import { CalendarArg } from './calendar'
import { calendarIdGetters, getCalendarFromSlots, monthDayGetters, neverValueOf } from './mixins'
import { createDateModOps, createMonthDayModOps, createMonthDayRefineOps } from './calendarOpsQuery'
import { createNativeStandardOps } from '../internal/calendarNativeQuery'
import { PlainMonthDayBag, plainMonthDayWithFields, refinePlainMonthDayBag } from '../internal/bag'
import { constructPlainMonthDaySlots } from '../internal/construct'
import { plainMonthDaysEqual } from '../internal/compare'
import { formatPlainMonthDayIso } from '../internal/formatIso'
import { plainMonthDayToPlainDate } from '../internal/convert'
import { parsePlainMonthDay } from '../internal/parseIso'
import { prepPlainMonthDayFormat } from './dateTimeFormat'

export type PlainMonthDay = any & MonthDayFieldsIntl
export type PlainMonthDayArg = PlainMonthDay | PlainMonthDayBag<CalendarArg> | string

export const [PlainMonthDay, createPlainMonthDay, getPlainMonthDaySlots] = createSlotClass(
  PlainMonthDayBranding,
  bindArgs(constructPlainMonthDaySlots, refineCalendarSlot),
  {
    ...calendarIdGetters,
    ...monthDayGetters,
  },
  {
    with(slots: PlainMonthDaySlots<CalendarSlot>, mod: MonthDayBag, options?: OverflowOptions): PlainMonthDay {
      return createPlainMonthDay(
        plainMonthDayWithFields(createMonthDayModOps, slots, this, rejectInvalidBag(mod), options)
      )
    },
    equals(slots: PlainMonthDaySlots<CalendarSlot>, otherArg: PlainMonthDayArg): boolean {
      return plainMonthDaysEqual(slots, toPlainMonthDaySlots(otherArg))
    },
    toString: formatPlainMonthDayIso,
    toJSON(slots: PlainMonthDaySlots<CalendarSlot>): string {
      return formatPlainMonthDayIso(slots)
    },
    toLocaleString(slots: PlainMonthDaySlots<CalendarSlot>, locales?: LocalesArg, options?: Intl.DateTimeFormatOptions): string {
      const [format, epochMilli] = prepPlainMonthDayFormat(locales, options, slots)
      return format.format(epochMilli)
    },
    toPlainDate(slots: PlainMonthDaySlots<CalendarSlot>, bag: YearFields): PlainDate {
      return createPlainDate(
        plainMonthDayToPlainDate(createDateModOps, slots, this, bag)
      )
    },
    getISOFields: removeBranding,
    getCalendar: getCalendarFromSlots,
    valueOf: neverValueOf,
  },
  {
    from(arg: PlainMonthDayArg, options?: OverflowOptions): PlainMonthDay {
      return createPlainMonthDay(
        toPlainMonthDaySlots(arg, options),
      )
    }
  },
)

// Utils
// -------------------------------------------------------------------------------------------------

export function toPlainMonthDaySlots(arg: PlainMonthDayArg, options?: OverflowOptions): PlainMonthDaySlots<CalendarSlot> {
  options = copyOptions(options)

  if (isObjectLike(arg)) {
    const slots = getSlots(arg)

    if (slots && slots.branding === PlainMonthDayBranding) {
      refineOverflowOptions(options) // parse unused options
      return slots as PlainMonthDaySlots<CalendarSlot>
    }

    const calendarMaybe = extractCalendarSlotFromBag(arg as PlainMonthDaySlots<CalendarSlot>)
    const calendar = calendarMaybe || isoCalendarId

    return refinePlainMonthDayBag(
      createMonthDayRefineOps(calendar),
      !calendarMaybe,
      arg as MonthDayBag,
      options,
    )
  }

  const res = parsePlainMonthDay(createNativeStandardOps, arg)
  refineOverflowOptions(options) // parse unused options
  return res
}
