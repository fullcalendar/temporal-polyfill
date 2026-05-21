import { PlainYearMonthBranding } from '../apiHelpers/branding'
import { prepPlainYearMonthFormat } from '../apiHelpers/intlFormatConfig'
import { calendarIdGetters, yearMonthGetters } from '../apiHelpers/mixins'
import {
  createSlotClass,
  getBrandingAndSlots,
  rejectInvalidBag,
} from '../apiHelpers/slotClass'
import { resolveCoreCalendar } from '../internal/calendarResolver'
import { compareIsoDateFields, plainYearMonthsEqual } from '../internal/compare'
import { convertPlainYearMonthToDate } from '../internal/convert'
import { refinePlainYearMonthObjectLike } from '../internal/createFromFields'
import { diffPlainYearMonth, getCommonCalendar } from '../internal/diff'
import { InternalCalendar } from '../internal/externalCalendar'
import { CalendarDateFields, YearMonthLikeObject } from '../internal/fieldTypes'
import { YearMonthFields } from '../internal/fieldTypes'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatPlainYearMonthIso } from '../internal/isoFormat'
import { parsePlainYearMonth } from '../internal/isoParse'
import { mergePlainYearMonthFields } from '../internal/merge'
import { movePlainYearMonth } from '../internal/move'
import { refineOverflowOptions } from '../internal/optionsFieldRefine'
import { DiffOptions, OverflowOptions } from '../internal/optionsModel'
import { YearMonthUnitName } from '../internal/units'
import { NumberSign, isObjectLike } from '../internal/utils'
import { getCalendarFromBag } from './calendarArg'
import { constructYearMonthSlots } from './construct'
import {
  Duration,
  DurationArg,
  createDuration,
  toDurationSlots,
} from './duration'
import { PlainDate, createPlainDate } from './plainDate'

export type PlainYearMonth = YearMonthFields // and other getters/methods
export type PlainYearMonthArg = PlainYearMonth | YearMonthLikeObject | string

export const [PlainYearMonth, createPlainYearMonth, getPlainYearMonthSlots] =
  createSlotClass(
    PlainYearMonthBranding,
    constructYearMonthSlots,
    formatPlainYearMonthIso,
    {
      ...calendarIdGetters,
      ...yearMonthGetters,
    },
    {
      with(
        slots: CalendarDateFields & { calendar: InternalCalendar },
        mod: Partial<YearMonthFields>,
        options?: OverflowOptions,
      ): PlainYearMonth {
        return createPlainYearMonth(
          mergePlainYearMonthFields(slots, rejectInvalidBag(mod), options),
        )
      },
      add(
        slots: CalendarDateFields & { calendar: InternalCalendar },
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
        slots: CalendarDateFields & { calendar: InternalCalendar },
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
        slots: CalendarDateFields & { calendar: InternalCalendar },
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
        slots: CalendarDateFields & { calendar: InternalCalendar },
        otherArg: PlainYearMonthArg,
        options?: DiffOptions<YearMonthUnitName>,
      ): Duration {
        const other = toPlainYearMonthSlots(otherArg)
        const calendar = getCommonCalendar(slots.calendar, other.calendar)
        return createDuration(
          diffPlainYearMonth(true, calendar, slots, other, options),
        )
      },
      equals(
        slots: CalendarDateFields & { calendar: InternalCalendar },
        otherArg: PlainYearMonthArg,
      ): boolean {
        return plainYearMonthsEqual(slots, toPlainYearMonthSlots(otherArg))
      },
      toPlainDate(
        this: PlainYearMonth,
        slots: CalendarDateFields & { calendar: InternalCalendar },
        bag: { day: number },
      ): PlainDate {
        return createPlainDate(
          convertPlainYearMonthToDate(slots.calendar, this, bag),
        )
      },
      toLocaleString(
        slots: CalendarDateFields & { calendar: InternalCalendar },
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
  )

// Utils
// -----------------------------------------------------------------------------

export function toPlainYearMonthSlots(
  arg: PlainYearMonthArg,
  options?: OverflowOptions,
) {
  if (isObjectLike(arg)) {
    const brandingAndSlots = getBrandingAndSlots(arg)

    if (brandingAndSlots && brandingAndSlots[0] === PlainYearMonthBranding) {
      refineOverflowOptions(options) // parse unused options
      return brandingAndSlots[1] as CalendarDateFields & {
        calendar: InternalCalendar
      }
    }

    const calendar = getCalendarFromBag(arg as any)
    return refinePlainYearMonthObjectLike(calendar, arg as any, options)
  }

  const res = parsePlainYearMonth(arg, resolveCoreCalendar)
  refineOverflowOptions(options) // parse unused options
  return res
}
