import { builtinRefiners } from './bagRefineConfig'
import * as errorMessages from './errorMessages'
import { timeFieldDefaults } from './fields'

/*
Read the selected fields from a Temporal property bag in sorted order.

This is intentionally only the first bag phase: property access plus the
built-in, field-local coercions that must happen while reading the bag. Calendar
semantics, required-field relationships, and option-dependent validation happen
later in bagRefine.ts.

If `requiredFieldNames` is undefined, this is a partial read, used by .with()
style calls. In that mode an empty matching field set is rejected by default.
*/
export function readBagFields(
  bag: Record<string, unknown>,
  validFieldNames: string[], // must be alphabetized
  requiredFieldNames?: string[],
  disallowEmpty = !requiredFieldNames,
): Record<string, unknown> {
  const res: Record<string, unknown> = {}
  let anyMatching = false
  let prevFieldName: undefined | string

  for (const fieldName of validFieldNames) {
    if (fieldName === prevFieldName) {
      throw new RangeError(errorMessages.duplicateFields(fieldName))
    }
    if (fieldName === 'constructor' || fieldName === '__proto__') {
      throw new RangeError(errorMessages.forbiddenField(fieldName))
    }

    let fieldVal = bag[fieldName]

    if (fieldVal !== undefined) {
      anyMatching = true

      const refiner = builtinRefiners[fieldName as keyof typeof builtinRefiners]

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

    prevFieldName = fieldName
  }

  // Only check zero fields during .with() calls. For .from() calls, empty-bag
  // checking happens within the CalendarImpl-equivalent resolution path.
  if (disallowEmpty && !anyMatching) {
    throw new TypeError(errorMessages.noValidFields(validFieldNames))
  }

  return res
}
