import { DateBagStrict, MonthDayBagStrict, YearMonthBagStrict, dateFieldNamesAlpha } from '../internal/calendarFields'
import { ensureString } from '../internal/cast'
import { LargestUnitOptions, OverflowOptions, refineCalendarDiffOptions, refineOverflowOptions } from '../genericApi/options'
import { defineProps, excludeUndefinedProps } from '../internal/utils'
import { getRequiredDateFields, getRequiredMonthDayFields, getRequiredYearMonthFields } from '../internal/calendarConfig'
import { refinePlainDateBag, refinePlainMonthDayBag, refinePlainYearMonthBag } from '../genericApi/convert'
import { CalendarBranding, DurationBranding, PlainDateBranding, PlainMonthDayBranding, PlainYearMonthBranding } from '../genericApi/branding'
import { refineCalendarSlotString } from '../genericApi/calendarSlot'

// public
import { BrandingSlots, createViaSlots, getSpecificSlots, setSlots } from './slots'
import { refineCalendarSlot } from './calendarSlot'
import type { PlainDateTime } from './plainDateTime'
import type { ZonedDateTime } from './zonedDateTime'
import { PlainDate, PlainDateArg, createPlainDate, toPlainDateSlots } from './plainDate'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { NativeStandardOps } from '../internal/calendarNative'
import { createSimpleOps } from './calendarOpsQuery'
import { calendarMethods } from './publicMixins'

// Calendar Protocol
// -------------------------------------------------------------------------------------------------
// TODO: move into separate file (along with checkCalendarProtocol)

interface CalendarProtocolMethods {
  year(dateArg: PlainYearMonth | PlainDateArg): number
  month(dateArg: PlainYearMonth | PlainDateArg): number
  monthCode(dateArg: PlainYearMonth | PlainMonthDay | PlainDateArg): string
  day(dateArg: PlainMonthDay | PlainDateArg): number
  era(dateArg: PlainYearMonth | PlainDateArg): string | undefined
  eraYear(dateArg: PlainYearMonth | PlainDateArg): number | undefined
  dayOfWeek(dateArg: PlainDateArg): number
  dayOfYear(dateArg: PlainDateArg): number
  weekOfYear(dateArg: PlainDateArg): number
  yearOfWeek(dateArg: PlainDateArg): number
  daysInWeek(dateArg: PlainDateArg): number
  daysInMonth(dateArg: PlainYearMonth | PlainDateArg): number
  daysInYear(dateArg: PlainYearMonth | PlainDateArg): number
  monthsInYear(dateArg: PlainYearMonth | PlainDateArg): number
  inLeapYear(dateArg: PlainYearMonth | PlainDateArg): boolean
  dateFromFields(fields: DateBagStrict, options?: OverflowOptions): PlainDate
  yearMonthFromFields(fields: YearMonthBagStrict, options?: OverflowOptions): PlainYearMonth
  monthDayFromFields(fields: MonthDayBagStrict, options?: OverflowOptions): PlainMonthDay
  dateAdd(dateArg: PlainDateArg, duration: DurationArg, options?: OverflowOptions): PlainDate
  dateUntil(dateArg0: PlainDateArg, dateArg1: PlainDateArg, options?: LargestUnitOptions): Duration
  fields(fieldNames: Iterable<string>): Iterable<string>
  mergeFields(fields0: Record<string, unknown>, fields1: Record<string, unknown>): Record<string, unknown>
  toString?(): string;
  toJSON?(): string;
}

export interface CalendarProtocol extends CalendarProtocolMethods {
  id: string
}

// Calendar Class
// -------------------------------------------------------------------------------------------------

export type CalendarArg = CalendarProtocol | string | PlainDate | PlainDateTime | ZonedDateTime | PlainMonthDay | PlainYearMonth

export class Calendar implements CalendarProtocol {
  constructor(id: string) {
    setSlots(this, {
      branding: CalendarBranding,
      id: refineCalendarSlotString(id), // TODO: wasteful if we query the impl anyway
      ops: createSimpleOps(id),
    } as CalendarClassSlots)
  }

  // -----------------------------------------------------------------------------------------------

  dateAdd(
    plainDateArg: PlainDateArg,
    durationArg: DurationArg,
    options?: OverflowOptions,
  ): PlainDate {
    const { id, ops } = getCalendarSlots(this)

    return createPlainDate({
      ...ops.dateAdd(
        toPlainDateSlots(plainDateArg),
        toDurationSlots(durationArg),
        refineOverflowOptions(options),
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
    const { ops } = getCalendarSlots(this)

    return createDuration({
      branding: DurationBranding,
      ...ops.dateUntil(
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
    const { id, ops } = getCalendarSlots(this)

    return createPlainDate({
      ...refinePlainDateBag(ops, fields, options, getRequiredDateFields(id)),
      calendar: id,
      branding: PlainDateBranding,
    })
  }

  yearMonthFromFields(
    fields: YearMonthBagStrict,
    options?: OverflowOptions,
  ): PlainYearMonth {
    const { id, ops } = getCalendarSlots(this)

    return createPlainYearMonth({
      ...refinePlainYearMonthBag(ops, fields, options, getRequiredYearMonthFields(id)),
      calendar: id,
      branding: PlainYearMonthBranding,
    })
  }

  monthDayFromFields(
    fields: MonthDayBagStrict,
    options?: OverflowOptions,
  ): PlainMonthDay {
    const { id, ops } = getCalendarSlots(this)

    return createPlainMonthDay({
      ...refinePlainMonthDayBag(ops, false, fields, options, getRequiredMonthDayFields(id)),
      calendar: id,
      branding: PlainMonthDayBranding,
    })
  }

  fields(fieldNames: Iterable<string>): Iterable<string> {
    const { ops } = getCalendarSlots(this)

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

    return ops.fields(fieldNamesArray)
  }

  mergeFields(
    fields0: Record<string, unknown>,
    fields1: Record<string, unknown>
  ): Record<string, unknown> {
    const { ops } = getCalendarSlots(this)

    return ops.mergeFields(
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

// Utils
// -------------------------------------------------------------------------------------------------

export type CalendarClassSlots = BrandingSlots & { // TODO: move to top
  id: string,
  ops: NativeStandardOps
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
