import {
  DurationUnitType,
  RoundModeType,
  RoundType,
  UNIT_INCREMENT,
} from './types'

export const asDate = (epochMilliseconds: number): Date =>
  new Date(epochMilliseconds)

export const incrementMap: { [Property in DurationUnitType]: number } = {
  years: UNIT_INCREMENT.YEAR,
  months: UNIT_INCREMENT.MONTH,
  weeks: UNIT_INCREMENT.WEEK,
  days: UNIT_INCREMENT.DAY,
  hours: UNIT_INCREMENT.HOUR,
  minutes: UNIT_INCREMENT.MINUTE,
  seconds: UNIT_INCREMENT.SECOND,
  milliseconds: UNIT_INCREMENT.MILLISECOND,
}

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

export const toUnitMS = (unit: DurationUnitType) =>
  roundPriorities.reduce(
    (acc, val, index) =>
      index >= roundPriorities.indexOf(unit) ? acc * incrementMap[val] : acc,
    1
  )

export const roundDefaults: RoundType = {
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
