import { Duration, DurationLikeType } from './duration'
import { PlainTimeType, UNIT_INCREMENT, PlainDateTimeType } from './types'

export const balanceTime = ({
  isoHour,
  isoMinute,
  isoSecond,
  isoMillisecond,
}: PlainTimeType): PlainTimeType & { deltaDays: number } => {
  //MS
  isoSecond += Math.trunc(isoMillisecond / UNIT_INCREMENT.SECOND) || 0
  isoMillisecond = Math.trunc(isoMillisecond % UNIT_INCREMENT.SECOND) || 0
  //SECS
  isoMinute += Math.trunc(isoSecond / UNIT_INCREMENT.MINUTE) || 0
  isoSecond = Math.trunc(isoSecond % UNIT_INCREMENT.MINUTE) || 0
  //MINS
  isoHour += Math.trunc(isoMinute / UNIT_INCREMENT.HOUR) || 0
  isoMinute = Math.trunc(isoMinute % UNIT_INCREMENT.HOUR) || 0
  //HOURS
  const deltaDays = Math.trunc(isoHour / UNIT_INCREMENT.DAY) || 0
  isoHour = Math.trunc(isoHour % UNIT_INCREMENT.DAY) || 0

  return { deltaDays, isoHour, isoMinute, isoSecond, isoMillisecond }
}

// Leverages JS Date objects overflow management to organize our Date objects
// Note: This only accepts proper values and not values since unix epoch
export const balanceDateTime = ({
  isoYear = 1970,
  isoMonth = 0,
  isoDay = 1,
  isoHour = 0,
  isoMinute = 0,
  isoSecond = 0,
  isoMillisecond = 0,
}: Partial<PlainDateTimeType>): PlainDateTimeType => {
  const date = new Date(0)
  date.setUTCFullYear(isoYear, isoMonth, isoDay)
  date.setUTCHours(isoHour, isoMinute, isoSecond, isoMillisecond)
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

export const balanceDuration = ({
  years = 0,
  months = 0,
  weeks = 0,
  days = 0,
  hours = 0,
  minutes = 0,
  seconds = 0,
  milliseconds = 0,
}: DurationLikeType): Duration => {
  const {
    deltaDays,
    isoHour,
    isoMinute,
    isoSecond,
    isoMillisecond,
  } = balanceTime({
    isoHour: hours,
    isoMinute: minutes,
    isoSecond: seconds,
    isoMillisecond: milliseconds,
  })
  days += deltaDays
  //DAYS
  weeks += Math.trunc(days / UNIT_INCREMENT.WEEK) || 0
  days = Math.trunc(days % UNIT_INCREMENT.WEEK) || 0
  //WEEKS
  months += Math.trunc(weeks / UNIT_INCREMENT.MONTH) || 0
  weeks = Math.trunc(weeks % UNIT_INCREMENT.MONTH) || 0
  //MONTHS
  years += Math.trunc(months / UNIT_INCREMENT.YEAR) || 0
  months = Math.trunc(months % UNIT_INCREMENT.YEAR) || 0

  return new Duration(
    years,
    months,
    weeks,
    days,
    isoHour,
    isoMinute,
    isoSecond,
    isoMillisecond
  )
}
