import { balanceFromMs } from './balance'
import { Duration } from './duration'
import { PlainDateTime } from './plainDateTime'
import { PlainDateType, PlainTimeType } from './types'
import { toUnitMs } from './utils'

export const extractTimeMs = ({
  isoHour,
  isoMinute,
  isoSecond,
  isoMillisecond,
}: PlainTimeType): number =>
  isoHour * toUnitMs('hours') +
  isoMinute * toUnitMs('minutes') +
  isoSecond * toUnitMs('seconds') +
  isoMillisecond * toUnitMs('milliseconds')

export const separateDuration = (
  duration: Duration
): [macroDuration: Duration, durationTimeMs: number] => {
  return [
    new Duration(
      duration.years,
      duration.months,
      duration.weeks,
      duration.days
    ),
    extractTimeMs({
      isoHour: duration.hours,
      isoMinute: duration.minutes,
      isoSecond: duration.seconds,
      isoMillisecond: duration.milliseconds,
    }),
  ]
}

export const separateDateTime = (
  date: PlainDateTime,
  minTimeMs: number = 0
): [isoDate: PlainDateType, timeOfDayMs: number] => {
  const {
    isoYear,
    isoMonth,
    isoDay,
    isoHour,
    isoMinute,
    isoSecond,
    isoMillisecond,
  } = balanceFromMs(date.epochMilliseconds)
  const jsDate = new Date(0)
  jsDate.setUTCFullYear(isoYear, isoMonth, isoDay)
  const ms = extractTimeMs({ isoHour, isoMinute, isoSecond, isoMillisecond })
  if (ms < minTimeMs) jsDate.setUTCDate(jsDate.getUTCDate() - 1)
  return [
    {
      isoYear: jsDate.getUTCFullYear(),
      isoMonth: jsDate.getUTCMonth(),
      isoDay: jsDate.getUTCDate(),
    },
    ms,
  ]
}
