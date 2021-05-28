import { Duration } from './duration'
import { PlainDateTime } from './plainDateTime'
import { PlainTime } from './types'
import { toUnitMs } from './utils'

export const extractTimeMs = ({
  isoHour,
  isoMinute,
  isoSecond,
  isoMillisecond,
}: PlainTime): number =>
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

// TODO: Implement this
export const separateDateTime = (
  date: PlainDateTime,
  minTimeMs: number = 0
): [isoDate: Date, timeOfDayMs: number] => {
  return [new Date(), 0]
}
