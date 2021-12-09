import { parseDiffOptions } from '../argParse/diffOptions'
import { parseRoundingOptions } from '../argParse/roundingOptions'
import { Duration } from '../public/duration'
import { Instant } from '../public/instant'
import { CompareResult, TimeDiffOptions, TimeRoundingOptions } from '../public/types'
import { compareValues } from '../utils/math'
import { splitEpochNano } from './dayTime'
import { computeLargestDurationUnit, durationToTimeFields, nanoToDuration } from './duration'
import { roundNano } from './rounding'
import { timeFieldsToNano } from './time'
import { DAY, HOUR, NANOSECOND, SECOND } from './units'

export function compareInstants(a: Instant, b: Instant): CompareResult {
  return compareValues(a.epochNanoseconds, b.epochNanoseconds)
}

export function addToInstant(instant: Instant, duration: Duration): Instant {
  const largestUnit = computeLargestDurationUnit(duration)

  if (largestUnit >= DAY) {
    throw new RangeError('Duration cant have units larger than days')
  }

  return new Instant(
    instant.epochNanoseconds + timeFieldsToNano(durationToTimeFields(duration)),
  )
}

export function diffInstants(a: Instant, b: Instant, options?: TimeDiffOptions): Duration {
  const diffConfig = parseDiffOptions(options, SECOND, NANOSECOND, NANOSECOND, HOUR, true)

  return nanoToDuration(
    roundNano(
      b.epochNanoseconds - a.epochNanoseconds,
      diffConfig,
    ),
    diffConfig.largestUnit,
  )
}

export function roundInstant(instant: Instant, options: TimeRoundingOptions): Instant {
  const roundingConfig = parseRoundingOptions(options, undefined, NANOSECOND, HOUR, false, true)
  const [dayNano, timeNano] = splitEpochNano(instant.epochNanoseconds)

  return new Instant(dayNano + roundNano(timeNano, roundingConfig))
}
