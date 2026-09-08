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
  timeFields: TimeFields | undefined = timeFieldDefaults,
  calendar: CalendarImpl,
): CalendarDateTimeFields & { calendar: CalendarImpl } {
  // Calendar/date pipelines and time pipelines resolve their own fields before
  // reaching this point. The only cross-field validation left is whether the
  // combined PlainDateTime is inside Temporal's supported ISO range.
  const isoDateTime = combineDateAndTime(isoDate, timeFields)
  checkIsoDateTimeInBounds(isoDateTime)
  return createDateTimeSlots(isoDateTime, calendar)
}

// Performs the observable year/month field work that must precede option reads.
// Full dates also require a day. Check all required fields before parsing
// monthCode, then resolve the year, preserving the validation/coercion order.
export function refineCalendarDateFields(
  fields: Partial<DateFields>,
  calendar: CalendarImpl,
  allowMissingDay?: boolean,
): [year: number, monthCodeParts: MonthCodeParts | undefined] {
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
  if (!allowMissingDay && fields.day === undefined) {
    throwTypeError(errorMessages.missingField('day'))
  }

  // Parse monthCode before numeric year coercion, despite the tuple order.
  const monthCodeParts = parseMonthCodeField(fields)
  const year = resolveCalendarYear(fields, calendar)
  return [year, monthCodeParts]
}

// Resolves fields after the caller has read the overflow option at the required
// point between field refinement and calendar-dependent month/day resolution.
export function createPlainDateFromRefinedFields(
  fields: Partial<DateFields>,
  calendar: CalendarImpl,
  year: number,
  monthCodeParts: MonthCodeParts | undefined,
  overflow: Overflow,
): CalendarDateFields & { calendar: CalendarImpl } {
  const month = resolveCalendarMonth(
    fields,
    calendar,
    year,
    monthCodeParts,
    overflow,
  )
  const day = resolveCalendarDay(
    fields as DayFields,
    calendar,
    year,
    month,
    overflow,
  )
  const isoDate = computeCalendarIsoFieldsFromParts(calendar, year, month, day)
  return createDateSlots(checkIsoDateInBounds(isoDate), calendar)
}

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

export function createPlainYearMonthFromRefinedFields(
  fields: Partial<YearMonthFields>,
  calendar: CalendarImpl,
  year: number,
  monthCodeParts: MonthCodeParts | undefined,
  overflow: Overflow,
): CalendarDateFields & { calendar: CalendarImpl } {
  const month = resolveCalendarMonth(
    fields,
    calendar,
    year,
    monthCodeParts,
    overflow,
  )
  return createPlainYearMonthFromCalendarFields(calendar, year, month)
}

// Creates a PlainYearMonth from calendar coordinates that are already known
// to be resolved, avoiding field-style month validation for trusted inputs.
export function createPlainYearMonthFromCalendarFields(
  calendar: CalendarImpl,
  year: number,
  month: number,
): CalendarDateFields & { calendar: CalendarImpl } {
  const isoDate = computeCalendarIsoFieldsFromParts(calendar, year, month, 1)
  return createDateSlots(checkIsoYearMonthInBounds(isoDate), calendar)
}

type RefinedPlainMonthDayFields = [
  year: number | undefined,
  monthCodeParts: MonthCodeParts | undefined,
]

// Performs required-field checks and coercions that precede overflow options.
export function refinePlainMonthDayFields(
  fields: Partial<DateFields>, // guaranteed `day`
  calendar: CalendarImpl,
): RefinedPlainMonthDayFields {
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

  const yearMaybe =
    fields.eraYear !== undefined || fields.year !== undefined // HACK
      ? resolveCalendarYear(fields, calendar)
      : undefined

  return [yearMaybe, monthCodeParts]
}

export function createPlainMonthDayFromRefinedFields(
  fields: Partial<DateFields> & DayFields,
  calendar: CalendarImpl,
  year: number | undefined,
  monthCodeParts: MonthCodeParts | undefined,
  overflow: Overflow,
): CalendarDateFields & { calendar: CalendarImpl } {
  const isIso = calendar === isoCalendarImpl
  let yearMaybe = year
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
      fields,
      calendar,
      yearMaybe,
      monthCodeParts,
      overflow,
    )
    // NOTE: internal call of getDefinedProp not necessary
    day = resolveCalendarDay(
      fields as DayFields,
      calendar,
      yearMaybe,
      month,
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
        fields,
        calendar,
        referenceYear,
        monthCodeParts,
        overflow,
      )
      day = resolveCalendarDay(
        fields as DayFields,
        calendar,
        referenceYear,
        month,
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

  return createPlainMonthDayFromCalendarParts(
    calendar,
    monthCodeNumber,
    isLeapMonth,
    day,
    fields.day,
    overflow,
  )
}

// Creates a PlainMonthDay from a trusted calendar date without rebuilding and
// reparsing a synthetic public monthCode field.
export function createPlainMonthDayFromCalendarFields(
  calendar: CalendarImpl,
  year: number,
  month: number,
  day: number,
): CalendarDateFields & { calendar: CalendarImpl } {
  const [monthCodeNumber, isLeapMonth] = computeCalendarMonthCodeParts(
    calendar,
    year,
    month,
  )
  return createPlainMonthDayFromCalendarParts(
    calendar,
    monthCodeNumber,
    isLeapMonth,
    day,
    day,
    Overflow.Constrain,
  )
}

function createPlainMonthDayFromCalendarParts(
  calendar: CalendarImpl,
  monthCodeNumber: number,
  isLeapMonthArg: boolean,
  day: number,
  requestedDay: number,
  overflow: Overflow,
): CalendarDateFields & { calendar: CalendarImpl } {
  let isLeapMonth = isLeapMonthArg
  if (
    isLeapMonth &&
    ((calendar && calendar.monthDayLeapMonthMaxDays?.[monthCodeNumber]) ??
      Infinity) < requestedDay
  ) {
    if (overflow === Overflow.Reject) {
      throwRangeError(errorMessages.invalidLeapMonth)
    }

    // Temporal's month-day reference table only admits some leap month-days.
    // When a requested leap month-day is outside that table, constrain it
    // through the corresponding common month instead.
    isLeapMonth = false
    day = constrainToRange(
      requestedDay,
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
