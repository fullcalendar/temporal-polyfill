import { roundPriorities } from './round'
import { DurationUnitType, UNIT_INCREMENT } from './types'

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

export const toUnitMS = (unit: DurationUnitType): number =>
  roundPriorities.reduce(
    (acc, val, index) =>
      index >= roundPriorities.indexOf(unit) ? acc * incrementMap[val] : acc,
    1
  )
