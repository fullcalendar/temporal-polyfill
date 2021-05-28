import { Duration, DurationLikeType } from './duration'
import { PlainTime, PlainDate, UNIT_INCREMENT } from './types'

export const balanceTime = ({
  isoHour,
  isoMinute,
  isoSecond,
  isoMillisecond,
}: PlainTime): PlainTime & { deltaDays: number } => {
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

// TODO: Implement this
export const balanceDate = ({
  isoYear,
  isoMonth,
  isoDay,
}: PlainDate): PlainDate => {
  return {
    isoYear,
    isoMonth,
    isoDay,
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
