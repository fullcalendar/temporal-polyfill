import { Temporal } from 'temporal-spec'
import { DAY, UnitInt, nanoIn } from '../dateUtils/units'
import { RoundingFunc } from '../utils/math'
import { ensureOptionsObj } from './refine'
import { parseRoundingModeOption } from './roundingMode'
import { parseUnit } from './unitStr'

export interface DiffConfig<UnitType extends UnitInt = UnitInt> {
  smallestUnit: UnitType
  largestUnit: UnitType
  roundingFunc: RoundingFunc
  roundingIncrement: number
}

export function parseDiffOptions<
  UnitArg extends Temporal.DateTimeUnit,
  UnitIntType extends UnitInt
>(
  options: Temporal.DifferenceOptions<UnitArg> | undefined,
  largestUnitDefault: UnitIntType,
  smallestUnitDefault: UnitIntType,
  minUnit: UnitIntType,
  maxUnit: UnitIntType,
  forDurationRounding?: boolean, // TODO: change to 'defaultRoundingFunc'
): DiffConfig<UnitIntType> {
  const ensuredOptions = ensureOptionsObj(options)
  const roundingIncrement = ensuredOptions.roundingIncrement ?? 1
  const smallestUnit = parseUnit(ensuredOptions.smallestUnit, smallestUnitDefault, minUnit, maxUnit)
  const roundingFunc = parseRoundingModeOption(
    ensuredOptions,
    forDurationRounding ? Math.round : Math.trunc,
  )

  let largestUnitArg = ensuredOptions.largestUnit
  if (largestUnitArg === 'auto') {
    largestUnitArg = undefined
  }

  largestUnitDefault = Math.max(largestUnitDefault, smallestUnit) as UnitIntType
  const largestUnit = parseUnit(largestUnitArg, largestUnitDefault, minUnit, maxUnit)

  if (smallestUnit > largestUnit) {
    throw new RangeError('Bad smallestUnit/largestUnit')
  }

  if (smallestUnit < DAY) {
    const largerNano = nanoIn[smallestUnit + 1]
    const incNano = nanoIn[smallestUnit] * roundingIncrement

    if (largerNano === incNano) {
      throw new RangeError('Must not equal larger unit')
    }

    if (largerNano % incNano) {
      throw new RangeError('Must divide into larger unit')
    }
  }

  return {
    smallestUnit,
    largestUnit,
    roundingFunc,
    roundingIncrement,
  }
}
