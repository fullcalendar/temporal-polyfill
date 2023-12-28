import { mapPropNamesToConstant } from './utils'

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
