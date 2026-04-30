import {
  requireString,
  toInteger,
  toPositiveInteger,
  toStrictInteger,
  toStringViaPrimitive,
} from './cast'
import { durationFieldNamesAsc } from './durationFields'
import * as errorMessages from './errorMessages'
import { timeFieldDefaults, timeFieldNamesAsc } from './fieldNames'
import { parseOffsetNano } from './offsetParse'
import { Overflow } from './optionsModel'
import { mapPropNamesToConstant } from './utils'

export type DateOptionsTuple = [overflow: Overflow, ...extraOptions: unknown[]]
export type DateOptionsRefiner<T extends DateOptionsTuple> = () => T

function coerceMonthCodeString(monthCode: unknown, entityName: string): string {
  if (typeof monthCode === 'string') {
    return monthCode
  }

  if (monthCode && typeof monthCode === 'object') {
    const monthCodeToString = monthCode.toString

    if (typeof monthCodeToString === 'function') {
      return requireString(monthCodeToString.call(monthCode), entityName)
    }
  }

  return requireString(monthCode as string, entityName)
}

// These maps define the first, property-by-property refinement pass over user
// bags. A refiner may only coerce the observable public type, or it may also
// parse that value into the internal representation used by later phases.
// Calendar-sensitive validation stays in bagFromFields.ts because its exact
// position relative to option reads is observable by test262.
export const dateFieldRefiners = {
  era: toStringViaPrimitive,
  // `year` and `eraYear` are intentionally absent. resolveCalendarYear()
  // coerces them
  // after required-field checks and monthCode syntax parsing, preserving the
  // observable error order required by the from-fields algorithms.
  month: toPositiveInteger,
  // The monthCode refiner only validates type. Range validation is deferred to
  // createPlainDateFromFields/createPlainYearMonthFromFields/createPlainMonthDayFromFields so missing-field
  // TypeError precedes invalid-monthCode RangeError.
  monthCode(monthCode: unknown, entityName = 'monthCode') {
    return coerceMonthCodeString(monthCode, entityName)
  },
  day: toPositiveInteger,
}

export const timeFieldRefiners = mapPropNamesToConstant(
  timeFieldNamesAsc,
  toInteger,
)

export const durationFieldRefiners = mapPropNamesToConstant(
  durationFieldNamesAsc,
  toStrictInteger,
)

const builtinOffsetRefiners = {
  offset(offsetString: unknown) {
    const s = toStringViaPrimitive(offsetString as string)
    // The public field is named "offset" and is supplied as a string, but after
    // this first bag phase the internal field value is offset nanoseconds. This
    // keeps the observable string coercion here and avoids later reparsing.
    return parseOffsetNano(s)
  },
}

export const builtinFieldRefiners = {
  ...dateFieldRefiners,
  ...timeFieldRefiners,
  ...durationFieldRefiners,
  ...builtinOffsetRefiners,
}

/*
Read the selected fields from a Temporal property bag in sorted order.

This is intentionally only the first bag phase: property access plus the
built-in, field-local refinements that must happen while reading the bag.
Calendar semantics, required-field relationships, and option-dependent
validation happen in later bag phases.

If `requiredFieldNames` is undefined, this is a partial read, used by .with()
style calls. In that mode an empty matching field set is rejected by default.
*/
export function readAndRefineBagFields(
  bag: Record<string, unknown>,
  validFieldNames: string[], // must be alphabetized
  requiredFieldNames?: string[],
  disallowEmpty = !requiredFieldNames,
): Record<string, unknown> {
  const res: Record<string, unknown> = {}
  let anyMatching = false

  for (const fieldName of validFieldNames) {
    let fieldVal = bag[fieldName]

    if (fieldVal !== undefined) {
      anyMatching = true

      const refiner =
        builtinFieldRefiners[fieldName as keyof typeof builtinFieldRefiners]

      if (refiner) {
        fieldVal = (
          refiner as (fieldVal: unknown, fieldName: string) => unknown
        )(fieldVal, fieldName)
      }

      res[fieldName] = fieldVal
    } else if (requiredFieldNames) {
      if (requiredFieldNames.includes(fieldName)) {
        // TODO: have caller use a Set
        throw new TypeError(errorMessages.missingField(fieldName))
      }

      res[fieldName] =
        timeFieldDefaults[fieldName as keyof typeof timeFieldDefaults]
    }
  }

  // Only check zero fields during .with() calls. For .from() calls, empty-bag
  // checking happens within the CalendarImpl-equivalent resolution path.
  if (disallowEmpty && !anyMatching) {
    throw new TypeError(errorMessages.noValidFields(validFieldNames))
  }

  return res
}
