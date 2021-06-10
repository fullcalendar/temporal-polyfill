import { PlainDateTimeFields, PlainTime } from './plainDateTime'
import { asRoundOptions, RoundOptionsLike } from './round'
import { priorities, unitIncrement } from './utils'

export const msToIsoTime = (
  ms: number,
  options?: RoundOptionsLike
): PlainTime & { deltaDays: number } => {
  const { largestUnit } = asRoundOptions(options)
  const largestIndex =
    largestUnit === 'auto' ? priorities.years : priorities[largestUnit]
  let isoHour = 0,
    isoMinute = 0,
    isoSecond = 0,
    isoMillisecond = ms

  //MS
  if (priorities.seconds >= largestIndex) {
    isoSecond += Math.trunc(isoMillisecond / unitIncrement.seconds) || 0
    isoMillisecond = Math.trunc(isoMillisecond % unitIncrement.seconds) || 0
  }

  //SECS
  if (priorities.minutes >= largestIndex) {
    isoMinute += Math.trunc(isoSecond / unitIncrement.minutes) || 0
    isoSecond = Math.trunc(isoSecond % unitIncrement.minutes) || 0
  }

  //MINS
  if (priorities.hours >= largestIndex) {
    isoHour += Math.trunc(isoMinute / unitIncrement.hours) || 0
    isoMinute = Math.trunc(isoMinute % unitIncrement.hours) || 0
  }
  //HOURS
  let deltaDays = 0

  if (priorities.days >= largestIndex) {
    deltaDays = Math.trunc(isoHour / unitIncrement.days) || 0
    isoHour = Math.trunc(isoHour % unitIncrement.days) || 0
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
