import { RoundingModeEnum } from '../options/model'
import { divideBigNanoToExactNumber } from './bigNano'
import { isoDateTimeToEpochNano } from './epochMath'
import { CalendarDateTimeFields, TimeFields } from './fieldTypes'
import {
  computeBigNanoInc,
  computeNanoInc,
  roundBigNanoToInc,
  roundNumberToInc,
} from './round'
import { timeFieldsToNano } from './timeFieldMath'
import { DayTimeUnit, TimeUnit, unitNanoMap } from './units'

// Scalar fixed-unit arithmetic for inputs and rounding settings that the API
// layer has already validated and refined.

// Diff and round an exact epoch interval before converting it to a scalar unit.
export function computeEpochNanoUnitDiff(
  start: bigint,
  end: bigint,
  unit: DayTimeUnit,
  smallestUnit: DayTimeUnit,
  increment: number,
  mode: RoundingModeEnum,
): number {
  return divideBigNanoToExactNumber(
    roundBigNanoToInc(
      end - start,
      computeBigNanoInc(smallestUnit, increment),
      mode,
    ),
    unitNanoMap[unit],
  )
}

export function computeIsoDateTimeUnitDiff(
  start: CalendarDateTimeFields,
  end: CalendarDateTimeFields,
  unit: TimeUnit,
  smallestUnit: TimeUnit,
  increment: number,
  mode: RoundingModeEnum,
): number {
  return computeEpochNanoUnitDiff(
    isoDateTimeToEpochNano(start),
    isoDateTimeToEpochNano(end),
    unit,
    smallestUnit,
    increment,
    mode,
  )
}

export function computeTimeUnitDiff(
  start: TimeFields,
  end: TimeFields,
  unit: TimeUnit,
  smallestUnit: TimeUnit,
  increment: number,
  mode: RoundingModeEnum,
): number {
  // Converting the integral rounded result through bigint canonicalizes -0 and
  // uses the same exact quotient/remainder construction as duration totaling.
  return divideBigNanoToExactNumber(
    BigInt(
      roundNumberToInc(
        timeFieldsToNano(end) - timeFieldsToNano(start),
        computeNanoInc(smallestUnit, increment),
        mode,
      ),
    ),
    unitNanoMap[unit],
  )
}
