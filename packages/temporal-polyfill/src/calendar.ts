import { DateBagStrict, DateGetterFields, MonthDayBagStrict, YearMonthBagStrict, calendarProtocolMethodNames, dateGetterNames, dateTimeFieldNames } from './calendarFields'
import { CalendarImpl, queryCalendarImpl } from './calendarImpl'
import { queryCalendarPublic } from './calendarPublic'
import { ensureString } from './cast'
import { createProtocolChecker } from './complexObjUtils'
import {
  refinePlainDateBag,
  refinePlainMonthDayBag,
  refinePlainYearMonthBag,
} from './convert'
import { IsoDateFields } from './isoFields'
import {
  LargestUnitOptions,
  OverflowOptions,
  refineCalendarDiffOptions,
  refineOverflowOptions,
} from './options'
import { defineProps, defineStringTag, excludeUndefinedProps, mapPropNames } from './utils'
import { BrandingSlots, CalendarBranding, DurationBranding, PlainDateBranding, PlainMonthDayBranding, PlainYearMonthBranding, createViaSlots, getSlots, setSlots } from './slots'

// public
import type { PlainDateTime } from './plainDateTime'
import type { ZonedDateTime } from './zonedDateTime'
import { PlainDate, PlainDateArg, createPlainDate, toPlainDateSlots } from './plainDate'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'

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
  dateUntil(dateArg0: PlainDateArg, dateArg1: PlainDateArg, options: LargestUnitOptions): Duration
  fields(fieldNames: Iterable<string>): Iterable<string>
  mergeFields(fields0: Record<string, unknown>, fields1: Record<string, unknown>): Record<string, unknown>
  toString?(): string;
  toJSON?(): string;
}

export interface CalendarProtocol extends CalendarProtocolMethods {
  id: string
}

export const checkCalendarProtocol = createProtocolChecker(calendarProtocolMethodNames)

// Calendar Class
// -------------------------------------------------------------------------------------------------

export type CalendarArg = CalendarProtocol | string | PlainDate | PlainDateTime | ZonedDateTime | PlainMonthDay | PlainYearMonth

export class Calendar implements CalendarProtocol {
  constructor(calendarId: string) {
    setSlots(this, {
      branding: CalendarBranding,
      impl: queryCalendarImpl(calendarId),
    } as CalendarSlots)
  }

  dateAdd(
    plainDateArg: PlainDateArg,
    durationArg: DurationArg,
    options?: OverflowOptions,
  ): PlainDate {
    const { impl } = getCalendarSlots(this)
    return createPlainDate({
      ...impl.dateAdd(
        toPlainDateSlots(plainDateArg),
        toDurationSlots(durationArg),
        refineOverflowOptions(options),
      ),
      branding: PlainDateBranding,
    })
  }

  dateUntil(
    plainDateArg0: PlainDateArg,
    plainDateArg1: PlainDateArg,
    options?: LargestUnitOptions,
  ): Duration {
    const { impl } = getCalendarSlots(this)
    return createDuration({
      branding: DurationBranding,
      ...impl.dateUntil(
        toPlainDateSlots(plainDateArg0),
        toPlainDateSlots(plainDateArg1),
        refineCalendarDiffOptions(options),
      ),
    })
  }

  dateFromFields(
    fields: DateBagStrict,
    options?: OverflowOptions,
  ): PlainDate {
    const { impl } = getCalendarSlots(this)
    return createPlainDate({
      ...refinePlainDateBag(fields, options, impl),
      branding: PlainDateBranding,
    })
  }

  yearMonthFromFields(
    fields: YearMonthBagStrict,
    options?: OverflowOptions,
  ): PlainYearMonth {
    const { impl } = getCalendarSlots(this)
    return createPlainYearMonth({
      branding: PlainYearMonthBranding,
      ...refinePlainYearMonthBag(fields, options, impl)
    })
  }

  monthDayFromFields(
    fields: MonthDayBagStrict,
    options?: OverflowOptions,
  ): PlainMonthDay {
    const { impl } = getCalendarSlots(this)
    return createPlainMonthDay({
      branding: PlainMonthDayBranding,
      ...refinePlainMonthDayBag(fields, options, impl)
    })
  }

  fields(fieldNames: Iterable<string>): Iterable<string> {
    const { impl } = getCalendarSlots(this)

    /*
    Bespoke logic for converting Iterable to string[], while doing some validation
    */
    const allowed = new Set<string>(dateTimeFieldNames)
    const fieldNamesArray: string[] = []

    for (const fieldName of fieldNames) {
      ensureString(fieldName)

      if (!allowed.has(fieldName)) {
        throw new RangeError('Invalid field name')
      }

      allowed.delete(fieldName) // prevents duplicates! can this be done somewhere else?
      fieldNamesArray.push(fieldName)
    }

    return impl.fields(fieldNamesArray)
  }

  mergeFields(
    fields0: Record<string, unknown>,
    fields1: Record<string, unknown>
  ): Record<string, unknown> {
    const { impl } = getCalendarSlots(this)
    return impl.mergeFields(
      excludeUndefinedProps(ensureNotNullOrUndefined(fields0)),
      excludeUndefinedProps(ensureNotNullOrUndefined(fields1)),
    )
  }

  // TODO: more DRY
  toString(): string {
    return getCalendarSlots(this).impl.id
  }

  // TODO: more DRY
  toJSON(): string {
    return getCalendarSlots(this).impl.id
  }

  // TODO: more DRY
  get id(): string {
    return getCalendarSlots(this).impl.id
  }

  static from(arg: CalendarArg): CalendarProtocol {
    return queryCalendarPublic(arg)
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
      const { impl } = getCalendarSlots(this)
      const slots = getSlots(dateArg)
      const inWhitelist = whitelistName && ((slots && slots.branding) || '').includes(whitelistName)
      const isoFields = inWhitelist
        ? slots as unknown as IsoDateFields
        : toPlainDateSlots(dateArg as PlainDateArg)

      return impl[propName](isoFields)
    }
  }, dateGetterNames) as DateGetterFieldMethods,
)

// Utils
// -------------------------------------------------------------------------------------------------

export type CalendarSlots = BrandingSlots & { impl: CalendarImpl }

export function createCalendar(slots: CalendarSlots): Calendar {
  return createViaSlots(Calendar, slots)
}

export function getCalendarSlots(calendar: Calendar): CalendarSlots {
  return getSlots(calendar) as CalendarSlots
}

// HACK
function ensureNotNullOrUndefined<T>(o: T): T {
  if (o == null) { // null or undefined
    throw TypeError('Cannot be null or undefined')
  }
  return o
}
