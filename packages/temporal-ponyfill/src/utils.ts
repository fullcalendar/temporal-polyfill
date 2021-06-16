import { DurationFields, DurationUnit, DurationUnitNoDate } from './duration'
import { PlainDateTimeFields } from './plainDateTime'

export type LocaleId = 'en-us' | string
export type Instant = number

export type AssignmentOptions = { overflow: 'constrain' | 'reject' }
export type AssignmentOptionsLike = Partial<AssignmentOptions>

export type CompareReturn = -1 | 0 | 1

export const unitIncrement: {
  [Property in keyof Omit<DurationFields, 'years' | 'months'>]: number
} = {
  milliseconds: 1,
  seconds: 1000,
  minutes: 60,
  hours: 60,
  days: 24,
  weeks: 7,
}

export enum MS_FOR {
  MILLISECOND = unitIncrement.milliseconds,
  SECOND = unitIncrement.seconds * MILLISECOND,
  MINUTE = unitIncrement.minutes * SECOND,
  HOUR = unitIncrement.hours * MINUTE,
  DAY = unitIncrement.days * HOUR,
  WEEK = unitIncrement.weeks * DAY,
}

export const msFor: {
  [Property in DurationUnitNoDate]: number
} = {
  milliseconds: MS_FOR.MILLISECOND,
  seconds: MS_FOR.SECOND,
  minutes: MS_FOR.MINUTE,
  hours: MS_FOR.HOUR,
  days: MS_FOR.DAY,
  weeks: MS_FOR.WEEK,
}

export const priorities: { [Property in DurationUnit]: number } = {
  years: 0,
  months: 1,
  weeks: 2,
  days: 3,
  hours: 4,
  minutes: 5,
  seconds: 6,
  milliseconds: 7,
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
