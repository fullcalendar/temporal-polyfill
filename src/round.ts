import { DurationUnit } from './duration'
import { priorities, toUnitMs } from './utils'

export type RoundMode = 'halfExpand' | 'ceil' | 'trunc' | 'floor'
export type RoundOptions = {
  smallestUnit: DurationUnit | 'auto'
  largestUnit: DurationUnit | 'auto'
  roundingIncrement: number
  roundingMode: RoundMode
}
export type RoundOptionsLike = Partial<RoundOptions>

const roundDefaults: RoundOptions = {
  largestUnit: 'auto',
  smallestUnit: 'auto',
  roundingIncrement: 1,
  roundingMode: 'trunc',
}

export const asRoundOptions = (options?: RoundOptionsLike): RoundOptions => {
  const combined = {
    ...roundDefaults,
    ...options,
  }
  const smallestIndex =
    combined.smallestUnit !== 'auto'
      ? priorities.indexOf(combined.smallestUnit)
      : priorities.length - 1
  const largestIndex =
    combined.largestUnit !== 'auto'
      ? priorities.indexOf(combined.largestUnit)
      : 0

  if (smallestIndex < largestIndex) {
    throw new RangeError('largestUnit cannot be smaller than smallestUnit')
  }
  return combined
}

export const roundModeMap: {
  [Property in RoundMode]: (x: number) => number
} = {
  trunc: Math.trunc,
  ceil: Math.ceil,
  floor: Math.floor,
  halfExpand: Math.round,
}

export const roundMs = (ms: number, options?: RoundOptionsLike): number => {
  const { smallestUnit, roundingIncrement, roundingMode } = asRoundOptions(
    options
  )
  const msInSmallest =
    toUnitMs(smallestUnit === 'auto' ? 'milliseconds' : smallestUnit) *
    roundingIncrement
  return roundModeMap[roundingMode](ms / msInSmallest) * msInSmallest
}
