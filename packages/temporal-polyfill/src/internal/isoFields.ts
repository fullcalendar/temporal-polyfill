import { toInteger } from './cast'
import { checkIsoDateInBounds, computeIsoDaysInMonth, computeIsoMonthsInYear } from './isoMath'
import { Overflow } from './options'
import { BoundArg, clampProp, isClamped, mapPropNamesToConstant, mapPropsWithRefiners, pluckProps, pluckPropsTuple } from './utils'

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

// Refiners
// -------------------------------------------------------------------------------------------------

// Ordered by ascending size
// ALSO happends to be alphabetical order
export const isoDateFieldRefiners = {
  isoDay: toInteger,
  isoMonth: toInteger,
  isoYear: toInteger,
}

// Ordered by ascending size
export const isoTimeFieldRefiners = {
  isoNanosecond: toInteger,
  isoMicrosecond: toInteger,
  isoMillisecond: toInteger,
  isoSecond: toInteger,
  isoMinute: toInteger,
  isoHour: toInteger,
}

export const isoDateTimeFieldRefiners = {
  ...isoDateFieldRefiners,
  ...isoTimeFieldRefiners,
}

// Property Names
// -------------------------------------------------------------------------------------------------

export const isoDateFieldNames = Object.keys(isoDateFieldRefiners) as
  (keyof IsoDateFields)[]

export const isoTimeFieldNamesAsc = Object.keys(isoTimeFieldRefiners) as
  (keyof IsoTimeFields)[]

export const isoDateTimeFieldNames = Object.keys(isoDateTimeFieldRefiners).sort() as
  (keyof IsoDateTimeFields)[]

export const isoTimeFieldNames = isoTimeFieldNamesAsc.slice().sort()
export const isoDateTimeFieldNamesAsc = [...isoTimeFieldNamesAsc, ...isoDateFieldNames]

// Defaults
// -------------------------------------------------------------------------------------------------

export const isoTimeFieldDefaults = mapPropNamesToConstant(isoTimeFieldNames, 0)

// Conversion
// -------------------------------------------------------------------------------------------------

export const pluckIsoTimeFields = pluckProps.bind<
  undefined, [BoundArg], // bound
  [IsoTimeFields], // unbound
  IsoTimeFields // return
>(undefined, isoTimeFieldNames)

export type IsoTuple = [
  isoYear: number,
  isoMonth?: number,
  isoDay?: number,
  isoHour?: number,
  isoMinute?: number,
  isoSecond?: number,
  isoMilli?: number,
]

export const pluckIsoTuple = pluckPropsTuple.bind<
  undefined, [BoundArg], // bound
  [Partial<IsoDateTimeFields> & { isoYear: number }], // unbound
  IsoTuple // return
>(undefined, isoDateTimeFieldNamesAsc.slice().reverse())

// Advanced
// -------------------------------------------------------------------------------------------------

export function refineIsoTimeFields(
  rawIsoTimeInternals: IsoTimeFields,
): IsoTimeFields {
  return constrainIsoTimeFields(
    mapPropsWithRefiners(rawIsoTimeInternals, isoTimeFieldRefiners),
    Overflow.Reject,
  )
}

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

export function constrainIsoDateLike<P extends IsoDateFields>(isoInternals: P): P {
  if (!isIsoDateFieldsValid(isoInternals)) {
    // TODO: more DRY error
    throw new RangeError('Invalid iso date')
  }
  return isoInternals
}

export function isIsoDateFieldsValid(isoFields: IsoDateFields): boolean {
  const { isoYear, isoMonth, isoDay } = isoFields

  return isClamped(isoMonth, 1, computeIsoMonthsInYear(isoYear)) &&
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
