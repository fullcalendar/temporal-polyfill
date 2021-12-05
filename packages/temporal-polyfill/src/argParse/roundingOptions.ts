import { UnitInt } from '../dateUtils/units'
import { RoundingOptions, Unit } from '../public/types'
import { RoundingFunc } from '../utils/math'
import { ensureOptionsObj } from './refine'
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
  const ensuredOptions = ensureOptionsObj(options)

  if (smallestUnitDefault === undefined && ensuredOptions.smallestUnit === undefined) {
    throw new Error('Need smallestUnit')
  }

  return {
    smallestUnit: parseUnit(ensuredOptions.smallestUnit, smallestUnitDefault, minUnit, maxUnit),
    roundingMode: parseRoundingModeOption(options, Math.trunc),
    roundingIncrement: ensuredOptions.roundingIncrement ?? 1,
  }
}
