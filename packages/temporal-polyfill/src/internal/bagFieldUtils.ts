import { parseMonthCode } from './calendarNative'
import { requireString } from './cast'
import { MonthFields } from './fields'

export function refineMonthCodeString(
  monthCode: unknown,
  entityName: string,
): string {
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

export function passThroughDateField<T>(fieldVal: T): T {
  return fieldVal
}

export function validateMonthCodeSyntax(fields: Partial<MonthFields>): void {
  if (fields.monthCode !== undefined) {
    // Syntax is part of resolving the supplied fields, not calendar suitability.
    // `M99L` is syntactically valid and is rejected later against the chosen
    // calendar/year, but `L99M` should fail before year numeric coercion.
    parseMonthCode(fields.monthCode)
  }
}
