import type { Temporal } from 'temporal-spec'
import {
  computeCalendarIsoFieldsFromParts,
  computeCalendarMonthCodeParts,
} from './calendarDerived'
import {
  getCalendarEraOrigins,
  resolveCalendarDay,
  resolveCalendarMonth,
  resolveCalendarYear,
} from './calendarFields'
import { type CalendarImpl, isoCalendarImpl } from './calendarImpl'
import { type MonthCodeParts, parseMonthCode } from './calendarMonthCode'
import * as errorMessages from './errorMessages'
import { timeFieldDefaults } from './fieldNames'
import { type DateOptionsRefiner, DateOptionsTuple } from './fieldRefine'
import {
  CalendarDateFields,
  CalendarDateTimeFields,
  DateFields,
  DayFields,
  TimeFields,
  YearMonthFields,
} from './fieldTypes'
import { combineDateAndTime } from './fieldUtils'
import {
  computeIsoYearMonthFieldsForMonthDay,
  isoEpochFirstLeapYear,
} from './isoCalendarMath'
import { refineOverflowOptions } from './optionsFieldRefine'
import { Overflow } from './optionsModel'
import { createDateSlots, createDateTimeSlots } from './slots'
import {
  checkIsoDateInBounds,
  checkIsoDateTimeInBounds,
  checkIsoYearMonthInBounds,
} from './temporalLimits'
import { constrainToRange, throwRangeError, throwTypeError } from './utils'

// Built-in *-from-fields
// -----------------------------------------------------------------------------

export function createPlainDateTimeFromRefinedFields(
  isoDate: CalendarDateFields,
  // biome-ignore lint/style/useDefaultParameterLast: Keep date and time adjacent at call sites.
  time: TimeFields | undefined = timeFieldDefaults,
  calendar: CalendarImpl,
): CalendarDateTimeFields & { calendar: CalendarImpl } {
  // Calendar/date pipelines and time pipelines resolve their own fields before
  // reaching this point. The only cross-field validation left is whether the
  // combined PlainDateTime is inside Temporal's supported ISO range.
  const isoDateTime = combineDateAndTime(isoDate, time)
  checkIsoDateTimeInBounds(isoDateTime)
  return createDateTimeSlots(isoDateTime, calendar)
}

export function createPlainDateFromFields(
  calendar: CalendarImpl,
  fields: Partial<DateFields>,
  options?: Temporal.OverflowOptions,
): CalendarDateFields & { calendar: CalendarImpl } {
  const prepared = prepareDateFields(calendar, fields)

  // The normal overflow path reads options at the same phase as the callback
  // path below: after observable date field syntax/year resolution and
  // immediately before month/day validation needs the overflow behavior.
  const overflow = refineOverflowOptions(options)
  return createPlainDateFromPreparedFields(calendar, fields, prepared, overflow)
}

export function createPlainDateFromFieldsWithOptionsRefiner<
  T extends DateOptionsTuple,
>(
  calendar: CalendarImpl,
  fields: Partial<DateFields>,
  refineOptions: DateOptionsRefiner<T>,
): [slots: CalendarDateFields & { calendar: CalendarImpl }, ...options: T] {
  const prepared = prepareDateFields(calendar, fields)

  // Options are deliberately read after all observable calendar fields,
  // including numeric year coercion. Month/day validation needs overflow, so
  // this is the latest point shared by Date, DateTime, and ZonedDateTime paths.
  const refinedOptions = refineOptions()

  return [
    createPlainDateFromPreparedFields(
      calendar,
      fields,
      prepared,
      refinedOptions[0],
    ),
    ...refinedOptions,
  ]
}

function createPlainDateFromPreparedFields(
  calendar: CalendarImpl,
  fields: Partial<DateFields>,
  prepared: PreparedDateFields,
  overflow: Overflow,
): CalendarDateFields & { calendar: CalendarImpl } {
  // The tuple is private plumbing. Index reads keep the built output from
  // carrying internal-only property names while preserving the field-read phase
  // that happens before overflow options are observed.
  const year = prepared[1]
  const month = resolveCalendarMonth(
    calendar,
    fields,
    year,
    overflow,
    prepared[0],
  )
  const day = resolveCalendarDay(
    calendar,
    fields as DayFields,
    month,
    year,
    overflow,
  )
  const isoDate = computeCalendarIsoFieldsFromParts(calendar, year, month, day)

  return createDateSlots(checkIsoDateInBounds(isoDate), calendar)
}

type PreparedDateFields = [
  monthCodeParts: MonthCodeParts | undefined,
  year: number,
]

function parseMonthCodeField(
  fields: Partial<DateFields>,
): MonthCodeParts | undefined {
  if (fields.monthCode !== undefined) {
    // Syntax is part of resolving the supplied fields, not calendar suitability.
    // `M99L` is syntactically valid and is rejected later against the chosen
    // calendar/year, but `L99M` should fail before year numeric coercion.
    return parseMonthCode(fields.monthCode)
  }
}

function prepareDateFields(
  calendar: CalendarImpl,
  fields: Partial<DateFields>,
): PreparedDateFields {
  // Pre-check required fields so that missing-field TypeError is thrown BEFORE
  // any RangeError from monthCode parsing or bounds checking.
  // This ensures correct error ordering per spec (e.g. calendarresolvefields-error-ordering tests).
  const eraOrigins = getCalendarEraOrigins(calendar)
  if (
    fields.year === undefined &&
    (fields.era === undefined || fields.eraYear === undefined)
  ) {
    throwTypeError(errorMessages.missingYear(eraOrigins))
  }
  if (fields.monthCode === undefined && fields.month === undefined) {
    throwTypeError(errorMessages.missingMonth)
  }
  if (fields.day === undefined) {
    throwTypeError(errorMessages.missingField('day'))
  }

  return [parseMonthCodeField(fields), resolveCalendarYear(calendar, fields)]
}

export function createPlainYearMonthFromFields(
  calendar: CalendarImpl,
  fields: Partial<YearMonthFields>,
  options?: Temporal.OverflowOptions,
): CalendarDateFields & { calendar: CalendarImpl } {
  // Pre-check required fields so that missing-field TypeError is thrown BEFORE
  // any RangeError from monthCode parsing or bounds checking.
  const eraOrigins = getCalendarEraOrigins(calendar)
  if (
    fields.year === undefined &&
    (fields.era === undefined || fields.eraYear === undefined)
  ) {
    throwTypeError(errorMessages.missingYear(eraOrigins))
  }
  if (fields.monthCode === undefined && fields.month === undefined) {
    throwTypeError(errorMessages.missingMonth)
  }

  const monthCodeParts = parseMonthCodeField(fields)

  const year = resolveCalendarYear(calendar, fields)

  // Keep option coercion after year coercion; month resolution is the first
  // step that needs overflow.
  const overflow = refineOverflowOptions(options)
  const month = resolveCalendarMonth(
    calendar,
    fields,
    year,
    overflow,
    monthCodeParts,
  )
  const isoDate = computeCalendarIsoFieldsFromParts(calendar, year, month, 1)

  return createDateSlots(checkIsoYearMonthInBounds(isoDate), calendar)
}

export function createPlainMonthDayFromFields(
  calendar: CalendarImpl,
  fields: Partial<DateFields>, // guaranteed `day`
  options?: Temporal.OverflowOptions,
): CalendarDateFields & { calendar: CalendarImpl } {
  const isIso = calendar === isoCalendarImpl
  const eraOrigins = getCalendarEraOrigins(calendar)

  // Pre-check required fields so that missing-field TypeError is thrown BEFORE
  // any RangeError from monthCode parsing or bounds checking.
  if (fields.day === undefined) {
    throwTypeError(errorMessages.missingField('day'))
  }
  if (
    !isIso &&
    fields.month !== undefined &&
    fields.year === undefined &&
    (fields.era === undefined || fields.eraYear === undefined)
  ) {
    throwTypeError(errorMessages.missingYear(eraOrigins))
  }

  const monthCodeParts = parseMonthCodeField(fields)

  let yearMaybe =
    fields.eraYear !== undefined || fields.year !== undefined // HACK
      ? resolveCalendarYear(calendar, fields)
      : undefined

  // PlainMonthDay may not have a year, but if it does, that year is part of the
  // observable field coercion sequence and must precede overflow option reads.
  const overflow = refineOverflowOptions(options)
  let day: number
  let monthCodeNumber: number
  let isLeapMonth: boolean

  // TODO: make this DRY the HACK in refinePlainMonthDayObjectLike?
  if (yearMaybe === undefined && isIso) {
    yearMaybe = isoEpochFirstLeapYear
  }

  // year given? parse either monthCode or month (if both specified, must be equivalent)
  if (yearMaybe !== undefined) {
    // PlainMonthDay stores a canonical reference year, but an explicitly
    // supplied ISO year is only a probe for overflow math. In particular, an
    // out-of-range ISO year can still tell us whether M02-29 should constrain
    // to M02-28 or remain a leap-day PlainMonthDay. Non-ISO calendars still go
    // through this guard because their calendar queries may need a real
    // in-range ISO date to anchor the supplied calendar year.
    if (!isIso) {
      checkIsoDateInBounds(
        computeCalendarIsoFieldsFromParts(calendar, yearMaybe, 1, 1),
      )
    }

    // might limit overflow
    const month = resolveCalendarMonth(
      calendar,
      fields,
      yearMaybe,
      overflow,
      monthCodeParts,
    )
    // NOTE: internal call of getDefinedProp not necessary
    day = resolveCalendarDay(
      calendar,
      fields as DayFields,
      month,
      yearMaybe,
      overflow,
    )
    ;[monthCodeNumber, isLeapMonth] = computeCalendarMonthCodeParts(
      calendar,
      yearMaybe,
      month,
    )
  } else {
    // no year given? there must be a monthCode
    if (fields.monthCode === undefined) {
      // TODO: should this message be more specific about month *CODE*?
      throwTypeError(errorMessages.missingMonth)
    }
    // Pluck monthCode/day number without limiting overflow. The syntax check
    // already parsed this before option reads, so reuse that tuple here.
    ;[monthCodeNumber, isLeapMonth] = monthCodeParts!

    // This is ALSO a HACK for maxLengthOfMonthCodeInAnyYear in reference implementation's createPlainMonthDayFromFields
    // to limit the day in calendar with predictable max-days-in-month without the year
    const referenceYear = calendar
      ? calendar.monthDayReferenceYear
      : isoEpochFirstLeapYear
    if (referenceYear !== undefined) {
      // ISO-derived calendars share Gregorian month lengths, but their
      // calendar year may not be the ISO year. The reference year corresponds
      // to ISO 1972 so February 29 remains available.
      const month = resolveCalendarMonth(
        calendar,
        fields,
        referenceYear,
        overflow,
        monthCodeParts,
      )
      day = resolveCalendarDay(
        calendar,
        fields as DayFields,
        month,
        referenceYear,
        overflow,
      )
    } else {
      // Calendar-specific yearless PlainMonthDay constraints live with the
      // external calendar. Most calendars return undefined and defer to the
      // later reference-year search.
      const constrainedDay =
        overflow === Overflow.Constrain
          ? calendar
            ? calendar.constrainPlainMonthDay?.(
                monthCodeNumber,
                isLeapMonth,
                fields.day!,
              )
            : undefined
          : undefined

      if (constrainedDay !== undefined) {
        day = constrainedDay
      } else {
        // NORMAL CASE
        day = fields.day! // guaranteed by caller
      }
    }
  }

  if (
    isLeapMonth &&
    ((calendar && calendar.monthDayLeapMonthMaxDays?.[monthCodeNumber]) ??
      Infinity) < fields.day
  ) {
    if (overflow === Overflow.Reject) {
      throwRangeError(errorMessages.invalidLeapMonth)
    }

    // Temporal's month-day reference table only admits some leap month-days.
    // When a requested leap month-day is outside that table, constrain it
    // through the corresponding common month instead.
    isLeapMonth = false
    day = constrainToRange(
      fields.day,
      1,
      (calendar && calendar.monthDayCommonMonthMaxDay) ?? Infinity,
    )
  }

  // query calendar for final year/month
  let res = calendar
    ? calendar.computeYearMonthFieldsForMonthDay(
        monthCodeNumber,
        Boolean(isLeapMonth),
        day,
      )
    : computeIsoYearMonthFieldsForMonthDay(
        monthCodeNumber,
        Boolean(isLeapMonth),
      )

  // Without an explicit year, variable-length calendar months need the same
  // overflow behavior as year-specific fields: reject asks for an exact match,
  // while constrain walks back to the latest day that exists in some suitable
  // reference year/month.
  while (!res && overflow === Overflow.Constrain && day > 1) {
    day--
    res = calendar
      ? calendar.computeYearMonthFieldsForMonthDay(
          monthCodeNumber,
          Boolean(isLeapMonth),
          day,
        )
      : computeIsoYearMonthFieldsForMonthDay(
          monthCodeNumber,
          Boolean(isLeapMonth),
        )
  }

  if (!res) {
    throwRangeError(errorMessages.failedYearGuess)
  }
  const { year: finalYear, month: finalMonth } = res

  return createDateSlots(
    checkIsoDateInBounds(
      computeCalendarIsoFieldsFromParts(calendar, finalYear, finalMonth, day),
    ),
    calendar,
  )
}
