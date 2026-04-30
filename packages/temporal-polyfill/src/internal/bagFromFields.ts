import { parseMonthCodeField } from './bagFieldUtils'
import { resolveDay, resolveMonth, resolveYear } from './bagNativeFieldResolve'
import type {
  DateOptionsRefiner,
  DateOptionsTuple,
  OverflowRefiner,
} from './bagRefineConfig'
import {
  gregoryCalendarId,
  isoCalendarId,
  isoYearOffsetsByCalendarId,
  japaneseCalendarId,
  plainMonthDayCommonMonthMaxDayByCalendarIdBase,
  plainMonthDayLeapMonthMaxDaysByCalendarIdBase,
} from './calendarConfig'
import { computeCalendarIdBase } from './calendarId'
import { getCalendarEraOrigins } from './calendarNative'
import {
  queryNativeIsoFieldsFromParts,
  queryNativeMonthCodeParts,
  queryNativeYearMonthForMonthDay,
} from './calendarNativeQuery'
import * as errorMessages from './errorMessages'
import { DateBag, DayFields, YearMonthBag } from './fields'
import { isoEpochFirstLeapYear } from './isoMath'
import { Overflow } from './optionsModel'
import { OverflowOptions, refineOverflowOptions } from './optionsRefine'
import {
  PlainDateSlots,
  PlainMonthDaySlots,
  PlainYearMonthSlots,
  createPlainDateSlots,
  createPlainMonthDaySlots,
  createPlainYearMonthSlots,
} from './slots'
import { checkIsoDateInBounds, checkIsoYearMonthInBounds } from './timeMath'
import { clampNumber } from './utils'

// Native *-from-fields
// -----------------------------------------------------------------------------

export function dateFromFields(
  calendarId: string,
  fields: DateBag,
  options?: OverflowOptions,
): PlainDateSlots {
  return resolveDateFromFields(calendarId, fields, () => [
    refineOverflowOptions(options),
  ])[0]
}

export function resolveDateFromFields<T extends DateOptionsTuple>(
  calendarId: string,
  fields: DateBag,
  refineOptions: DateOptionsRefiner<T>,
): [slots: PlainDateSlots, ...options: T] {
  // Pre-check required fields so that missing-field TypeError is thrown BEFORE
  // any RangeError from monthCode parsing or bounds checking.
  // This ensures correct error ordering per spec (e.g. calendarresolvefields-error-ordering tests).
  const eraOrigins = getCalendarEraOrigins({ id: calendarId })
  if (
    fields.year === undefined &&
    (fields.era === undefined || fields.eraYear === undefined)
  ) {
    throw new TypeError(errorMessages.missingYear(eraOrigins))
  }
  if (fields.monthCode === undefined && fields.month === undefined) {
    throw new TypeError(errorMessages.missingMonth)
  }
  if (fields.day === undefined) {
    throw new TypeError(errorMessages.missingField('day'))
  }

  const monthCodeParts = parseMonthCodeField(fields)

  const year = resolveYear(calendarId, fields)

  // Options are deliberately read after all observable calendar fields,
  // including numeric year coercion. Month/day validation needs overflow, so
  // this is the latest point shared by Date, DateTime, and ZonedDateTime paths.
  const refinedOptions = refineOptions()
  const overflow = refinedOptions[0]
  const month = resolveMonth(calendarId, fields, year, overflow, monthCodeParts)
  const day = resolveDay(calendarId, fields as DayFields, month, year, overflow)
  const isoFields = queryNativeIsoFieldsFromParts(calendarId, year, month, day)

  return [
    createPlainDateSlots(checkIsoDateInBounds(isoFields), calendarId),
    ...refinedOptions,
  ]
}

export function yearMonthFromFields(
  calendarId: string,
  fields: YearMonthBag,
  options?: OverflowOptions,
): PlainYearMonthSlots {
  return resolveYearMonthFromFields(calendarId, fields, () =>
    refineOverflowOptions(options),
  )[0]
}

function resolveYearMonthFromFields(
  calendarId: string,
  fields: YearMonthBag,
  refineOverflow: OverflowRefiner,
): [slots: PlainYearMonthSlots, overflow: Overflow] {
  // Pre-check required fields so that missing-field TypeError is thrown BEFORE
  // any RangeError from monthCode parsing or bounds checking.
  const eraOrigins = getCalendarEraOrigins({ id: calendarId })
  if (
    fields.year === undefined &&
    (fields.era === undefined || fields.eraYear === undefined)
  ) {
    throw new TypeError(errorMessages.missingYear(eraOrigins))
  }
  if (fields.monthCode === undefined && fields.month === undefined) {
    throw new TypeError(errorMessages.missingMonth)
  }

  const monthCodeParts = parseMonthCodeField(fields)

  const year = resolveYear(calendarId, fields)

  // Keep option coercion after year coercion; month resolution is the first
  // step that needs overflow.
  const overflow = refineOverflow()
  const month = resolveMonth(calendarId, fields, year, overflow, monthCodeParts)
  const isoFields = queryNativeIsoFieldsFromParts(calendarId, year, month, 1)

  return [
    createPlainYearMonthSlots(checkIsoYearMonthInBounds(isoFields), calendarId),
    overflow,
  ]
}

export function monthDayFromFields(
  calendarId: string,
  fields: DateBag, // guaranteed `day`
  options?: OverflowOptions,
): PlainMonthDaySlots {
  return resolveMonthDayFromFields(calendarId, fields, () =>
    refineOverflowOptions(options),
  )[0]
}

function resolveMonthDayFromFields(
  calendarId: string,
  fields: DateBag, // guaranteed `day`
  refineOverflow: OverflowRefiner,
): [slots: PlainMonthDaySlots, overflow: Overflow] {
  const eraOrigins = getCalendarEraOrigins({ id: calendarId })

  // Pre-check required fields so that missing-field TypeError is thrown BEFORE
  // any RangeError from monthCode parsing or bounds checking.
  if (fields.day === undefined) {
    throw new TypeError(errorMessages.missingField('day'))
  }
  if (
    calendarId !== isoCalendarId &&
    fields.month !== undefined &&
    fields.year === undefined &&
    (fields.era === undefined || fields.eraYear === undefined)
  ) {
    throw new TypeError(errorMessages.missingYear(eraOrigins))
  }

  const monthCodeParts = parseMonthCodeField(fields)

  let yearMaybe =
    fields.eraYear !== undefined || fields.year !== undefined // HACK
      ? resolveYear(calendarId, fields)
      : undefined

  // PlainMonthDay may not have a year, but if it does, that year is part of the
  // observable field coercion sequence and must precede overflow option reads.
  const overflow = refineOverflow()
  let day: number
  let monthCodeNumber: number
  let isLeapMonth: boolean

  // TODO: make this DRY the HACK in refinePlainMOnthDayBag?
  const isIso = calendarId === isoCalendarId
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
        queryNativeIsoFieldsFromParts(calendarId, yearMaybe, 1, 1),
      )
    }

    // might limit overflow
    const month = resolveMonth(
      calendarId,
      fields,
      yearMaybe,
      overflow,
      monthCodeParts,
    )
    // NOTE: internal call of getDefinedProp not necessary
    day = resolveDay(
      calendarId,
      fields as DayFields,
      month,
      yearMaybe,
      overflow,
    )
    ;[monthCodeNumber, isLeapMonth] = queryNativeMonthCodeParts(
      calendarId,
      yearMaybe,
      month,
    )
  } else {
    // no year given? there must be a monthCode
    if (fields.monthCode === undefined) {
      // TODO: should this message be more specific about month *CODE*?
      throw new TypeError(errorMessages.missingMonth)
    }
    // Pluck monthCode/day number without limiting overflow. The syntax check
    // already parsed this before option reads, so reuse that tuple here.
    ;[monthCodeNumber, isLeapMonth] = monthCodeParts!

    // This is ALSO a HACK for maxLengthOfMonthCodeInAnyYear in reference implementation's monthDayFromFields
    // to limit the day in calendar with predictable max-days-in-month without the year
    const isIsoLike =
      calendarId === isoCalendarId ||
      calendarId === gregoryCalendarId ||
      calendarId === japaneseCalendarId ||
      isoYearOffsetsByCalendarId[calendarId] !== undefined
    if (isIsoLike) {
      // Offset ISO-like calendars (Buddhist/ROC) share Gregorian month lengths,
      // but their calendar year is not the ISO year. Use the native calendar
      // year that corresponds to ISO 1972 so February 29 remains available.
      const referenceYear =
        isoEpochFirstLeapYear + (isoYearOffsetsByCalendarId[calendarId] || 0)
      const month = resolveMonth(
        calendarId,
        fields,
        referenceYear,
        overflow,
        monthCodeParts,
      )
      day = resolveDay(
        calendarId,
        fields as DayFields,
        month,
        referenceYear,
        overflow,
      )
    } else if (
      computeCalendarIdBase(calendarId) === 'coptic' &&
      overflow === Overflow.Constrain
    ) {
      const maxLengthOfMonthCodeInAnyYear =
        !isLeapMonth && monthCodeNumber === 13 ? 6 : 30
      day = fields.day!
      day = clampNumber(day, 1, maxLengthOfMonthCodeInAnyYear)
    } else if (
      computeCalendarIdBase(calendarId) === 'chinese' &&
      overflow === Overflow.Constrain
    ) {
      const maxLengthOfMonthCodeInAnyYear =
        isLeapMonth &&
        (monthCodeNumber === 1 ||
          monthCodeNumber === 9 ||
          monthCodeNumber === 10 ||
          monthCodeNumber === 11 ||
          monthCodeNumber === 12)
          ? 29
          : 30
      day = fields.day!
      day = clampNumber(day, 1, maxLengthOfMonthCodeInAnyYear)
    } else {
      // NORMAL CASE
      day = fields.day! // guaranteed by caller
    }
  }

  if (
    isLeapMonth &&
    queryPlainMonthDayLeapMonthMaxDay(calendarId, monthCodeNumber) < fields.day
  ) {
    if (overflow === Overflow.Reject) {
      throw new RangeError(errorMessages.invalidLeapMonth)
    }

    // Temporal's PlainMonthDay reference table only admits some leap
    // month-days. When a requested leap month-day is outside that table,
    // constrain it through the corresponding common month instead.
    isLeapMonth = false
    day = clampNumber(
      fields.day,
      1,
      queryPlainMonthDayCommonMonthMaxDay(calendarId),
    )
  }

  // query calendar for final year/month
  let res = queryNativeYearMonthForMonthDay(
    calendarId,
    monthCodeNumber,
    Boolean(isLeapMonth),
    day,
  )

  // Without an explicit year, variable-length calendar months need the same
  // overflow behavior as year-specific fields: reject asks for an exact match,
  // while constrain walks back to the latest day that exists in some suitable
  // reference year/month.
  while (!res && overflow === Overflow.Constrain && day > 1) {
    day--
    res = queryNativeYearMonthForMonthDay(
      calendarId,
      monthCodeNumber,
      Boolean(isLeapMonth),
      day,
    )
  }

  if (!res) {
    throw new RangeError(errorMessages.failedYearGuess)
  }
  const [finalYear, finalMonth] = res

  return [
    createPlainMonthDaySlots(
      checkIsoDateInBounds(
        queryNativeIsoFieldsFromParts(calendarId, finalYear, finalMonth, day),
      ),
      calendarId,
    ),
    overflow,
  ]
}

function queryPlainMonthDayLeapMonthMaxDay(
  calendarId: string,
  monthCodeNumber: number,
): number {
  return (
    plainMonthDayLeapMonthMaxDaysByCalendarIdBase[
      computeCalendarIdBase(calendarId)
    ]?.[monthCodeNumber] ?? Infinity
  )
}

function queryPlainMonthDayCommonMonthMaxDay(calendarId: string): number {
  return (
    plainMonthDayCommonMonthMaxDayByCalendarIdBase[
      computeCalendarIdBase(calendarId)
    ] ?? Infinity
  )
}
