import {
  DurationUnitType,
  RoundModeType,
  RoundOptionsLikeType,
  RoundOptionsType,
} from './types'
import { toUnitMs } from './utils'

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

const roundDefaults: RoundOptionsType = {
  largestUnit: roundPriorities[0],
  smallestUnit: roundPriorities[roundPriorities.length - 1],
  roundingIncrement: 1,
  roundingMode: 'trunc',
}
export const asRoundOptions = (options?: RoundOptionsLikeType) => {
  const combined = {
    ...roundDefaults,
    ...options,
  }
  if (
    roundPriorities.indexOf(combined.smallestUnit) <
    roundPriorities.indexOf(combined.largestUnit)
  )
    throw new RangeError('largestUnit cannot be smaller than smallestUnit')
  return combined
}

export const roundModeMap: {
  [Property in RoundModeType]: (x: number) => number
} = {
  trunc: Math.trunc,
  ceil: Math.ceil,
  floor: Math.floor,
  halfExpand: Math.round,
}

export const roundMs = (ms: number, options?: RoundOptionsLikeType): number => {
  const { smallestUnit, roundingIncrement, roundingMode } = asRoundOptions(
    options
  )
  const msInSmallest = toUnitMs(smallestUnit) * roundingIncrement
  const countSmallest = roundModeMap[roundingMode](ms / msInSmallest)
  return countSmallest * msInSmallest
}
