import { Temporal } from 'temporal-spec'
import { DayTimeUnit } from '../dateUtils/dayAndTime'
import { DAY, DayTimeUnitInt, nanoIn, nanoInDay } from '../dateUtils/units'
import { RoundingFunc } from '../utils/math'
import { ensureOptionsObj } from './refine'
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
  options: Temporal.RoundTo<UnitArgType> | UnitArgType,
  minUnit: UnitType,
  maxUnit: UnitType,
  relaxedDivisibility?: boolean,
): RoundingConfig<UnitType> {
  const optionsObj: Temporal.RoundTo<UnitArgType> | undefined =
    typeof options === 'string'
      ? { smallestUnit: options }
      : options

  const ensuredOptions = ensureOptionsObj(optionsObj, true) // strict=true
  const roundingIncrement = ensuredOptions.roundingIncrement ?? 1
  const smallestUnit = parseUnit(ensuredOptions.smallestUnit, undefined, minUnit, maxUnit)
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
