import { readBagFields } from './bagFields'
import { japaneseCalendarId } from './calendarConfig'
import { getCalendarEraOrigins } from './calendarNative'
import {
  allYearFieldNames,
  eraYearFieldNames,
  monthDayFieldNames,
  monthFieldNames,
} from './fields'

export function getCalendarFieldNames(
  calendarId: string,
  fieldNames: string[],
): string[] {
  if (
    getCalendarEraOrigins({ id: calendarId }) &&
    fieldNames.includes('year')
  ) {
    return [...fieldNames, ...eraYearFieldNames]
  }
  return fieldNames
}

export function readNativeCalendarFields(
  calendarId: string,
  bag: Record<string, unknown>,
  validFieldNames: string[],
  requiredFieldNames: string[] = [],
  forcedValidFieldNames: string[] = [],
): Record<string, unknown> {
  const fieldNames = [
    ...getCalendarFieldNames(calendarId, validFieldNames),
    ...forcedValidFieldNames,
  ].sort()

  return readBagFields(bag, fieldNames, requiredFieldNames)
}

export function mergeCalendarFields(
  calendarId: string,
  baseFields: Record<string, unknown>,
  additionalFields: Record<string, unknown>,
): Record<string, unknown> {
  const merged = Object.assign(Object.create(null), baseFields)

  spliceFields(merged, additionalFields, monthFieldNames)

  if (getCalendarEraOrigins({ id: calendarId })) {
    spliceFields(merged, additionalFields, allYearFieldNames)

    // Japanese eras can begin mid-year. When month/day are supplied, era fields
    // from the original object can become stale, so the replacement year path
    // must be resolved without them.
    if (calendarId === japaneseCalendarId) {
      spliceFields(
        merged,
        additionalFields,
        monthDayFieldNames, // any found?
        eraYearFieldNames, // then, delete these
      )
    }
  }

  return merged
}

/*
Splices props with names `allPropNames` from `additional` to `dest`.
If ANY of these props exists on additional, replaces ALL dest with them.
*/
function spliceFields(
  dest: any,
  additional: any,
  allPropNames: string[],
  deletablePropNames?: string[],
): void {
  let anyMatching = false
  const nonMatchingPropNames: string[] = []

  for (const propName of allPropNames) {
    if (additional[propName] !== undefined) {
      anyMatching = true
    } else {
      nonMatchingPropNames.push(propName)
    }
  }

  Object.assign(dest, additional)

  if (anyMatching) {
    for (const deletablePropName of deletablePropNames ||
      nonMatchingPropNames) {
      delete dest[deletablePropName]
    }
  }
}
