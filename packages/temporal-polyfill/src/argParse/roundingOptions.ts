import { DAY, DayTimeUnitInt, nanoIn, nanoInDay } from '../dateUtils/units'
import { DayTimeUnit, RoundingOptions } from '../public/types'
import { RoundingFunc } from '../utils/math'
import { ensureOptionsObj, isObjectLike } from './refine'
import { parseRoundingModeOption } from './roundingMode'
import { parseUnit } from './unitStr'

export interface RoundingConfig<UnitType extends DayTimeUnitInt = DayTimeUnitInt> {
  smallestUnit: UnitType
  roundingFunc: RoundingFunc
  incNano: number
}

export function parseRoundingOptions<
  UnitArgType extends DayTimeUnit,
  UnitType extends DayTimeUnitInt
>(
  options: Partial<RoundingOptions<UnitArgType>> | UnitArgType | undefined,
  smallestUnitDefault: UnitType | undefined,
  minUnit: UnitType,
  maxUnit: UnitType,
  relaxedDivisibility?: boolean, // if true, only checks whether divides into a day
): RoundingConfig<UnitType> {
  const optionsObj: Partial<RoundingOptions<UnitArgType>> | undefined =
    typeof options === 'string'
      ? { smallestUnit: options }
      : options

  if (smallestUnitDefault === undefined && !isObjectLike(optionsObj)) {
    throw new TypeError('Need rounding options')
  }

  const ensuredOptions = ensureOptionsObj(optionsObj)
  const roundingIncrement = ensuredOptions.roundingIncrement ?? 1
  const smallestUnit = parseUnit(ensuredOptions.smallestUnit, smallestUnitDefault, minUnit, maxUnit)
  const roundingFunc = parseRoundingModeOption(ensuredOptions, Math.round)
  const incNano = nanoIn[smallestUnit] * roundingIncrement

  if (
    smallestUnit < DAY &&
    (relaxedDivisibility ? nanoInDay : nanoIn[smallestUnit + 1]) % incNano
  ) {
    throw new RangeError('Increment must evenly divide')
  }

  return {
    smallestUnit,
    roundingFunc,
    incNano,
  }
}
