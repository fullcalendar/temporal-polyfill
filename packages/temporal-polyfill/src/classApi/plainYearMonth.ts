import {
  PlainYearMonthBag,
  plainYearMonthWithFields,
  refinePlainYearMonthBag,
} from '../internal/bagRefine'
import { refineCalendarId } from '../internal/calendarId'
import { createNativeStandardOps } from '../internal/calendarNativeQuery'
import { compareIsoDateFields, plainYearMonthsEqual } from '../internal/compare'
import { constructPlainYearMonthSlots } from '../internal/construct'
import { plainYearMonthToPlainDate } from '../internal/convert'
import { diffPlainYearMonth } from '../internal/diff'
import { YearMonthBag, YearMonthFields } from '../internal/fields'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatPlainYearMonthIso } from '../internal/isoFormat'
import { parsePlainYearMonth } from '../internal/isoParse'
import { movePlainYearMonth } from '../internal/move'
import {
  DiffOptions,
  OverflowOptions,
  refineOverflowOptions,
} from '../internal/optionsRefine'
import { PlainYearMonthBranding, PlainYearMonthSlots } from '../internal/slots'
import { YearMonthUnitName } from '../internal/units'
import { NumberSign, bindArgs, isObjectLike } from '../internal/utils'
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
export type PlainYearMonthArg = PlainYearMonth | PlainYearMonthBag | string

export const [PlainYearMonth, createPlainYearMonth, getPlainYearMonthSlots] =
  createSlotClass(
    PlainYearMonthBranding,
    bindArgs(constructPlainYearMonthSlots, refineCalendarId),
    {
      ...calendarIdGetters,
      ...yearMonthGetters,
    },
    {
      with(
        slots: PlainYearMonthSlots,
        mod: YearMonthBag,
        options?: OverflowOptions,
      ): PlainYearMonth {
        return createPlainYearMonth(
          plainYearMonthWithFields(
            createNativeStandardOps,
            slots,
            this,
            rejectInvalidBag(mod),
            options,
          ),
        )
      },
      add(
        slots: PlainYearMonthSlots,
        durationArg: DurationArg,
        options?: OverflowOptions,
      ): PlainYearMonth {
        return createPlainYearMonth(
          movePlainYearMonth(
            createNativeStandardOps,
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
            createNativeStandardOps,
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
        return createDuration(
          diffPlainYearMonth(
            createNativeStandardOps,
            false,
            slots,
            toPlainYearMonthSlots(otherArg),
            options,
          ),
        )
      },
      since(
        slots: PlainYearMonthSlots,
        otherArg: PlainYearMonthArg,
        options?: DiffOptions<YearMonthUnitName>,
      ): Duration {
        return createDuration(
          diffPlainYearMonth(
            createNativeStandardOps,
            true,
            slots,
            toPlainYearMonthSlots(otherArg),
            options,
          ),
        )
      },
      equals(slots: PlainYearMonthSlots, otherArg: PlainYearMonthArg): boolean {
        return plainYearMonthsEqual(slots, toPlainYearMonthSlots(otherArg))
      },
      toPlainDate(slots: PlainYearMonthSlots, bag: { day: number }): PlainDate {
        return createPlainDate(
          plainYearMonthToPlainDate(createNativeStandardOps, slots, this, bag),
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

    return refinePlainYearMonthBag(
      createNativeStandardOps(getCalendarIdFromBag(arg as any)), // !!!
      arg as any, // !!!
      options,
    )
  }

  const res = parsePlainYearMonth(createNativeStandardOps, arg)
  refineOverflowOptions(options) // parse unused options
  return res
}
