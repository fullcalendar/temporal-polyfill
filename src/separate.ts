import { mstoIsoDate } from './convert'
import { Duration } from './duration'
import { PlainDate, PlainDateTime, PlainTime } from './plainDateTime'
import { asDate, toUnitMs } from './utils'

export const extractTimeMs = ({
  isoHour,
  isoMinute,
  isoSecond,
  isoMillisecond,
}: PlainTime): number => {
  return (
    isoHour * toUnitMs('hours') +
    isoMinute * toUnitMs('minutes') +
    isoSecond * toUnitMs('seconds') +
    isoMillisecond * toUnitMs('milliseconds')
  )
}

export const extractTimeWithDaysMs = ({
  isoDay,
  ...isoTime
}: PlainTime & Pick<PlainDate, 'isoDay'>): number => {
  return extractTimeMs(isoTime) + isoDay * toUnitMs('days')
}

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
  minTimeMs = 0
): [isoDate: PlainDate, timeOfDayMs: number] => {
  const {
    isoYear,
    isoMonth,
    isoDay,
    isoHour,
    isoMinute,
    isoSecond,
    isoMillisecond,
  } = mstoIsoDate(date.epochMilliseconds)
  const jsDate = asDate({ isoYear, isoMonth, isoDay })
  let ms = extractTimeMs({ isoHour, isoMinute, isoSecond, isoMillisecond })

  if (ms < minTimeMs) {
    jsDate.setUTCDate(jsDate.getUTCDate() - 1)
    ms += toUnitMs('days')
  }
  return [
    {
      isoYear: jsDate.getUTCFullYear(),
      isoMonth: jsDate.getUTCMonth() + 1,
      isoDay: jsDate.getUTCDate(),
    },
    ms,
  ]
}
