import { Temporal } from 'temporal-spec'
import { DiffConfig } from '../argParse/diffOptions'
import { durationUnitNames } from '../argParse/unitStr'
import { roundToIncrement, roundToIncrementBI } from '../utils/math'
import { durationDayTimeToNano, nanoToDuration } from './dayAndTime'
import { DiffableObj } from './diff'
import {
  DurationFields,
  UnsignedDurationFields,
  computeLargestDurationUnit,
  negateDuration,
} from './durationFields'
import { spanDurationFrom, spanDurationFromDateTime } from './durationSpan'
import { toEpochNano } from './epoch'
import { computeExactDuration } from './totalUnits'
import {
  DAY,
  NANOSECOND,
  UnitInt,
  isDateUnit,
  isDayTimeUnit,
  nanoIn,
} from './units'

// duration rounding is very different from datetime rounding
// more similar to diffing
// TODO: make a new type `DurationRoundingConfig` that includes relativeTo

export function roundDuration(
  duration: DurationFields,
  diffConfig: DiffConfig<UnitInt>,
  relativeTo: DiffableObj | undefined, // TODO: start using `DurationRoundingConfig`
  calendar: Temporal.CalendarProtocol | undefined,
): DurationFields {
  const { largestUnit, smallestUnit, roundingIncrement, roundingFunc } = diffConfig

  if (
    relativeTo === undefined && // skip this block if relativeTo defined
    computeLargestDurationUnit(duration) <= DAY &&
    isDayTimeUnit(largestUnit) &&
    isDayTimeUnit(smallestUnit)
  ) {
    const nano = roundToIncrementBI(
      durationDayTimeToNano(duration),
      nanoIn[smallestUnit] * roundingIncrement,
      roundingFunc,
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
  calendar: Temporal.CalendarProtocol,
  flip: boolean,
  diffConfig: DiffConfig,
): DurationFields {
  const { largestUnit, smallestUnit, roundingIncrement, roundingFunc } = diffConfig

  // optimize for time units
  if (!isDateUnit(largestUnit)) {
    const diffNano = toEpochNano(d1).sub(toEpochNano(d0)).mult(flip ? -1 : 1)
    const diffNanoRounded = roundToIncrementBI(
      diffNano,
      nanoIn[smallestUnit] * roundingIncrement,
      roundingFunc,
    )
    return nanoToDuration(diffNanoRounded, largestUnit)
  }

  let durationFields = computeExactDuration(spannedDuration, smallestUnit, d0, d1)
  const unitName = durationUnitNames[smallestUnit] as keyof UnsignedDurationFields

  function doRound() {
    const orig = durationFields[unitName] // computeExactDuration guarantees value
    durationFields[unitName] = roundToIncrement(orig, roundingIncrement, roundingFunc)
  }

  if (roundingFunc === Math.round) {
    // 'halfExpand' cares about point-to-point translation
    doRound()
  }
  if (flip) {
    durationFields = negateDuration(durationFields)
  }
  if (roundingFunc !== Math.round) {
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
