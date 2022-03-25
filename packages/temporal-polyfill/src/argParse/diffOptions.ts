import { UnitInt } from '../dateUtils/units'
import { DiffOptions, Unit } from '../public/types'
import { ensureOptionsObj } from './refine'
import { RoundingConfig, parseRoundingOptions } from './roundingOptions'
import { parseUnit } from './unitStr'

export interface DiffConfig<
  UnitType extends UnitInt = UnitInt
> extends RoundingConfig<UnitType> {
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
  forInstant?: boolean, // weird
  forRounding?: boolean, // weird
): DiffConfig<UnitIntType> {
  const optionsObj = ensureOptionsObj(options)

  const roundingConfig = parseRoundingOptions<UnitArg, UnitIntType>(
    optionsObj, // even though accepts a unit, only ever give an object
    smallestUnitDefault,
    minUnit,
    maxUnit,
    !forRounding,
    forInstant,
  )

  largestUnitDefault = Math.max(largestUnitDefault, roundingConfig.smallestUnit) as UnitIntType

  let largestUnitArg = ensureOptionsObj(optionsObj).largestUnit
  if (largestUnitArg === 'auto') {
    largestUnitArg = undefined
  }

  const largestUnit = parseUnit(largestUnitArg, largestUnitDefault, minUnit, maxUnit)

  if (roundingConfig.smallestUnit > largestUnit) {
    throw new RangeError('Bad smallestUnit/largestUnit')
  }

  return {
    largestUnit,
    ...roundingConfig,
  }
}
