import {
  MICROSECOND,
  MILLISECOND,
  MINUTE,
  NANOSECOND,
  SECOND,
  unitDigitMap,
} from '../dateUtils/units'
import { TimeToStringOptions, TimeToStringUnit } from '../public/types'
import { RoundingFunc } from '../utils/math'
import { OVERFLOW_REJECT } from './overflowHandling'
import { constrainValue, ensureOptionsObj } from './refine'
import { parseRoundingModeOption } from './roundingMode'
import { parseUnit } from './unitStr'

export type DurationToStringUnitInt =
  typeof SECOND |
  typeof MILLISECOND |
  typeof MICROSECOND |
  typeof NANOSECOND

export type TimeToStringUnitInt = typeof MINUTE | DurationToStringUnitInt

export interface TimeToStringConfig<UnitType extends TimeToStringUnitInt = TimeToStringUnitInt> {
  fractionalSecondDigits: number | undefined
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
  const ensuredOptions = ensureOptionsObj(options)
  const smallestUnitArg = ensuredOptions.smallestUnit
  const digitsArg = ensuredOptions.fractionalSecondDigits
  let smallestUnit: UnitType
  let digits: number | undefined

  if (smallestUnitArg !== undefined) {
    smallestUnit = parseUnit<UnitType>(
      smallestUnitArg,
      undefined, // no default. a required field
      NANOSECOND as UnitType, // minUnit
      largestUnit, // maxUnit
    )
    digits = unitDigitMap[smallestUnit] || 0 // for bigger than milliseconds, don't do any digits
  } else {
    smallestUnit = NANOSECOND as UnitType
    digits = (digitsArg === undefined || digitsArg === 'auto')
      ? undefined
      : constrainValue(digitsArg, 0, 9, OVERFLOW_REJECT)
  }

  return {
    smallestUnit,
    fractionalSecondDigits: digits,
    roundingMode: parseRoundingModeOption(options, Math.trunc),
  }
}
