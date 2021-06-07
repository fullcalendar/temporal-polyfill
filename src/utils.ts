import { DurationUnit } from './duration'
import { PlainDate, PlainDateTimeFields } from './plainDateTime'
import { CompareReturn, Part, UNIT_INCREMENT } from './types'

export const dateValue = (
  date: Part<PlainDateTimeFields, 'isoYear'>
): number => {
  const utc = Date.UTC(
    date.isoYear,
    date.isoMonth !== undefined ? date.isoMonth - 1 : 0,
    date.isoDay !== undefined ? date.isoDay : 1,
    date.isoHour !== undefined ? date.isoHour : 0,
    date.isoMinute !== undefined ? date.isoMinute : 0,
    date.isoSecond !== undefined ? date.isoSecond : 0,
    date.isoMillisecond !== undefined ? date.isoMillisecond : 0
  )

  return utc
}

export const asDate = (
  date: Part<PlainDateTimeFields, 'isoYear'> | number
): Date => {
  return new Date(typeof date === 'number' ? date : dateValue(date))
}

export const incrementMap: { [Property in DurationUnit]: number } = {
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

export const priorities: Array<DurationUnit> = [
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
export const toUnitMs = (unit: DurationUnit): number => {
  return priorities.reduce((acc, val, index) => {
    return index >= priorities.indexOf(unit) ? acc * incrementMap[val] : acc
  }, 1)
}

export const comparePlainDate = (
  one: PlainDate,
  two: PlainDate
): CompareReturn => {
  const diff =
    one.isoYear - two.isoYear ||
    one.isoMonth - two.isoMonth ||
    one.isoDay - two.isoDay

  if (diff < 0) {
    return -1
  } else if (diff > 0) {
    return 1
  }
  return 0
}

export const reduceFormat = (
  dt: PlainDate | number,
  formatter: Intl.DateTimeFormat
): Record<string, string | number> => {
  return formatter
    .formatToParts(asDate(dt))
    .reduce((acc: Record<string, string | number>, { type, value }) => {
      const valNum = parseInt(value)
      return {
        ...acc,
        [type]: valNum !== NaN ? valNum : value,
      }
    }, {})
}
