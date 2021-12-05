import { UnitInt } from '../dateUtils/units'
import { DiffOptions, Unit } from '../public/types'
import { ensureOptionsObj } from './refine'
import { RoundConfig, parseRoundOptions } from './roundOptions'
import { parseUnit } from './unitStr'

export interface DiffConfig<
  UnitType extends UnitInt = UnitInt
> extends RoundConfig<UnitType> {
  largestUnit: UnitType
}

export function parseDiffOptions<
  UnitArg extends Unit,
  UnitIntType extends UnitInt
>(
  options: DiffOptions<UnitArg> | undefined,
  largestUnitDefault: UnitIntType,
  smallestUnitDefault: UnitIntType,
  minUnit: UnitIntType,
  maxUnit: UnitIntType,
): DiffConfig<UnitIntType> {
  const roundingConfig = parseRoundOptions<UnitArg, UnitIntType>(
    options,
    smallestUnitDefault,
    minUnit,
    maxUnit,
  )

  largestUnitDefault = Math.max(largestUnitDefault, roundingConfig.smallestUnit) as UnitIntType
  const largestUnitArg = ensureOptionsObj(options).largestUnit
  const largestUnit = largestUnitArg === 'auto'
    ? largestUnitDefault
    : parseUnit(largestUnitArg, largestUnitDefault, minUnit, maxUnit)

  if (roundingConfig.smallestUnit > largestUnit) {
    throw new Error('Bad smallestUnit/largestUnit') // need to throw this right?
  }

  return {
    largestUnit,
    ...roundingConfig,
  }
}
