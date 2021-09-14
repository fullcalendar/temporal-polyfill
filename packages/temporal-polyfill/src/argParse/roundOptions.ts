import { RoundOptions, Unit } from '../args'
import { UnitInt } from '../dateUtils/units'
import { RoundingFunc } from '../utils/math'
import { parseRoundingMode } from './roundingMode'
import { parseUnit } from './units'

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
  if (smallestUnitDefault === null && options?.smallestUnit == null) {
    throw new Error('Need smallestUnit')
  }
  return {
    smallestUnit: parseUnit(options?.smallestUnit, smallestUnitDefault, minUnit, maxUnit),
    roundingMode: parseRoundingMode(options?.roundingMode, Math.round),
    roundingIncrement: options?.roundingIncrement ?? 1,
  }
}
