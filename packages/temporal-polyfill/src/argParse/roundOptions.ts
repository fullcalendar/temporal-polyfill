import { UnitInt } from '../dateUtils/units'
import { RoundOptions, Unit } from '../public/types'
import { RoundingFunc } from '../utils/math'
import { ensureOptionsObj } from './refine'
import { parseRoundingModeOption } from './roundingMode'
import { parseUnit } from './unitStr'

export interface RoundConfig<UnitType extends UnitInt = UnitInt> {
  smallestUnit: UnitType
  roundingMode: RoundingFunc
  roundingIncrement: number
}

export function parseRoundOptions<
  UnitArgType extends Unit,
  UnitType extends UnitInt
>(
  options: Partial<RoundOptions<UnitArgType>> | undefined,
  smallestUnitDefault: UnitType | undefined,
  minUnit: UnitType,
  maxUnit: UnitType,
): RoundConfig<UnitType> {
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
