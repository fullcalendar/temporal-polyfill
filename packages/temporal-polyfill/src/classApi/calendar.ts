import { DateBagStrict, MonthDayBagStrict, YearMonthBagStrict, dateFieldNamesAlpha } from '../internal/calendarFields'
import { requireDefined, requireString } from '../internal/cast'
import { LargestUnitOptions, OverflowOptions, refineCalendarDiffOptions } from '../internal/optionsRefine'
import { excludeUndefinedProps } from '../internal/utils'
import { getRequiredDateFields, getRequiredMonthDayFields, getRequiredYearMonthFields } from '../internal/calendarConfig'
import { createSlotClass, createViaSlots, getSpecificSlots } from './slotsForClasses'
import { refineCalendarSlot } from './slotsForClasses'
import { PlainDateTime } from './plainDateTime'
import { ZonedDateTime } from './zonedDateTime'
import { PlainDate, PlainDateArg, createPlainDate, toPlainDateSlots } from './plainDate'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { NativeStandardOps } from '../internal/calendarNative'
import { calendarMethods } from './mixins'
import { createNativeStandardOps, normalizeCalendarId } from '../internal/calendarNativeQuery'
import { CalendarProtocol } from './calendarProtocol'
import { refinePlainDateBag, refinePlainMonthDayBag, refinePlainYearMonthBag } from '../internal/bag'
import { BrandingSlots, CalendarBranding, createDurationSlots, createPlainDateSlots } from '../internal/slots'
import * as errorMessages from '../internal/errorMessages'

export type Calendar = any
export type CalendarArg = CalendarProtocol | string | PlainDate | PlainDateTime | ZonedDateTime | PlainMonthDay | PlainYearMonth
export type CalendarClassSlots = BrandingSlots & {
  id: string,
  native: NativeStandardOps
}

export const Calendar = createSlotClass(
  CalendarBranding,
  (id: string): CalendarClassSlots => {
    id = normalizeCalendarId(requireString(id))
    const calendarNative = createNativeStandardOps(id)
    return {
      branding: CalendarBranding,
      id,
      native: calendarNative,
    }
  },
  {
    id(slots: CalendarClassSlots): string {
      return slots.id
    }
  },
  {
    dateAdd(
      { id, native }: CalendarClassSlots,
      plainDateArg: PlainDateArg,
      durationArg: DurationArg,
      options?: OverflowOptions,
    ): PlainDate {
      return createPlainDate(
        createPlainDateSlots(
          native.dateAdd(
            toPlainDateSlots(plainDateArg),
            toDurationSlots(durationArg),
            options,
          ),
          id,
        )
      )
    },
    dateUntil(
      { native }: CalendarClassSlots,
      plainDateArg0: PlainDateArg,
      plainDateArg1: PlainDateArg,
      options?: LargestUnitOptions,
    ): Duration {
      return createDuration(
        createDurationSlots(
          native.dateUntil(
            toPlainDateSlots(plainDateArg0),
            toPlainDateSlots(plainDateArg1),
            refineCalendarDiffOptions(options),
          )
        )
      )
    },
    dateFromFields(
      { id, native }: CalendarClassSlots,
      fields: DateBagStrict,
      options?: OverflowOptions,
    ): PlainDate {
      return createPlainDate(
        refinePlainDateBag(native, fields, options, getRequiredDateFields(id)),
      )
    },
    yearMonthFromFields(
      { id, native }: CalendarClassSlots,
      fields: YearMonthBagStrict,
      options?: OverflowOptions,
    ): PlainYearMonth {
      return createPlainYearMonth(
        refinePlainYearMonthBag(native, fields, options, getRequiredYearMonthFields(id)),
      )
    },
    monthDayFromFields(
      { id, native }: CalendarClassSlots,
      fields: MonthDayBagStrict,
      options?: OverflowOptions,
    ): PlainMonthDay {
      return createPlainMonthDay(
        refinePlainMonthDayBag(native, false, fields, options, getRequiredMonthDayFields(id)),
      )
    },
    fields({ native }: CalendarClassSlots, fieldNames: Iterable<string>): Iterable<string> {
      /*
      Bespoke logic for converting Iterable to string[], while doing some validation
      */
      const allowed = new Set<string>(dateFieldNamesAlpha)
      const fieldNamesArray: string[] = []

      for (const fieldName of fieldNames) {
        requireString(fieldName)

        if (!allowed.has(fieldName)) {
          throw new RangeError(errorMessages.forbiddenField(fieldName))
        }

        allowed.delete(fieldName) // prevents duplicates! can this be done somewhere else?
        fieldNamesArray.push(fieldName)
      }

      return native.fields(fieldNamesArray)
    },
    mergeFields(
      { native }: CalendarClassSlots,
      fields0: Record<string, unknown>,
      fields1: Record<string, unknown>
    ): Record<string, unknown> {
      return native.mergeFields(
        excludeUndefinedProps(requireDefined(fields0)),
        excludeUndefinedProps(requireDefined(fields1)),
      )
    },
    toString(slots: CalendarClassSlots) {
      return slots.id
    },
    toJSON(slots: CalendarClassSlots) {
      return slots.id
    },
    ...calendarMethods,
  },
  {
    from(arg: CalendarArg): CalendarProtocol {
      const calendarSlot = refineCalendarSlot(arg) // either string or CalendarProtocol
      return typeof calendarSlot === 'string'
        ? new Calendar(calendarSlot)
        : calendarSlot
    }
  }
)

// Utils
// -------------------------------------------------------------------------------------------------

export function createCalendar(slots: CalendarClassSlots): Calendar {
  return createViaSlots(Calendar, slots)
}

export function getCalendarSlots(calendar: Calendar): CalendarClassSlots {
  return getSpecificSlots(CalendarBranding, calendar) as CalendarClassSlots
}
