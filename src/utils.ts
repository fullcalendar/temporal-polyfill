import { DurationUnit } from './duration'
import { PlainDate, PlainDateTimeFields } from './plainDateTime'

export type LocaleId = 'en-us' | string

export type AssignmentOptions = { overflow: 'constrain' | 'reject' }
export type AssignmentOptionsLike = Partial<AssignmentOptions>

export type CompareReturn = -1 | 0 | 1

export enum UNIT_INCREMENT {
  MILLISECOND = 1,
  SECOND = 1000,
  MINUTE = 60,
  HOUR = 60,
  DAY = 24,
  WEEK = 7,
  /** @deprecated This increment should not be used, it should instead defer to a calendar */
  MONTH = 4.34524,
  /** @deprecated This increment should not be used, it should instead defer to a calendar */
  YEAR = 12,
}

/** Constructs a type with specified properties set to required and the rest as optional */
export type Part<A, B extends keyof A> = Required<Pick<A, B>> & Partial<A>

export const dateValue = (
  date: Part<PlainDateTimeFields, 'isoYear'>
): number => {
  return Date.UTC(
    date.isoYear,
    date.isoMonth !== undefined ? date.isoMonth - 1 : 0,
    date.isoDay !== undefined ? date.isoDay : 1,
    date.isoHour !== undefined ? date.isoHour : 0,
    date.isoMinute !== undefined ? date.isoMinute : 0,
    date.isoSecond !== undefined ? date.isoSecond : 0,
    date.isoMillisecond !== undefined ? date.isoMillisecond : 0
  )
}

export const incrementMap: { [Property in DurationUnit]: number } = {
  /**@deprecated This increment should not be used, it should instead defer to a calendar */
  years: UNIT_INCREMENT.YEAR,
  /**@deprecated This increment should not be used, it should instead defer to a calendar */
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
  ms: number,
  formatter: Intl.DateTimeFormat
): Record<string, string | number> => {
  return formatter
    .formatToParts(new Date(ms))
    .reduce((acc: Record<string, string | number>, { type, value }) => {
      const valNum = parseInt(value)
      return {
        ...acc,
        [type]: isNaN(valNum) ? value : valNum,
      }
    }, {})
}
