import { DateBagStrict, DateGetterFields, MonthDayBagStrict, YearMonthBagStrict, calendarProtocolMethodNames, dateGetterNames, dateTimeFieldNames } from './calendarFields'
import { ensureString } from './cast'
import { createProtocolChecker } from './complexObjUtils'
import { IsoDateFields } from './isoFields'
import { LargestUnitOptions, OverflowOptions, refineCalendarDiffOptions } from './options'
import { defineProps, defineStringTag, excludeUndefinedProps, mapPropNames } from './utils'
import { BrandingSlots, CalendarBranding, DurationBranding, PlainDateBranding, PlainMonthDayBranding, PlainYearMonthBranding, createViaSlots, getSlots, getSpecificSlots, setSlots } from './slots'

// public
import type { PlainDateTime } from './plainDateTime'
import type { ZonedDateTime } from './zonedDateTime'
import { PlainDate, PlainDateArg, createPlainDate, toPlainDateSlots } from './plainDate'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { Duration, DurationArg, createDuration, toDurationSlots } from './duration'
import { calendarDateAdd, calendarDateUntil, calendarFields, calendarMergeFields, refineCalendarSlot, refineCalendarSlotString } from './calendarSlot'
import { queryCalendarImpl } from './calendarImpl'
import { refinePlainDateBag, refinePlainMonthDayBag, refinePlainYearMonthBag } from './convert'
import { getRequiredDateFields, getRequiredMonthDayFields, getRequiredYearMonthFields } from './calendarConfig'

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

export const checkCalendarProtocol = createProtocolChecker(calendarProtocolMethodNames)

// Calendar Class
// -------------------------------------------------------------------------------------------------

export type CalendarArg = CalendarProtocol | string | PlainDate | PlainDateTime | ZonedDateTime | PlainMonthDay | PlainYearMonth

export class Calendar implements CalendarProtocol {
  constructor(calendarId: string) {
    setSlots(this, {
      branding: CalendarBranding,
      calendar: refineCalendarSlotString(calendarId),
    } as CalendarSlots)
  }

  dateAdd(
    plainDateArg: PlainDateArg,
    durationArg: DurationArg,
    options?: OverflowOptions,
  ): PlainDate {
    const { calendar } = getCalendarSlots(this)
    return createPlainDate({
      ...calendarDateAdd(
        calendar,
        toPlainDateSlots(plainDateArg),
        toDurationSlots(durationArg),
        options,
      ),
      calendar,
      branding: PlainDateBranding,
    })
  }

  dateUntil(
    plainDateArg0: PlainDateArg,
    plainDateArg1: PlainDateArg,
    options?: LargestUnitOptions,
  ): Duration {
    const { calendar } = getCalendarSlots(this)
    return createDuration({
      branding: DurationBranding,
      ...calendarDateUntil(
        calendar,
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
    const { calendar } = getCalendarSlots(this)
    return createPlainDate({
      ...refinePlainDateBag(fields, options, calendar, getRequiredDateFields(calendar)),
      branding: PlainDateBranding,
    })
  }

  yearMonthFromFields(
    fields: YearMonthBagStrict,
    options?: OverflowOptions,
  ): PlainYearMonth {
    const { calendar } = getCalendarSlots(this)
    return createPlainYearMonth({
      ...refinePlainYearMonthBag(fields, options, calendar, getRequiredYearMonthFields(calendar)),
      branding: PlainYearMonthBranding,
    })
  }

  monthDayFromFields(
    fields: MonthDayBagStrict,
    options?: OverflowOptions,
  ): PlainMonthDay {
    const { calendar } = getCalendarSlots(this)
    return createPlainMonthDay({
      ...refinePlainMonthDayBag(fields, options, calendar, getRequiredMonthDayFields(calendar)),
      branding: PlainMonthDayBranding,
    })
  }

  fields(fieldNames: Iterable<string>): Iterable<string> {
    const { calendar } = getCalendarSlots(this)

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

    return calendarFields(calendar, fieldNamesArray)
  }

  mergeFields(
    fields0: Record<string, unknown>,
    fields1: Record<string, unknown>
  ): Record<string, unknown> {
    const { calendar } = getCalendarSlots(this)
    return calendarMergeFields(
      calendar,
      excludeUndefinedProps(ensureNotNullOrUndefined(fields0)),
      excludeUndefinedProps(ensureNotNullOrUndefined(fields1)),
    )
  }

  // TODO: more DRY
  toString(): string {
    return getCalendarSlots(this).calendar
  }

  // TODO: more DRY
  toJSON(): string {
    return getCalendarSlots(this).calendar
  }

  // TODO: more DRY
  get id(): string {
    return getCalendarSlots(this).calendar
  }

  // TODO: more DRY with constructor
  static from(arg: CalendarArg): CalendarProtocol {
    const calendarSlot = refineCalendarSlot(arg) // either string or CalendarProtocol
    return typeof calendarSlot === 'string'
      ? createCalendar({ branding: CalendarBranding, calendar: calendarSlot })
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
      const { calendar } = getCalendarSlots(this)
      const slots = getSlots(dateArg)
      const inWhitelist = whitelistName && ((slots && slots.branding) || '').includes(whitelistName)
      const isoFields = inWhitelist
        ? slots as unknown as IsoDateFields
        : toPlainDateSlots(dateArg as PlainDateArg)

      // TODO: DRY with calendarFieldFuncs
      return queryCalendarImpl(calendar)[propName](isoFields)
    }
  }, dateGetterNames) as DateGetterFieldMethods,
)

// Utils
// -------------------------------------------------------------------------------------------------

export type CalendarSlots = BrandingSlots & { calendar: string }

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
