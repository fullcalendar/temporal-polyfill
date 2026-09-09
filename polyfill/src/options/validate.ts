import * as errorMessages from '../internal/errorMessages'
import {
  Unit,
  nanoInUtcDay,
  unitNamesAsc,
  unitNanoMap,
} from '../internal/units'
import { clampEntity, throwRangeError } from '../internal/utils'
import { roundingIncName } from './config'
import { Overflow } from './model'

/*
Post-coercion option validation.

These helpers assume option properties have already been read and coerced.
Keeping them separate from `coerce` makes the staged flow clearer:
normalize the options object, coerce individual values, then validate
relationships or operation-specific bounds.
*/

/*
TODO: change defaults and the way this is called because almost always
allowManyLargeUnits: true
*/
export function validateRoundingInc(
  roundingInc: number, // results from coerceRoundingIncInteger
  smallestUnit: Unit,
  allowManyLargeUnits?: boolean,
  solarMode?: boolean,
): number {
  const upUnitNano = solarMode ? nanoInUtcDay : unitNanoMap[smallestUnit + 1]

  if (upUnitNano) {
    const unitNano = unitNanoMap[smallestUnit]
    const maxRoundingInc = upUnitNano / unitNano
    roundingInc = clampEntity(
      roundingIncName,
      roundingInc,
      1,
      maxRoundingInc - (solarMode ? 0 : 1),
      Overflow.Reject,
    )

    // % is dangerous, but -0 will be falsy just like 0
    if (upUnitNano % (roundingInc * unitNano)) {
      throwRangeError(errorMessages.invalidEntity(roundingIncName, roundingInc))
    }
  } else {
    roundingInc = clampEntity(
      roundingIncName,
      roundingInc,
      1,
      allowManyLargeUnits ? 10 ** 9 : 1,
      Overflow.Reject,
    )
  }

  return roundingInc
}

export function validateUnitRange<U extends Unit | null | undefined>(
  optionName: string,
  unit: U,
  minUnit: Unit,
  maxUnit: Unit,
): U {
  if (unit != null) {
    clampEntity(
      optionName,
      unit,
      minUnit,
      maxUnit,
      Overflow.Reject,
      unitNamesAsc,
    )
  }
  return unit
}

export function checkLargestSmallestUnit(
  largestUnit: Unit,
  smallestUnit: Unit,
): void {
  if (smallestUnit > largestUnit) {
    throwRangeError(errorMessages.flippedSmallestLargestUnit)
  }
}
