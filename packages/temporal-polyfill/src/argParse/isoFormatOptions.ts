import {
  MICROSECOND,
  MILLISECOND,
  MINUTE,
  NANOSECOND,
  SECOND,
  unitDigitMap,
} from '../dateUtils/units'
import { TimeToStringOptions, TimeToStringUnit } from '../public/args'
import { RoundingFunc } from '../utils/math'
import { parseRoundingMode } from './roundingMode'
import { parseUnit } from './units'

export type DurationToStringUnitInt =
  typeof SECOND |
  typeof MILLISECOND |
  typeof MICROSECOND |
  typeof NANOSECOND

export type TimeToStringUnitInt = typeof MINUTE | DurationToStringUnitInt

export interface TimeToStringConfig<UnitType extends TimeToStringUnitInt = TimeToStringUnitInt> {
  fractionalSecondDigits: number
  smallestUnit: UnitType
  roundingMode: RoundingFunc
}

export type DurationToStringConfig = TimeToStringConfig<DurationToStringUnitInt>

export function parseTimeToStringOptions<
  UnitArgType extends TimeToStringUnit,
  UnitType extends TimeToStringUnitInt
>(
  options: TimeToStringOptions<UnitArgType> | undefined,
  largestUnit: UnitType = MINUTE as UnitType,
): TimeToStringConfig<UnitType> {
  const smallestUnitArg = options?.smallestUnit
  const digitsArg = options?.fractionalSecondDigits
  let smallestUnit: UnitType
  let digits: number

  if (smallestUnitArg != null) {
    smallestUnit = parseUnit<UnitType>(
      smallestUnitArg,
      undefined, // no default. a required field
      NANOSECOND as UnitType, // minUnit
      largestUnit, // maxUnit
    )
    digits = unitDigitMap[smallestUnit] || 0 // for bigger than milliseconds, don't do any digits
  } else {
    smallestUnit = NANOSECOND as UnitType
    digits = digitsArg == null || digitsArg === 'auto' ? 0 : digitsArg
  }

  return {
    smallestUnit,
    fractionalSecondDigits: digits,
    roundingMode: parseRoundingMode(options?.roundingMode, Math.trunc),
  }
}
