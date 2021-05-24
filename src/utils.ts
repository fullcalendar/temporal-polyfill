import { DurationUnitType, RoundType } from './types'

export const asDate = (epochMilliseconds: number): Date =>
  new Date(epochMilliseconds)

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

export const roundDefaults: RoundType = {
  largestUnit: roundPriorities[0],
  smallestUnit: roundPriorities[roundPriorities.length - 1],
  roundingIncrement: 1,
  roundingMode: 'trunc',
}

export const roundModeMap: { [key: string]: (x: number) => number } = {
  trunc: Math.trunc,
  ceil: Math.ceil,
  floor: Math.floor,
  halfExpand: Math.round,
}
