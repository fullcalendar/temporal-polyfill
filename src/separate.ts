import { Duration } from './duration'
import { PlainDateTime } from './plainDateTime'
import { toUnitMS } from './utils'

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
    duration.hours * toUnitMS('hours') +
      duration.minutes * toUnitMS('minutes') +
      duration.seconds * toUnitMS('seconds') +
      duration.milliseconds * toUnitMS('milliseconds'),
  ]
}

// TODO: Implement this
export const separateDateTime = (
  date: PlainDateTime
): [isoDate: Date, timeOfDayMs: number] => {
  return [new Date(), 0]
}
