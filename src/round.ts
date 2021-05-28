import { DurationUnitType, RoundModeType, RoundOptionsType } from './types'

export const roundPriorities: Array<DurationUnitType> = [
  'years',
  'months',
  'weeks',
  'days',
  'hours',
  'minutes',
  'seconds',
  'milliseconds',
]

export const roundDefaults: RoundOptionsType = {
  largestUnit: roundPriorities[0],
  smallestUnit: roundPriorities[roundPriorities.length - 1],
  roundingIncrement: 1,
  roundingMode: 'trunc',
}

export const roundModeMap: {
  [Property in RoundModeType]: (x: number) => number
} = {
  trunc: Math.trunc,
  ceil: Math.ceil,
  floor: Math.floor,
  halfExpand: Math.round,
}
