import * as errorMessages from './errorMessages'
import { roundingIncName } from './optionsConfig'
import { Overflow } from './optionsModel'
import { Unit, nanoInUtcDay, unitNamesAsc, unitNanoMap } from './units'
import { clampEntity, throwRangeError } from './utils'

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
  roundingInc: number, // from coerceRoundingIncInteger, so already 1 to 1e9
  smallestUnit: Unit,
  allowManyLargeUnits?: boolean,
  solarMode?: boolean,
): number {
  const upUnitNano = solarMode ? nanoInUtcDay : unitNanoMap[smallestUnit + 1]

  if (upUnitNano) {
    const incNano = roundingInc * unitNanoMap[smallestUnit]

    // Must divide the larger unit evenly, which also rejects anything longer than
    // it. Only solar mode can round to one whole larger unit.
    if (upUnitNano % incNano || (!solarMode && incNano === upUnitNano)) {
      throwRangeError(errorMessages.invalidEntity(roundingIncName, roundingInc))
    }
  } else if (!allowManyLargeUnits && roundingInc > 1) {
    throwRangeError(errorMessages.invalidEntity(roundingIncName, roundingInc))
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
