import { roundPriorities } from './round'
import {
  CompareReturnType,
  DurationUnitType,
  PlainDateType,
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

export const toUnitMs = (unit: DurationUnitType): number =>
  roundPriorities.reduce(
    (acc, val, index) =>
      index >= roundPriorities.indexOf(unit) ? acc * incrementMap[val] : acc,
    1
  )

export const comparePlainDate = (
  one: PlainDateType,
  two: PlainDateType
): CompareReturnType => {
  if (one.isoYear > two.isoYear) return 1
  else if (one.isoYear < two.isoYear) return -1
  if (one.isoMonth > two.isoMonth) return 1
  else if (one.isoMonth < two.isoMonth) return -1
  if (one.isoDay > two.isoDay) return 1
  else if (one.isoDay < two.isoDay) return -1
  return 0
}
