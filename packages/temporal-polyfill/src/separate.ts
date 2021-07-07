import { isoDateToMs, msToIsoDate, MS_FOR } from './convert'
import { Duration } from './duration'
import { PlainDate, PlainDateFields } from './plainDate'
import { PlainDateTime } from './plainDateTime'
import { PlainTimeFields } from './plainTime'

export const extractTimeMs = ({
  isoHour,
  isoMinute,
  isoSecond,
  isoMillisecond,
}: PlainTimeFields): number => {
  return (
    isoHour * MS_FOR.HOUR +
    isoMinute * MS_FOR.MINUTE +
    isoSecond * MS_FOR.SECOND +
    isoMillisecond * MS_FOR.MILLISECOND
  )
}

export const extractTimeWithDaysMs = ({
  isoDay,
  ...isoTime
}: PlainTimeFields & Pick<PlainDateFields, 'isoDay'>): number => {
  return extractTimeMs(isoTime) + isoDay * MS_FOR.DAY
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
  } = msToIsoDate(date.epochMilliseconds)
  const jsDate = new Date(isoDateToMs({ isoYear, isoMonth, isoDay }))
  let ms = extractTimeMs({ isoHour, isoMinute, isoSecond, isoMillisecond })

  if (ms < minTimeMs) {
    jsDate.setUTCDate(jsDate.getUTCDate() - 1)
    ms += MS_FOR.DAY
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
