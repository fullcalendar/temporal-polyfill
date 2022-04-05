import { DiffConfig } from '../argParse/diffOptions'
import { OFFSET_PREFER } from '../argParse/offsetHandling'
import { RoundingConfig } from '../argParse/roundingOptions'
import { durationUnitNames } from '../argParse/unitStr'
import { Calendar } from '../public/calendar'
import { TimeZone } from '../public/timeZone'
import { roundToIncrement, roundToIncrementBI } from '../utils/math'
import {
  durationDayTimeToNano,
  isoTimeToNano,
  nanoToDuration,
  nanoToISOTime,
  zeroISOTimeFields,
} from './dayAndTime'
import { DiffableObj } from './diff'
import { computeLargestDurationUnit, negateDuration } from './durationFields'
import { spanDurationFrom, spanDurationFromDateTime } from './durationSpan'
import { splitEpochNano, toEpochNano } from './epoch'
import { computeNanoInDay, computeZonedDateTimeEpochNano } from './offset'
import { computeExactDuration } from './totalUnits'
import { addDays } from './translate'
import {
  DurationFields,
  ISODateTimeFields,
  ISOTimeFields,
  UnsignedDurationFields,
} from './typesPrivate'
import {
  DAY,
  DayTimeUnitInt,
  NANOSECOND,
  TimeUnitInt,
  UnitInt,
  isDateUnit,
  isDayTimeUnit,
  nanoIn,
} from './units'

export function roundDateTime(
  fields: ISODateTimeFields,
  roundingConfig: RoundingConfig<DayTimeUnitInt>,
): ISODateTimeFields {
  const timeNano = isoTimeToNano(fields)
  const roundedTimeNano = roundNano(timeNano, roundingConfig)
  const [isoTimeFields, dayDelta] = nanoToISOTime(roundedTimeNano)

  const dayStartTranslated = addDays(fields, dayDelta)
  return { ...dayStartTranslated, ...isoTimeFields }
}

export function roundTime(
  fields: ISOTimeFields,
  roundingConfig: RoundingConfig<TimeUnitInt>,
): ISOTimeFields {
  const timeNano = isoTimeToNano(fields)
  const roundedTimeNano = roundNano(timeNano, roundingConfig)
  const [isoTimeFields] = nanoToISOTime(roundedTimeNano)
  return isoTimeFields
}

export function roundEpochNano(
  epochNano: bigint,
  roundingConfig: RoundingConfig<TimeUnitInt>,
): bigint {
  const [dayEpochNano, timeNano] = splitEpochNano(epochNano)
  const roundedTimeNano = roundNano(timeNano, roundingConfig)
  return dayEpochNano + BigInt(roundedTimeNano)
}

// returns epochNano!!!
export function roundZonedDateTimeFields(
  fields: ISODateTimeFields & { calendar: Calendar, timeZone: TimeZone },
  roundingConfig: RoundingConfig<DayTimeUnitInt>,
): bigint {
  const { calendar, timeZone } = fields
  const timeNano = isoTimeToNano(fields)
  let isoTimeFields: ISOTimeFields
  let dayDelta: number

  if (roundingConfig.smallestUnit === DAY) {
    isoTimeFields = zeroISOTimeFields
    dayDelta = Math.round(timeNano / computeNanoInDay(fields))
  } else {
    ([isoTimeFields, dayDelta] = nanoToISOTime(timeNano))
  }

  const dayStartTranslated = addDays(fields, dayDelta)
  return computeZonedDateTimeEpochNano(
    {
      ...dayStartTranslated,
      ...isoTimeFields,
      calendar, // !!!
      timeZone, // !!!
    },
    false,
    OFFSET_PREFER,
  )
}

export function roundDuration(
  duration: DurationFields,
  diffConfig: DiffConfig<UnitInt>,
  relativeTo: DiffableObj | undefined,
  calendar: Calendar | undefined,
): DurationFields {
  const { largestUnit, smallestUnit } = diffConfig

  if (
    relativeTo === undefined && // skip this block if relativeTo defined
    computeLargestDurationUnit(duration) <= DAY &&
    isDayTimeUnit(largestUnit) &&
    isDayTimeUnit(smallestUnit)
  ) {
    const nano = roundNanoBI(
      durationDayTimeToNano(duration),
      diffConfig as RoundingConfig<DayTimeUnitInt>,
    )
    return nanoToDuration(nano, largestUnit)
  }

  if (!relativeTo) {
    throw new RangeError('Need relativeTo')
  }

  const [spannedDuration, relativeToTranslated] = spanDurationFromDateTime(
    duration,
    largestUnit,
    relativeTo,
    calendar!,
  )

  return roundDurationSpan(
    spannedDuration,
    relativeTo,
    relativeToTranslated,
    calendar!,
    false,
    diffConfig,
  )
}

export function roundDurationSpan(
  spannedDuration: DurationFields,
  d0: DiffableObj,
  d1: DiffableObj,
  calendar: Calendar,
  flip: boolean,
  diffConfig: DiffConfig,
): DurationFields {
  const { largestUnit, smallestUnit, roundingIncrement, roundingMode } = diffConfig

  // optimize for time units
  if (!isDateUnit(largestUnit)) {
    const diffNano = (toEpochNano(d1) - toEpochNano(d0)) * (flip ? -1n : 1n)
    const diffNanoRounded = roundNanoBI(diffNano, diffConfig as RoundingConfig<DayTimeUnitInt>)
    return nanoToDuration(diffNanoRounded, largestUnit)
  }

  let durationFields = computeExactDuration(spannedDuration, smallestUnit, d0, d1)
  const unitName = durationUnitNames[smallestUnit] as keyof UnsignedDurationFields

  function doRound() {
    const orig = durationFields[unitName] // computeExactDuration guarantees value
    durationFields[unitName] = roundToIncrement(
      orig,
      roundingIncrement,
      roundingMode,
    )
  }

  if (roundingMode === Math.round) {
    // 'halfExpand' cares about point-to-point translation
    doRound()
  }
  if (flip) {
    durationFields = negateDuration(durationFields)
  }
  if (roundingMode !== Math.round) {
    // other rounding techniques operate on final number
    doRound()
  }
  // TODO: instead of this mess, have a halfExpandDirection arg

  // rebalance
  if (smallestUnit > NANOSECOND) {
    if (flip) {
      // yuck
      durationFields = negateDuration(
        spanDurationFrom(negateDuration(durationFields), largestUnit, d0, calendar),
      )
    } else {
      durationFields = spanDurationFrom(durationFields, largestUnit, d0, calendar)
    }
  }

  return durationFields
}

// low-level utils (just for day-and-time)

export function roundNano(nano: number, roundingConfig: RoundingConfig<DayTimeUnitInt>): number {
  return roundToIncrement(
    nano,
    computeRoundingNanoIncrement(roundingConfig),
    roundingConfig.roundingMode,
  )
}

export function roundNanoBI(nano: bigint, roundingConfig: RoundingConfig<DayTimeUnitInt>): bigint {
  return roundToIncrementBI(
    nano,
    computeRoundingNanoIncrement(roundingConfig),
    roundingConfig.roundingMode,
  )
}

function computeRoundingNanoIncrement(roundingConfig: RoundingConfig<DayTimeUnitInt>): number {
  return nanoIn[roundingConfig.smallestUnit] * roundingConfig.roundingIncrement
}
