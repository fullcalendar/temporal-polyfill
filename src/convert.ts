import { asRoundOptions } from './round'
import {
  PlainTimeType,
  UNIT_INCREMENT,
  PlainDateTimeType,
  RoundOptionsLikeType,
} from './types'
import { asDate, priorities } from './utils'

export const toIsoTime = (
  time: Partial<PlainTimeType> | number,
  options?: RoundOptionsLikeType
): PlainTimeType & { deltaDays: number } => {
  const { largestUnit } = asRoundOptions(options)
  const largestIndex =
    largestUnit === 'auto' ? 0 : priorities.indexOf(largestUnit)
  let { isoHour, isoMinute, isoSecond, isoMillisecond } =
    typeof time === 'number'
      ? {
          isoHour: 0,
          isoMinute: 0,
          isoSecond: 0,
          isoMillisecond: time,
        }
      : {
          isoHour: time.isoHour || 0,
          isoMinute: time.isoMinute || 0,
          isoSecond: time.isoSecond || 0,
          isoMillisecond: time.isoMillisecond || 0,
        }

  //MS
  if (priorities.indexOf('seconds') >= largestIndex) {
    isoSecond += Math.trunc(isoMillisecond / UNIT_INCREMENT.SECOND) || 0
    isoMillisecond = Math.trunc(isoMillisecond % UNIT_INCREMENT.SECOND) || 0
  }
  //SECS
  if (priorities.indexOf('minutes') >= largestIndex) {
    isoMinute += Math.trunc(isoSecond / UNIT_INCREMENT.MINUTE) || 0
    isoSecond = Math.trunc(isoSecond % UNIT_INCREMENT.MINUTE) || 0
  }
  //MINS
  if (priorities.indexOf('hours') >= largestIndex) {
    isoHour += Math.trunc(isoMinute / UNIT_INCREMENT.HOUR) || 0
    isoMinute = Math.trunc(isoMinute % UNIT_INCREMENT.HOUR) || 0
  }
  //HOURS
  let deltaDays = 0
  if (priorities.indexOf('days') >= largestIndex) {
    deltaDays = Math.trunc(isoHour / UNIT_INCREMENT.DAY) || 0
    isoHour = Math.trunc(isoHour % UNIT_INCREMENT.DAY) || 0
  }

  return { deltaDays, isoHour, isoMinute, isoSecond, isoMillisecond }
}

export const mstoIsoDate = (ms: number): PlainDateTimeType => {
  const date = asDate(ms)
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
