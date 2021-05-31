import { DurationLikeType } from './duration'
import { asRoundOptions, roundPriorities } from './round'
import {
  PlainTimeType,
  UNIT_INCREMENT,
  PlainDateTimeType,
  RoundOptionsLikeType,
  DurationType,
} from './types'

export const balanceTime = (
  {
    isoHour = 0,
    isoMinute = 0,
    isoSecond = 0,
    isoMillisecond = 0,
  }: Partial<PlainTimeType>,
  options?: RoundOptionsLikeType
): PlainTimeType & { deltaDays: number } => {
  const { largestUnit } = asRoundOptions(options)
  const largestIndex = roundPriorities.indexOf(largestUnit)
  //MS
  if (roundPriorities.indexOf('seconds') >= largestIndex) {
    isoSecond += Math.trunc(isoMillisecond / UNIT_INCREMENT.SECOND) || 0
    isoMillisecond = Math.trunc(isoMillisecond % UNIT_INCREMENT.SECOND) || 0
  }
  //SECS
  if (roundPriorities.indexOf('minutes') >= largestIndex) {
    isoMinute += Math.trunc(isoSecond / UNIT_INCREMENT.MINUTE) || 0
    isoSecond = Math.trunc(isoSecond % UNIT_INCREMENT.MINUTE) || 0
  }
  //MINS
  if (roundPriorities.indexOf('hours') >= largestIndex) {
    isoHour += Math.trunc(isoMinute / UNIT_INCREMENT.HOUR) || 0
    isoMinute = Math.trunc(isoMinute % UNIT_INCREMENT.HOUR) || 0
  }
  //HOURS
  let deltaDays = 0
  if (roundPriorities.indexOf('days') >= largestIndex) {
    deltaDays = Math.trunc(isoHour / UNIT_INCREMENT.DAY) || 0
    isoHour = Math.trunc(isoHour % UNIT_INCREMENT.DAY) || 0
  }

  return { deltaDays, isoHour, isoMinute, isoSecond, isoMillisecond }
}

export const balanceFromMs = (ms: number): PlainDateTimeType => {
  const date = new Date(ms)
  return {
    isoYear: date.getUTCFullYear(),
    isoMonth: date.getUTCMonth(),
    isoDay: date.getUTCDate(),
    isoHour: date.getUTCHours(),
    isoMinute: date.getUTCMinutes(),
    isoSecond: date.getUTCSeconds(),
    isoMillisecond: date.getUTCMilliseconds(),
  }
}

export const balanceDateTime = ({
  isoYear = 1970,
  isoMonth = 0,
  isoDay = 1,
  isoHour = 0,
  isoMinute = 0,
  isoSecond = 0,
  isoMillisecond = 0,
}: Partial<PlainDateTimeType>): PlainDateTimeType => {
  return balanceFromMs(
    Date.UTC(
      isoYear,
      isoMonth,
      isoDay,
      isoHour,
      isoMinute,
      isoSecond,
      isoMillisecond
    )
  )
}
