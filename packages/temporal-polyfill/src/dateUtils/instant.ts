import { parseDiffOptions } from '../argParse/diffOptions'
import { RoundConfig, parseRoundOptions } from '../argParse/roundOptions'
import { CompareResult, TimeDiffOptions, TimeRoundOptions } from '../public/args'
import { Duration } from '../public/duration'
import { Instant } from '../public/instant'
import { compareValues } from '../utils/math'
import { joinEpochNano, splitEpochNano } from './dayTime'
import { computeLargestDurationUnit, durationToTimeFields, nanoToDuration } from './duration'
import { roundNano } from './round'
import { timeFieldsToNano } from './time'
import { DAY, HOUR, NANOSECOND, SECOND, TimeUnitInt } from './units'

export function compareInstants(a: Instant, b: Instant): CompareResult {
  return compareValues(a.epochNanoseconds, b.epochNanoseconds)
}

export function addToInstant(instant: Instant, duration: Duration): Instant {
  const largestUnit = computeLargestDurationUnit(duration)

  if (largestUnit >= DAY) {
    throw new Error('Duration cant have units larger than days')
  }

  return new Instant(
    instant.epochNanoseconds + BigInt(
      timeFieldsToNano(durationToTimeFields(duration)),
    ),
  )
}

export function diffInstants(a: Instant, b: Instant, options?: TimeDiffOptions): Duration {
  const diffConfig = parseDiffOptions(options, SECOND, NANOSECOND, NANOSECOND, HOUR)

  return nanoToDuration(
    roundNano(
      Number(b.epochNanoseconds - a.epochNanoseconds),
      diffConfig as RoundConfig<TimeUnitInt>,
    ),
    diffConfig.largestUnit,
  )
}

export function roundInstant(instant: Instant, options: TimeRoundOptions): Instant {
  const roundConfig = parseRoundOptions(options, undefined, NANOSECOND, HOUR)
  const [dayNano, timeNano] = splitEpochNano(instant.epochNanoseconds)

  return new Instant(
    joinEpochNano(
      dayNano,
      roundNano(timeNano, roundConfig as RoundConfig<TimeUnitInt>),
    ),
  )
}
