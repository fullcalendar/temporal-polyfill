import { DAY, UnitInt, nanoIn, nanoInDay } from '../dateUtils/units'
import { RoundingOptions, Unit } from '../public/types'
import { RoundingFunc } from '../utils/math'
import { ensureOptionsObj, isObjectLike } from './refine'
import { parseRoundingModeOption } from './roundingMode'
import { parseUnit } from './unitStr'

export interface RoundingConfig<UnitType extends UnitInt = UnitInt> {
  smallestUnit: UnitType
  roundingMode: RoundingFunc
  roundingIncrement: number
}

export function parseRoundingOptions<
  UnitArgType extends Unit,
  UnitType extends UnitInt
>(
  options: Partial<RoundingOptions<UnitArgType>> | undefined,
  smallestUnitDefault: UnitType | undefined,
  minUnit: UnitType,
  maxUnit: UnitType,
  forDiffing?: boolean,
  forInstant?: boolean,
): RoundingConfig<UnitType> {
  if (smallestUnitDefault === undefined && !isObjectLike(options)) {
    throw new TypeError('Need rounding options')
  }

  const ensuredOptions = ensureOptionsObj(options)
  const roundingIncrement = ensuredOptions.roundingIncrement ?? 1
  const smallestUnit = parseUnit(ensuredOptions.smallestUnit, smallestUnitDefault, minUnit, maxUnit)

  // Instant rounding only cares about solar alignment
  if (!forDiffing && forInstant) {
    if (
      smallestUnit < DAY &&
      nanoInDay % roundingIncrement * nanoIn[smallestUnit]
    ) {
      throw new RangeError('Increment must evenly divide into 24 hours')
    }
  } else {
    if (
      (smallestUnit < DAY)
        ? nanoIn[smallestUnit + 1] % roundingIncrement
        : !forDiffing && roundingIncrement !== 1 // rounding can't have non-1 large units
    ) {
      throw new RangeError('roundingIncrement does not divide evenly into next highest unit')
    }

    if (
      smallestUnit < DAY &&
      roundingIncrement * nanoIn[smallestUnit] >= nanoIn[smallestUnit + 1]
    ) {
      throw new RangeError('roundingIncrement must be less than next highest unit')
    }
  }

  return {
    smallestUnit,
    roundingMode: parseRoundingModeOption(options, forDiffing ? Math.trunc : Math.round),
    roundingIncrement,
  }
}
