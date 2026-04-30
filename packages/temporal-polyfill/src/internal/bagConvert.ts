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
  yearMonthCodeFieldNames,
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
    calendarId,
    input,
    monthCodeDayFieldNames,
  )
  return monthDayFromFields(calendarId, fields as DateBag)
}

export function convertNativeToPlainYearMonth(
  calendarId: string,
  input: { year: number; monthCode: string },
  options?: OverflowOptions,
): PlainYearMonthSlots {
  const fields = readNativeCalendarFields(
    calendarId,
    input,
    yearMonthCodeFieldNames,
  )
  return yearMonthFromFields(calendarId, fields as YearMonthBag, options)
}

export function convertNativePlainMonthDayToDate(
  calendarId: string,
  input: { monthCode: string; day: number },
  bag: EraYearOrYear,
): PlainDateSlots {
  return convertToNativeIso(
    calendarId,
    input,
    monthCodeDayFieldNames,
    requireObjectLike(bag),
    yearFieldNames,
  )
}

export function convertNativePlainYearMonthToDate(
  calendarId: string,
  input: YearMonthFields,
  bag: DayFields,
): PlainDateSlots {
  return convertToNativeIso(
    calendarId,
    input,
    yearMonthCodeFieldNames,
    requireObjectLike(bag),
    dayFieldNames,
  )
}

function convertToNativeIso(
  calendarId: string,
  input: any,
  inputFieldNames: string[],
  extra: any,
  extraFieldNames: string[],
): PlainDateSlots {
  inputFieldNames = getCalendarFieldNames(calendarId, inputFieldNames)
  input = pluckProps(inputFieldNames, input as Record<string, unknown>)

  extraFieldNames = getCalendarFieldNames(calendarId, extraFieldNames)
  extra = readAndCoerceBagFields(extra, extraFieldNames, [])

  let mergedFields = mergeCalendarFields(calendarId, input, extra)
  mergedFields = readAndCoerceBagFields(
    mergedFields,
    [...inputFieldNames, ...extraFieldNames].sort(),
    [],
  )

  return dateFromFields(calendarId, mergedFields as any)
}
