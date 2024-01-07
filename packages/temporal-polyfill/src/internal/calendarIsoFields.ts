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

export const isoTimeFieldNamesAsc: (keyof IsoTimeFields)[] = [
  'isoNanosecond',
  'isoMicrosecond',
  'isoMillisecond',
  'isoSecond',
  'isoMinute',
  'isoHour',
]

export const isoDateFieldNamesAsc: (keyof IsoDateFields)[] = [
  'isoDay',
  'isoMonth',
  'isoYear',
]

export const isoDateTimeFieldNamesAsc: (keyof IsoDateTimeFields)[] = [
  ...isoTimeFieldNamesAsc,
  ...isoDateFieldNamesAsc,
]

// alphabetical (for getISOFields)
export const isoDateFieldNamesAlpha = isoDateFieldNamesAsc.slice().sort()
export const isoTimeFieldNamesAlpha = isoTimeFieldNamesAsc.slice().sort()
export const isoDateTimeFieldNamesAlpha = isoDateTimeFieldNamesAsc.slice().sort()

// Defaults
// -------------------------------------------------------------------------------------------------

export const isoTimeFieldDefaults = mapPropNamesToConstant(isoTimeFieldNamesAlpha, 0)
