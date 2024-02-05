import {
  refinePlainDateBag,
  refinePlainMonthDayBag,
  refinePlainYearMonthBag,
} from '../internal/bagRefine'
import {
  getRequiredDateFields,
  getRequiredMonthDayFields,
  getRequiredYearMonthFields,
  isoCalendarId,
} from '../internal/calendarConfig'
import { resolveCalendarId } from '../internal/calendarId'
import { NativeStandardOps } from '../internal/calendarNative'
import { createNativeStandardOps } from '../internal/calendarNativeQuery'
import { requireNonNullish, requireString } from '../internal/cast'
import * as errorMessages from '../internal/errorMessages'
import {
  DateBagStrict,
  MonthDayBagStrict,
  YearMonthBagStrict,
  dateFieldNamesAlpha,
} from '../internal/fields'
import { parseCalendarId } from '../internal/isoParse'
import {
  LargestUnitOptions,
  OverflowOptions,
  refineCalendarDiffOptions,
} from '../internal/optionsRefine'
import {
  BrandingSlots,
  createDurationSlots,
  createPlainDateSlots,
} from '../internal/slots'
import { excludeUndefinedProps, isObjectLike } from '../internal/utils'
import {
  Duration,
  DurationArg,
  createDuration,
  toDurationSlots,
} from './duration'
import { calendarFieldMethods } from './mixins'
import {
  PlainDate,
  PlainDateArg,
  createPlainDate,
  toPlainDateSlots,
} from './plainDate'
import { PlainDateTime } from './plainDateTime'
import { PlainMonthDay, createPlainMonthDay } from './plainMonthDay'
import { PlainYearMonth, createPlainYearMonth } from './plainYearMonth'
import { createProtocolValidator, createSlotClass, getSlots } from './slotClass'
import { ZonedDateTime } from './zonedDateTime'

export type Calendar = any
export type CalendarArg =
  | CalendarProtocol
  | string
  | PlainDate
  | PlainDateTime
  | ZonedDateTime
  | PlainMonthDay
  | PlainYearMonth

export type CalendarClassSlots = BrandingSlots & {
  id: string
  native: NativeStandardOps
}

// Order matters. See call to createProtocolChecker
const calendarMethods = {
  toString(slots: CalendarClassSlots) {
    return slots.id
  },
  toJSON(slots: CalendarClassSlots) {
    return slots.id
  },
  ...calendarFieldMethods,
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
      ),
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
        ),
      ),
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
      refinePlainYearMonthBag(
        native,
        fields,
        options,
        getRequiredYearMonthFields(id),
      ),
    )
  },
  monthDayFromFields(
    { id, native }: CalendarClassSlots,
    fields: MonthDayBagStrict,
    options?: OverflowOptions,
  ): PlainMonthDay {
    return createPlainMonthDay(
      refinePlainMonthDayBag(
        native,
        false,
        fields,
        options,
        getRequiredMonthDayFields(id),
      ),
    )
  },
  fields(
    { native }: CalendarClassSlots,
    fieldNames: Iterable<string>,
  ): Iterable<string> {
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
    fields1: Record<string, unknown>,
  ): Record<string, unknown> {
    return native.mergeFields(
      excludeUndefinedProps(requireNonNullish(fields0)),
      excludeUndefinedProps(requireNonNullish(fields1)),
    )
  },
}

export const [Calendar] = createSlotClass(
  'Calendar',
  (id: string): CalendarClassSlots => {
    const slotId = resolveCalendarId(requireString(id))
    const calendarNative = createNativeStandardOps(slotId)
    return {
      branding: 'Calendar',
      id: slotId,
      native: calendarNative,
    }
  },
  {
    id(slots: CalendarClassSlots) {
      return slots.id
    },
  },
  calendarMethods,
  {
    from(arg: CalendarArg): CalendarProtocol {
      const calendarSlot = refineCalendarSlot(arg) // either string or CalendarProtocol
      return typeof calendarSlot === 'string'
        ? new Calendar(calendarSlot)
        : calendarSlot
    },
  },
)

// Slot
// -----------------------------------------------------------------------------

export type CalendarSlot = CalendarProtocol | string

export function getCalendarSlotFromBag(bag: {
  calendar?: CalendarArg
}): CalendarSlot {
  return extractCalendarSlotFromBag(bag) || isoCalendarId
}

export function extractCalendarSlotFromBag(bag: { calendar?: CalendarArg }):
  | CalendarSlot
  | undefined {
  const { calendar } = bag
  if (calendar !== undefined) {
    return refineCalendarSlot(calendar)
  }
}

export function refineCalendarSlot(arg: CalendarArg): CalendarSlot {
  if (isObjectLike(arg)) {
    return (
      ((getSlots(arg) || {}) as { calendar?: CalendarSlot }).calendar ||
      validateCalendarProtocol(arg)
    )
  }
  return refineCalendarSlotString(arg)
}

function refineCalendarSlotString(arg: string): string {
  return resolveCalendarId(parseCalendarId(requireString(arg)))
}

const validateCalendarProtocol = createProtocolValidator(
  // remove toString/toJSON/era/eraYear
  Object.keys(calendarMethods).slice(4),
)

// Protocol
// -----------------------------------------------------------------------------
// TODO: eventually use temporal-spec

export interface CalendarProtocol {
  id: string
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
  yearMonthFromFields(
    fields: YearMonthBagStrict,
    options?: OverflowOptions,
  ): PlainYearMonth
  monthDayFromFields(
    fields: MonthDayBagStrict,
    options?: OverflowOptions,
  ): PlainMonthDay
  dateAdd(
    dateArg: PlainDateArg,
    duration: DurationArg,
    options?: OverflowOptions,
  ): PlainDate
  dateUntil(
    dateArg0: PlainDateArg,
    dateArg1: PlainDateArg,
    options?: LargestUnitOptions,
  ): Duration
  fields(fieldNames: Iterable<string>): Iterable<string>
  mergeFields(
    fields0: Record<string, unknown>,
    fields1: Record<string, unknown>,
  ): Record<string, unknown>
  toString?(): string
  toJSON?(): string
}
