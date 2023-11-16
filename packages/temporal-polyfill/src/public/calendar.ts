import { DateBagStrict, DateGetterFields, MonthDayBagStrict, YearMonthBagStrict, dateFieldNames, dateGetterNames, dateTimeFieldNames } from '../internal/calendarFields'
import { ensureString } from '../internal/cast'
import { IsoDateFields } from '../internal/isoFields'
import { LargestUnitOptions, OverflowOptions, refineCalendarDiffOptions } from '../internal/options'
import { defineProps, defineStringTag, excludeUndefinedProps, mapPropNames } from '../internal/utils'
import { BrandingSlots, CalendarBranding, DurationBranding, PlainDateBranding, PlainMonthDayBranding, PlainYearMonthBranding, createViaSlots, getSlots, getSpecificSlots, setSlots } from '../internal/slots'

// public
import type { PlainDateTime } from './plainDateTime'
import type { ZonedDateTime } from './zonedDateTime'
import { PlainDate, PlainDateArg, createPlainDate, toPlainDateSlots } from './plainDate'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { calendarDateAdd, calendarDateUntil, calendarFields, calendarMergeFields, refineCalendarSlot, refineCalendarSlotString } from '../internal/calendarSlot'
import { queryCalendarImpl } from '../internal/calendarImpl'
import { refinePlainDateBag, refinePlainMonthDayBag, refinePlainYearMonthBag } from '../internal/convert'
import { getRequiredDateFields, getRequiredMonthDayFields, getRequiredYearMonthFields } from '../internal/calendarConfig'
import { calendarDateUntilEasy } from '../internal/diff'

// Calendar Protocol
// -------------------------------------------------------------------------------------------------

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
      id: refineCalendarSlotString(id),
    } as CalendarSlots)
  }

  dateAdd(
    plainDateArg: PlainDateArg,
    durationArg: DurationArg,
    options?: OverflowOptions,
  ): PlainDate {
    const { id } = getCalendarSlots(this)
    return createPlainDate({
      ...calendarDateAdd(
        id,
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
    const { id } = getCalendarSlots(this)
    return createDuration({
      branding: DurationBranding,
      ...calendarDateUntilEasy(
        id,
        toPlainDateSlots(plainDateArg0),
        toPlainDateSlots(plainDateArg1),
        refineCalendarDiffOptions(options),
        options,
      )
    })
  }

  dateFromFields(
    fields: DateBagStrict,
    options?: OverflowOptions,
  ): PlainDate {
    const { id } = getCalendarSlots(this)
    return createPlainDate({
      ...refinePlainDateBag(fields, options, id, getRequiredDateFields(id)),
      branding: PlainDateBranding,
    })
  }

  yearMonthFromFields(
    fields: YearMonthBagStrict,
    options?: OverflowOptions,
  ): PlainYearMonth {
    const { id } = getCalendarSlots(this)
    return createPlainYearMonth({
      ...refinePlainYearMonthBag(fields, options, id, getRequiredYearMonthFields(id)),
      branding: PlainYearMonthBranding,
    })
  }

  monthDayFromFields(
    fields: MonthDayBagStrict,
    options?: OverflowOptions,
  ): PlainMonthDay {
    const { id } = getCalendarSlots(this)
    return createPlainMonthDay({
      ...refinePlainMonthDayBag(fields, options, id, getRequiredMonthDayFields(id)),
      branding: PlainMonthDayBranding,
    })
  }

  fields(fieldNames: Iterable<string>): Iterable<string> {
    const { id } = getCalendarSlots(this)

    /*
    Bespoke logic for converting Iterable to string[], while doing some validation
    */
    const allowed = new Set<string>(dateFieldNames)
    const fieldNamesArray: string[] = []

    for (const fieldName of fieldNames) {
      ensureString(fieldName)

      if (!allowed.has(fieldName)) {
        throw new RangeError('Invalid field name')
      }

      allowed.delete(fieldName) // prevents duplicates! can this be done somewhere else?
      fieldNamesArray.push(fieldName)
    }

    return calendarFields(id, fieldNamesArray)
  }

  mergeFields(
    fields0: Record<string, unknown>,
    fields1: Record<string, unknown>
  ): Record<string, unknown> {
    const { id } = getCalendarSlots(this)
    return calendarMergeFields(
      id,
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
      ? createCalendar({ branding: CalendarBranding, id: calendarSlot })
      : calendarSlot
  }
}

// Mixin
// -------------------------------------------------------------------------------------------------

type DateArg = PlainYearMonth | PlainMonthDay | PlainDateTime | PlainDateArg

type DateGetterFieldMethods = {
  [K in keyof DateGetterFields]: (dateArg: DateArg) => DateGetterFields[K]
}

export interface Calendar extends DateGetterFieldMethods {}

// TODO: compress this somehow
const dateArgWhitelist: Record<string, string> = {
  era: 'PlainYearMonth',
  eraYear: 'PlainYearMonth',
  year: 'PlainYearMonth',
  daysInYear: 'PlainYearMonth',
  monthsInYear: 'PlainYearMonth',
  inLeapYear: 'PlainYearMonth',
  daysInMonth: 'PlainYearMonth',
  month: 'PlainYearMonth',
  monthCode: 'Month', // PlainYearMonth or PlainMonthDay
  day: 'PlainMonthDay',
}

defineStringTag(Calendar.prototype, CalendarBranding)

defineProps(
  Calendar.prototype,
  mapPropNames((propName: keyof DateGetterFields) => {
    const whitelistName = dateArgWhitelist[propName]

    return function(this: Calendar, dateArg: DateArg) {
      const { id } = getCalendarSlots(this)
      const slots = getSlots(dateArg)
      const inWhitelist = whitelistName && ((slots && slots.branding) || '').includes(whitelistName)
      const isoFields = inWhitelist
        ? slots as unknown as IsoDateFields
        : toPlainDateSlots(dateArg as PlainDateArg)

      // TODO: DRY with calendarFieldFuncs
      return queryCalendarImpl(id)[propName](isoFields)
    }
  }, dateGetterNames) as DateGetterFieldMethods,
)

// Utils
// -------------------------------------------------------------------------------------------------

export type CalendarSlots = BrandingSlots & { id: string }

export function createCalendar(slots: CalendarSlots): Calendar {
  return createViaSlots(Calendar, slots)
}

export function getCalendarSlots(calendar: Calendar): CalendarSlots {
  return getSpecificSlots(CalendarBranding, calendar) as CalendarSlots
}

// HACK
function ensureNotNullOrUndefined<T>(o: T): T {
  if (o == null) { // null or undefined
    throw TypeError('Cannot be null or undefined')
  }
  return o
}
