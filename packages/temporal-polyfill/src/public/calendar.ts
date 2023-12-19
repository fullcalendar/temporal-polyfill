import { DateBagStrict, MonthDayBagStrict, YearMonthBagStrict, dateFieldNamesAlpha } from '../internal/calendarFields'
import { ensureString } from '../internal/cast'
import { LargestUnitOptions, OverflowOptions, refineCalendarDiffOptions, refineOverflowOptions } from '../genericApi/optionsRefine'
import { defineProps, defineStringTag, excludeUndefinedProps } from '../internal/utils'
import { getRequiredDateFields, getRequiredMonthDayFields, getRequiredYearMonthFields } from '../internal/calendarConfig'
import { refinePlainDateBag, refinePlainMonthDayBag, refinePlainYearMonthBag } from '../genericApi/bagGeneric'
import { CalendarBranding, DurationBranding, PlainDateBranding, PlainMonthDayBranding, PlainYearMonthBranding } from '../genericApi/branding'

// public
import { BrandingSlots, createViaSlots, getSpecificSlots, setSlots } from './slotsForClasses'
import { refineCalendarSlot } from './calendarSlot'
import type { PlainDateTime } from './plainDateTime'
import type { ZonedDateTime } from './zonedDateTime'
import { PlainDate, PlainDateArg, createPlainDate, toPlainDateSlots } from './plainDate'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { NativeStandardOps } from '../internal/calendarNative'
import { calendarMethods } from './mixins'
import { createNativeStandardOps } from '../internal/calendarNativeQuery'
import { CalendarProtocol } from './calendarProtocol'
import { normalizeCalendarId } from '../internal/parseIso'

// Calendar Class
// -------------------------------------------------------------------------------------------------

export type CalendarArg = CalendarProtocol | string | PlainDate | PlainDateTime | ZonedDateTime | PlainMonthDay | PlainYearMonth

export class Calendar implements CalendarProtocol {
  constructor(id: string) {
    id = normalizeCalendarId(ensureString(id))
    const calendarNative = createNativeStandardOps(id)

    setSlots(this, {
      branding: CalendarBranding,
      id,
      native: calendarNative,
    } as CalendarClassSlots)
  }

  // -----------------------------------------------------------------------------------------------

  dateAdd(
    plainDateArg: PlainDateArg,
    durationArg: DurationArg,
    options?: OverflowOptions,
  ): PlainDate {
    const { id, native } = getCalendarSlots(this)

    return createPlainDate({
      ...native.dateAdd(
        toPlainDateSlots(plainDateArg),
        toDurationSlots(durationArg),
        options,
      ),
      calendar: id,
      branding: PlainDateBranding,
    })
  }

  dateUntil(
    plainDateArg0: PlainDateArg,
    plainDateArg1: PlainDateArg,
    options?: LargestUnitOptions,
  ): Duration {
    const { native } = getCalendarSlots(this)

    return createDuration({
      branding: DurationBranding,
      ...native.dateUntil(
        toPlainDateSlots(plainDateArg0),
        toPlainDateSlots(plainDateArg1),
        refineCalendarDiffOptions(options),
      )
    })
  }

  dateFromFields(
    fields: DateBagStrict,
    options?: OverflowOptions,
  ): PlainDate {
    const { id, native } = getCalendarSlots(this)

    return createPlainDate({
      ...refinePlainDateBag(native, fields, options, getRequiredDateFields(id)),
      branding: PlainDateBranding,
    })
  }

  yearMonthFromFields(
    fields: YearMonthBagStrict,
    options?: OverflowOptions,
  ): PlainYearMonth {
    const { id, native } = getCalendarSlots(this)

    return createPlainYearMonth({
      ...refinePlainYearMonthBag(native, fields, options, getRequiredYearMonthFields(id)),
      branding: PlainYearMonthBranding,
    })
  }

  monthDayFromFields(
    fields: MonthDayBagStrict,
    options?: OverflowOptions,
  ): PlainMonthDay {
    const { id, native } = getCalendarSlots(this)

    return createPlainMonthDay({
      ...refinePlainMonthDayBag(native, false, fields, options, getRequiredMonthDayFields(id)),
      branding: PlainMonthDayBranding,
    })
  }

  fields(fieldNames: Iterable<string>): Iterable<string> {
    const { native } = getCalendarSlots(this)

    /*
    Bespoke logic for converting Iterable to string[], while doing some validation
    */
    const allowed = new Set<string>(dateFieldNamesAlpha)
    const fieldNamesArray: string[] = []

    for (const fieldName of fieldNames) {
      ensureString(fieldName)

      if (!allowed.has(fieldName)) {
        throw new RangeError('Invalid field name')
      }

      allowed.delete(fieldName) // prevents duplicates! can this be done somewhere else?
      fieldNamesArray.push(fieldName)
    }

    return native.fields(fieldNamesArray)
  }

  mergeFields(
    fields0: Record<string, unknown>,
    fields1: Record<string, unknown>
  ): Record<string, unknown> {
    const { native } = getCalendarSlots(this)

    return native.mergeFields(
      excludeUndefinedProps(ensureNotNullOrUndefined(fields0)),
      excludeUndefinedProps(ensureNotNullOrUndefined(fields1)),
    )
  }

  // TODO: more DRY
  toString(): string {
    return getCalendarSlots(this).id
  }

  // TODO: more DRY
  toJSON(): string {
    return getCalendarSlots(this).id
  }

  // TODO: more DRY
  get id(): string {
    return getCalendarSlots(this).id
  }

  // TODO: more DRY with constructor, TimeZone
  static from(arg: CalendarArg): CalendarProtocol {
    const calendarSlot = refineCalendarSlot(arg) // either string or CalendarProtocol
    return typeof calendarSlot === 'string'
      ? new Calendar(calendarSlot)
      : calendarSlot
  }
}

type DateGetterFields = {
  [k in keyof typeof calendarMethods]: any
}

export interface Calendar extends DateGetterFields {}

defineProps(Calendar.prototype, calendarMethods)

defineStringTag(Calendar.prototype, CalendarBranding)

// Utils
// -------------------------------------------------------------------------------------------------

export type CalendarClassSlots = BrandingSlots & { // TODO: move to top
  id: string,
  native: NativeStandardOps
}

export function createCalendar(slots: CalendarClassSlots): Calendar {
  return createViaSlots(Calendar, slots)
}

export function getCalendarSlots(calendar: Calendar): CalendarClassSlots {
  return getSpecificSlots(CalendarBranding, calendar) as CalendarClassSlots
}

// HACK
function ensureNotNullOrUndefined<T>(o: T): T {
  if (o == null) { // null or undefined
    throw TypeError('Cannot be null or undefined')
  }
  return o
}
