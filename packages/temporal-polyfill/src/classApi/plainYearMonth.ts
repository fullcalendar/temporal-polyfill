import { YearMonthBag, YearMonthFieldsIntl } from '../internal/calendarFields'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { LocalesArg } from '../internal/formatIntl'
import { DateTimeDisplayOptions, DiffOptions, OverflowOptions, copyOptions, refineOverflowOptions } from '../internal/optionsRefine'
import { NumSign, bindArgs, isObjectLike } from '../internal/utils'
import { PlainYearMonthBranding, PlainYearMonthSlots, getId, removeBranding } from '../internal/slots'
import { getSlots, rejectInvalidBag, createSlotClass } from './slotsForClasses'
import { CalendarSlot, getCalendarSlotFromBag, refineCalendarSlot } from './slotsForClasses'
import { CalendarArg } from './calendar'
import { PlainDate, createPlainDate } from './plainDate'
import { calendarIdGetters, getCalendarFromSlots, neverValueOf, yearMonthGetters } from './mixins'
import { createDateModOps, createYearMonthDiffOps, createYearMonthModOps, createYearMonthMoveOps, createYearMonthRefineOps } from './calendarOpsQuery'
import { createNativeStandardOps } from '../internal/calendarNativeQuery'
import { PlainYearMonthBag, plainYearMonthWithFields, refinePlainYearMonthBag } from '../internal/bag'
import { constructPlainYearMonthSlots } from '../internal/construct'
import { movePlainYearMonth } from '../internal/move'
import { diffPlainYearMonth } from '../internal/diff'
import { plainYearMonthsEqual, compareIsoDateFields } from '../internal/compare'
import { formatPlainYearMonthIso } from '../internal/formatIso'
import { plainYearMonthToPlainDate } from '../internal/convert'
import { parsePlainYearMonth } from '../internal/parseIso'
import { prepPlainYearMonthFormat } from './dateTimeFormat'

export type PlainYearMonth = any & YearMonthFieldsIntl
export type PlainYearMonthArg = PlainYearMonth | PlainYearMonthBag<CalendarArg> | string

export const [PlainYearMonth, createPlainYearMonth, getPlainYearMonthSlots] = createSlotClass(
  PlainYearMonthBranding,
  bindArgs(constructPlainYearMonthSlots, refineCalendarSlot),
  {
    ...calendarIdGetters,
    ...yearMonthGetters,
  },
  {
    with(slots: PlainYearMonthSlots<CalendarSlot>, mod: YearMonthBag, options?: OverflowOptions): PlainYearMonth {
      return createPlainYearMonth(
        plainYearMonthWithFields(createYearMonthModOps, slots, this, rejectInvalidBag(mod), options)
      )
    },
    add(slots: PlainYearMonthSlots<CalendarSlot>, durationArg: DurationArg, options?: OverflowOptions): PlainYearMonth {
      return createPlainYearMonth(
        movePlainYearMonth(createYearMonthMoveOps, false, slots, toDurationSlots(durationArg), options)
      )
    },
    subtract(slots: PlainYearMonthSlots<CalendarSlot>, durationArg: DurationArg, options?: OverflowOptions): PlainYearMonth {
      return createPlainYearMonth(
        movePlainYearMonth(createYearMonthMoveOps, true, slots, toDurationSlots(durationArg), options)
      )
    },
    until(slots: PlainYearMonthSlots<CalendarSlot>, otherArg: PlainYearMonthArg, options?: DiffOptions): Duration {
      return createDuration(
        diffPlainYearMonth(createYearMonthDiffOps, false, slots, toPlainYearMonthSlots(otherArg), options)
      )
    },
    since(slots: PlainYearMonthSlots<CalendarSlot>, otherArg: PlainYearMonthArg, options?: DiffOptions): Duration {
      return createDuration(
        diffPlainYearMonth(createYearMonthDiffOps, true, slots, toPlainYearMonthSlots(otherArg), options)
      )
    },
    equals(slots: PlainYearMonthSlots<CalendarSlot>, otherArg: PlainYearMonthArg): boolean {
      return plainYearMonthsEqual(slots, toPlainYearMonthSlots(otherArg))
    },
    toString: formatPlainYearMonthIso,
    toJSON(slots: PlainYearMonthSlots<CalendarSlot>) {
      return formatPlainYearMonthIso(slots)
    },
    toLocaleString(slots: PlainYearMonthSlots<CalendarSlot>, locales?: LocalesArg, options?: Intl.DateTimeFormatOptions): string {
      const [format, epochMilli] = prepPlainYearMonthFormat(locales, options, slots)
      return format.format(epochMilli)
    },
    toPlainDate(slots: PlainYearMonthSlots<CalendarSlot>, bag: { day: number }): PlainDate {
      return createPlainDate(
        plainYearMonthToPlainDate(createDateModOps, slots, this, bag)
      )
    },
    getISOFields: removeBranding,
    getCalendar: getCalendarFromSlots,
    valueOf: neverValueOf,
  },
  {
    from(arg: PlainYearMonthArg, options?: OverflowOptions): PlainYearMonth {
      return createPlainYearMonth(
        toPlainYearMonthSlots(arg, options)
      )
    },
    compare(arg0: PlainYearMonthArg, arg1: PlainYearMonthArg): NumSign {
      return compareIsoDateFields(
        toPlainYearMonthSlots(arg0),
        toPlainYearMonthSlots(arg1),
      )
    },
  }
)

// Utils
// -------------------------------------------------------------------------------------------------

export function toPlainYearMonthSlots(arg: PlainYearMonthArg, options?: OverflowOptions) {
  options = copyOptions(options)

  if (isObjectLike(arg)) {
    const slots = getSlots(arg)

    if (slots && slots.branding === PlainYearMonthBranding) {
      refineOverflowOptions(options) // parse unused options
      return slots as PlainYearMonthSlots<CalendarSlot>
    }

    return refinePlainYearMonthBag(
      createYearMonthRefineOps(getCalendarSlotFromBag(arg as any)), // !!!
      arg as any, // !!!
      options,
    )
  }

  const res = parsePlainYearMonth(createNativeStandardOps, arg)
  refineOverflowOptions(options) // parse unused options
  return res
}
