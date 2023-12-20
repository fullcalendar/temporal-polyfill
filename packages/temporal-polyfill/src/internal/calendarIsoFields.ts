import { toInteger } from './cast'
import { computeIsoDaysInMonth, computeIsoMonthsInYear } from './calendarIso'
import { checkIsoDateInBounds, checkIsoDateTimeInBounds } from './epochAndTime'
import { Overflow } from './options'
import { clampProp, isClamped, mapPropNamesToConstant } from './utils'

export interface IsoDateFields {
  isoDay: number
  isoMonth: number
  isoYear: number
}

export interface IsoTimeFields {
  isoNanosecond: number,
  isoMicrosecond: number,
  isoMillisecond: number,
  isoSecond: number,
  isoMinute: number,
  isoHour: number,
}

export type IsoDateTimeFields = IsoDateFields & IsoTimeFields

// Property Names
// -------------------------------------------------------------------------------------------------

// descending by unit (for internal plucking to slots)
// ACTUALLY no point. Debuggers show alhpabetized props anyway
export const isoDateFieldNamesDesc: (keyof IsoDateFields)[] = [
  'isoYear',
  'isoMonth',
  'isoDay',
]
export const isoTimeFieldNamesDesc: (keyof IsoTimeFields)[] = [
  'isoHour',
  'isoMinute',
  'isoSecond',
  'isoMillisecond',
  'isoMicrosecond',
  'isoNanosecond',
]
export const isoDateTimeFieldNamesDesc: (keyof IsoDateTimeFields)[] = [
  ...isoDateFieldNamesDesc,
  ...isoTimeFieldNamesDesc,
]

// ascending by unit (for converting to/from non-iso)
export const isoTimeFieldNamesAsc = isoTimeFieldNamesDesc.slice().reverse()

// alphabetical (for getISOFields)
export const isoDateFieldNamesAlpha = isoDateFieldNamesDesc.slice().sort()
export const isoTimeFieldNamesAlpha = isoTimeFieldNamesDesc.slice().sort()
export const isoDateTimeFieldNamesAlpha = isoDateTimeFieldNamesDesc.slice().sort()

// Defaults
// -------------------------------------------------------------------------------------------------

export const isoTimeFieldDefaults = mapPropNamesToConstant(isoTimeFieldNamesAlpha, 0)

// Advanced
// -------------------------------------------------------------------------------------------------

export function constrainIsoTimeFields(isoTimeFields: IsoTimeFields, overflow: Overflow | undefined): IsoTimeFields {
  // TODO: clever way to compress this, using functional programming
  // Will this kill need for clampProp?
  return {
    isoHour: clampProp(isoTimeFields, 'isoHour', 0, 23, overflow),
    isoMinute: clampProp(isoTimeFields, 'isoMinute', 0, 59, overflow),
    isoSecond: clampProp(isoTimeFields, 'isoSecond', 0, 59, overflow),
    isoMillisecond: clampProp(isoTimeFields, 'isoMillisecond', 0, 999, overflow),
    isoMicrosecond: clampProp(isoTimeFields, 'isoMicrosecond', 0, 999, overflow),
    isoNanosecond: clampProp(isoTimeFields, 'isoNanosecond', 0, 999, overflow),
  }
}

export function constrainIsoDateTimeLike<P extends IsoDateTimeFields>(isoDateTimeFields: P): P {
  return {
    ...constrainIsoDateLike(isoDateTimeFields),
    ...constrainIsoTimeFields(isoDateTimeFields, Overflow.Reject),
  }
}

// TODO: remove `extends`
export function constrainIsoDateLike<P extends IsoDateFields>(isoInternals: P): P {
  if (!isIsoDateFieldsValid(isoInternals)) {
    // TODO: more DRY error
    throw new RangeError('Invalid iso date')
  }
  return isoInternals
}

export function isIsoDateFieldsValid(isoFields: IsoDateFields): boolean {
  const { isoYear, isoMonth, isoDay } = isoFields

  return isClamped(isoMonth, 1, computeIsoMonthsInYear(isoYear)) && // TODO: use just 12
    isClamped(isoDay, 1, computeIsoDaysInMonth(isoYear, isoMonth))
}

// Overly-specific
// -------------------------------------------------------------------------------------------------

export function refineIsoDateArgs(isoYear: number, isoMonth: number, isoDay: number): IsoDateFields {
  return checkIsoDateInBounds(
    constrainIsoDateLike({
      isoYear: toInteger(isoYear),
      isoMonth: toInteger(isoMonth),
      isoDay: toInteger(isoDay),
    })
  )
}

export function refineIsoDateTimeArgs(
  isoYear: number, isoMonth: number, isoDay: number,
  isoHour: number, isoMinute: number, isoSecond: number,
  isoMillisecond: number, isoMicrosecond: number, isoNanosecond: number,
): IsoDateTimeFields {
  return checkIsoDateTimeInBounds(
    constrainIsoDateTimeLike({
      isoYear: toInteger(isoYear),
      isoMonth: toInteger(isoMonth),
      isoDay: toInteger(isoDay),
      isoHour: toInteger(isoHour),
      isoMinute: toInteger(isoMinute),
      isoSecond: toInteger(isoSecond),
      isoMillisecond: toInteger(isoMillisecond),
      isoMicrosecond: toInteger(isoMicrosecond),
      isoNanosecond: toInteger(isoNanosecond),
    })
  )
}
