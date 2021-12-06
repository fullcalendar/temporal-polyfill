import { UnitInt } from '../dateUtils/units'
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
): RoundingConfig<UnitType> {
  if (smallestUnitDefault === undefined && !isObjectLike(options)) {
    throw new TypeError('Need rounding options')
  }

  const ensuredOptions = ensureOptionsObj(options)
  return {
    smallestUnit: parseUnit(ensuredOptions.smallestUnit, smallestUnitDefault, minUnit, maxUnit),
    roundingMode: parseRoundingModeOption(options, Math.trunc),
    roundingIncrement: ensuredOptions.roundingIncrement ?? 1,
  }
}
