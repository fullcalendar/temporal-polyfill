import {
  CompareReturnType,
  DurationUnitType,
  PlainDateType,
  UNIT_INCREMENT,
} from './types'

export const asDate = (epochMilliseconds: number): Date =>
  new Date(epochMilliseconds)

export const incrementMap: { [Property in DurationUnitType]: number } = {
  /**@deprecated */
  years: UNIT_INCREMENT.YEAR,
  /**@deprecated */
  months: UNIT_INCREMENT.MONTH,
  weeks: UNIT_INCREMENT.WEEK,
  days: UNIT_INCREMENT.DAY,
  hours: UNIT_INCREMENT.HOUR,
  minutes: UNIT_INCREMENT.MINUTE,
  seconds: UNIT_INCREMENT.SECOND,
  milliseconds: UNIT_INCREMENT.MILLISECOND,
}

export const priorities: Array<DurationUnitType> = [
  'years',
  'months',
  'weeks',
  'days',
  'hours',
  'minutes',
  'seconds',
  'milliseconds',
]

/**
 * Calculates milliseconds for a given unit
 * @param unit days, hours, minutes, seconds, milliseconds
 * @returns milliseconds
 */
export const toUnitMs = (unit: DurationUnitType): number =>
  priorities.reduce(
    (acc, val, index) =>
      index >= priorities.indexOf(unit) ? acc * incrementMap[val] : acc,
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
