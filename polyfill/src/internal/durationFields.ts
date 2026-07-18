import { Unit, unitNamesAsc } from './units'
import {
  bindArgs,
  createPropGetters,
  sortStrings,
  zeroOutProps,
  zipPropsConst,
} from './utils'

export interface DurationDateFields {
  days: number
  weeks: number
  months: number
  years: number
}

export interface DurationTimeFields {
  nanoseconds: number
  microseconds: number
  milliseconds: number
  seconds: number
  minutes: number
  hours: number
}

export type DurationFields = DurationDateFields & DurationTimeFields

// Field Names
// -----------------------------------------------------------------------------

export type DurationYearMonthFieldName = 'years' | 'months'
export type DurationDateFieldName =
  | DurationYearMonthFieldName
  | 'weeks'
  | 'days'
export type DurationTimeFieldName =
  | 'hours'
  | 'minutes'
  | 'seconds'
  | 'milliseconds'
  | 'microseconds'
  | 'nanoseconds'
export type DurationDayTimeFieldName = 'days' | DurationTimeFieldName
export type DurationFieldName = DurationDateFieldName | DurationTimeFieldName

export const durationFieldNamesAsc = unitNamesAsc.map(
  (unitName) => unitName + 's',
) as DurationFieldName[]

export const durationGetters = createPropGetters<
  DurationFields,
  DurationFieldName
>(durationFieldNamesAsc)

export const durationFieldNamesAlpha = sortStrings(durationFieldNamesAsc)

export const durationTimeFieldNamesAsc = durationFieldNamesAsc.slice(
  0,
  Unit.Day,
) as DurationTimeFieldName[]

export const durationDateFieldNamesAsc = durationFieldNamesAsc.slice(Unit.Day)
export const durationCalendarFieldNamesAsc = durationDateFieldNamesAsc.slice(1)

// Field Defaults
// -----------------------------------------------------------------------------

export const durationFieldDefaults = zipPropsConst(durationFieldNamesAsc, 0)
export const durationTimeFieldDefaults = zipPropsConst(
  durationTimeFieldNamesAsc,
  0,
)

export const clearDurationFields = bindArgs(
  zeroOutProps,
  durationFieldNamesAsc,
) as unknown as (unit: Unit, durationFields: DurationFields) => DurationFields
