import { toInteger } from './cast'
import { BoundArg, mapPropNamesToConstant, pluckProps, pluckPropsTuple } from './utils'

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
  (keyof IsoDateTimeFields)[]

export const isoTimeFieldNamesAsc = Object.keys(isoTimeFieldRefiners) as
  (keyof IsoTimeFields)[]

export const isoTimeFieldNames = isoTimeFieldNamesAsc.sort()
export const isoDateTimeFieldNamesAsc = [...isoDateFieldNames, ...isoTimeFieldNamesAsc]

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
>(undefined, isoDateTimeFieldNamesAsc.reverse())
