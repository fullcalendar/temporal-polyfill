import {
  getCalendarFieldNames,
  mergeCalendarFields,
  readNativeCalendarFields,
} from './bagCalendarFields'
import { readAndCoerceBagFields } from './bagFields'
import {
  dateFromFields,
  monthDayFromFields,
  yearMonthFromFields,
} from './bagFromFields'
import { requireObjectLike } from './cast'
import {
  DateBag,
  DayFields,
  EraYearOrYear,
  YearMonthBag,
  YearMonthFields,
  dayFieldNames,
  monthCodeDayFieldNames,
  yearFieldNames,
  yearFieldNamesWithEra,
  yearMonthCodeFieldNames,
  yearMonthCodeDayFieldNamesAlpha,
  yearMonthCodeDayFieldNamesAlphaWithEra,
  yearMonthCodeFieldNamesWithEra,
} from './fields'
import { OverflowOptions } from './optionsRefine'
import {
  PlainDateSlots,
  PlainMonthDaySlots,
  PlainYearMonthSlots,
} from './slots'
import { pluckProps } from './utils'

/*
Conversions that combine an existing Temporal object's calendar fields with an
additional user bag.

Examples:
- PlainMonthDay + a year-like bag -> PlainDate
- PlainYearMonth + a day-like bag -> PlainDate

The "Native" names are inherited from the surrounding code. In this file they
mean the conversion uses the built-in calendar field resolution path rather than
user calendar callbacks.
*/

// Conversion that involves bags
// -----------------------------------------------------------------------------

export function convertNativeToPlainMonthDay(
  calendarId: string,
  input: { monthCode: string; day: number },
): PlainMonthDaySlots {
  const fields = readNativeCalendarFields(
    /* bag */ input,
    /* validFieldNames */ monthCodeDayFieldNames,
  )
  return monthDayFromFields(calendarId, fields as DateBag)
}

export function convertNativeToPlainYearMonth(
  calendarId: string,
  input: { year: number; monthCode: string },
  options?: OverflowOptions,
): PlainYearMonthSlots {
  const validFieldNames = getCalendarFieldNames(
    calendarId,
    yearMonthCodeFieldNames,
    yearMonthCodeFieldNamesWithEra,
  )
  const fields = readNativeCalendarFields(
    /* bag */ input,
    /* validFieldNames */ validFieldNames,
  )
  return yearMonthFromFields(calendarId, fields as YearMonthBag, options)
}

export function convertNativePlainMonthDayToDate(
  calendarId: string,
  input: { monthCode: string; day: number },
  bag: EraYearOrYear,
): PlainDateSlots {
  const extraFieldNames = getCalendarFieldNames(
    calendarId,
    yearFieldNames,
    yearFieldNamesWithEra,
  )
  const inputFields = pluckProps(
    monthCodeDayFieldNames,
    input as Record<string, unknown>,
  )
  const extraFields = readAndCoerceBagFields(
    requireObjectLike(bag) as Record<string, unknown>,
    extraFieldNames,
    [],
  )

  return nativeIsoFromMergedFields(calendarId, inputFields, extraFields)
}

export function convertNativePlainYearMonthToDate(
  calendarId: string,
  input: YearMonthFields,
  bag: DayFields,
): PlainDateSlots {
  const inputFieldNames = getCalendarFieldNames(
    calendarId,
    yearMonthCodeFieldNames,
    yearMonthCodeFieldNamesWithEra,
  )
  const inputFields = pluckProps(
    inputFieldNames,
    input as unknown as Record<string, unknown>,
  )
  const extraFields = readAndCoerceBagFields(
    requireObjectLike(bag) as unknown as Record<string, unknown>,
    dayFieldNames,
    [],
  )

  return nativeIsoFromMergedFields(calendarId, inputFields, extraFields)
}

function nativeIsoFromMergedFields(
  calendarId: string,
  inputFields: Record<string, unknown>,
  extraFields: Record<string, unknown>,
): PlainDateSlots {
  const mergedFieldNames = getCalendarFieldNames(
    calendarId,
    yearMonthCodeDayFieldNamesAlpha,
    yearMonthCodeDayFieldNamesAlphaWithEra,
  )

  let mergedFields = mergeCalendarFields(calendarId, inputFields, extraFields)
  mergedFields = readAndCoerceBagFields(mergedFields, mergedFieldNames, [])

  return dateFromFields(calendarId, mergedFields as any)
}
