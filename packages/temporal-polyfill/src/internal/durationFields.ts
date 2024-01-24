import { Unit, unitNamesAsc } from './units'
import {
  mapPropNamesToConstant,
  mapPropNamesToIndex,
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
// -------------------------------------------------------------------------------------------------

export const durationFieldNamesAsc = unitNamesAsc.map((unitName) => unitName + 's') as (keyof DurationFields)[]
export const durationFieldNamesAlpha = durationFieldNamesAsc.slice().sort()
export const durationTimeFieldNamesAsc = durationFieldNamesAsc.slice(0, Unit.Day)
export const durationDateFieldNamesAsc = durationFieldNamesAsc.slice(Unit.Day)

export const durationFieldIndexes = mapPropNamesToIndex(durationFieldNamesAsc)

// Field Defaults
// -------------------------------------------------------------------------------------------------

export const durationFieldDefaults = mapPropNamesToConstant(durationFieldNamesAsc, 0)
export const durationTimeFieldDefaults = mapPropNamesToConstant(durationTimeFieldNamesAsc, 0)