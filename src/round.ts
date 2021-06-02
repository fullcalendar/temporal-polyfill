import { RoundModeType, RoundOptionsLikeType, RoundOptionsType } from './types'
import { priorities, toUnitMs } from './utils'

const roundDefaults: RoundOptionsType = {
  largestUnit: priorities[0],
  smallestUnit: priorities[priorities.length - 1],
  roundingIncrement: 1,
  roundingMode: 'trunc',
}
export const asRoundOptions = (options?: RoundOptionsLikeType) => {
  const combined = {
    ...roundDefaults,
    ...options,
  }
  if (
    priorities.indexOf(combined.smallestUnit) <
    priorities.indexOf(combined.largestUnit)
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
  return roundModeMap[roundingMode](ms / msInSmallest) * msInSmallest
}
