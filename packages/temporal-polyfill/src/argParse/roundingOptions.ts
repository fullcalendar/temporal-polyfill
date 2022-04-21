import { DayTimeUnit } from '../dateUtils/dayAndTime'
import { DAY, DayTimeUnitInt, nanoIn, nanoInDay } from '../dateUtils/units'
import { Temporal } from '../spec'
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
  options: Partial<Temporal.RoundTo<UnitArgType>> | UnitArgType | undefined,
  smallestUnitDefault: UnitType | undefined,
  minUnit: UnitType,
  maxUnit: UnitType,
  relaxedDivisibility?: boolean,
): RoundingConfig<UnitType> {
  const optionsObj: Partial<Temporal.RoundTo<UnitArgType>> | undefined =
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

  if (smallestUnit === DAY) {
    if (roundingIncrement !== 1) {
      throw new RangeError('When smallestUnit is days, roundingIncrement must be 1')
    }
  } else {
    const largerNano = relaxedDivisibility ? nanoInDay : nanoIn[smallestUnit + 1]

    if (!relaxedDivisibility && largerNano === incNano) {
      throw new RangeError('Must not equal larger unit')
    }

    if (largerNano % incNano) {
      throw new RangeError('Must divide into larger unit')
    }
  }

  return {
    smallestUnit,
    roundingFunc,
    incNano,
  }
}
