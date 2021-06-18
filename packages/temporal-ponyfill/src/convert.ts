import { DurationUnit, DurationUnitNoDate } from './duration'
import { PlainDateTimeFields } from './plainDateTime'
import { PlainTimeFields } from './plainTime'
import { asRoundOptions, RoundOptionsLike } from './round'
import { Part } from './utils'

export const msToIsoTime = (
  ms: number,
  options?: RoundOptionsLike
): PlainTimeFields & { deltaDays: number } => {
  const { largestUnit } = asRoundOptions(options)
  const largestIndex =
    largestUnit === 'auto' ? priorities.years : priorities[largestUnit]
  let isoHour = 0,
    isoMinute = 0,
    isoSecond = 0,
    isoMillisecond = ms

  //MS
  if (priorities.seconds >= largestIndex) {
    isoSecond += Math.trunc(isoMillisecond / UNIT_INCREMENT.SECOND) || 0
    isoMillisecond = Math.trunc(isoMillisecond % UNIT_INCREMENT.SECOND) || 0
  }

  //SECS
  if (priorities.minutes >= largestIndex) {
    isoMinute += Math.trunc(isoSecond / UNIT_INCREMENT.MINUTE) || 0
    isoSecond = Math.trunc(isoSecond % UNIT_INCREMENT.MINUTE) || 0
  }

  //MINS
  if (priorities.hours >= largestIndex) {
    isoHour += Math.trunc(isoMinute / UNIT_INCREMENT.HOUR) || 0
    isoMinute = Math.trunc(isoMinute % UNIT_INCREMENT.HOUR) || 0
  }
  //HOURS
  let deltaDays = 0

  if (priorities.days >= largestIndex) {
    deltaDays = Math.trunc(isoHour / UNIT_INCREMENT.DAY) || 0
    isoHour = Math.trunc(isoHour % UNIT_INCREMENT.DAY) || 0
  }

  return { deltaDays, isoHour, isoMinute, isoSecond, isoMillisecond }
}

export const msToIsoDate = (ms: number): PlainDateTimeFields => {
  const date = new Date(ms)
  return {
    isoYear: date.getUTCFullYear(),
    isoMonth: date.getUTCMonth() + 1,
    isoDay: date.getUTCDate(),
    isoHour: date.getUTCHours(),
    isoMinute: date.getUTCMinutes(),
    isoSecond: date.getUTCSeconds(),
    isoMillisecond: date.getUTCMilliseconds(),
  }
}

export const isoDateToMs = (
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

export enum UNIT_INCREMENT {
  MILLISECOND = 1,
  SECOND = 1000,
  MINUTE = 60,
  HOUR = 60,
  DAY = 24,
  WEEK = 7,
}

export enum MS_FOR {
  MILLISECOND = UNIT_INCREMENT.MILLISECOND,
  SECOND = UNIT_INCREMENT.SECOND * MILLISECOND,
  MINUTE = UNIT_INCREMENT.MINUTE * SECOND,
  HOUR = UNIT_INCREMENT.HOUR * MINUTE,
  DAY = UNIT_INCREMENT.DAY * HOUR,
  WEEK = UNIT_INCREMENT.WEEK * DAY,
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
