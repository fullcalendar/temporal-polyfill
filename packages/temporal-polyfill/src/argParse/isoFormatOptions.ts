import {
  MICROSECOND,
  MILLISECOND,
  MINUTE,
  NANOSECOND,
  SECOND,
  nanoIn,
  unitDigitMap,
} from '../dateUtils/units'
import { TimeToStringOptions, TimeToStringUnit } from '../public/types'
import { RoundingFunc } from '../utils/math'
import { OVERFLOW_REJECT } from './overflowHandling'
import { constrainInt, ensureOptionsObj } from './refine'
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
  roundingIncrement: number // number of nanoseconds (rename? but good for gzip)
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
  let smallestUnit = NANOSECOND as UnitType
  let roundingIncrement = 1
  let digits: number | undefined

  if (smallestUnitArg !== undefined) {
    smallestUnit = parseUnit<UnitType>(
      smallestUnitArg,
      undefined, // no default. a required field
      NANOSECOND as UnitType, // minUnit
      largestUnit, // maxUnit
    )
    roundingIncrement = nanoIn[smallestUnit]
    digits = unitDigitMap[smallestUnit]
  } else if (digitsArg !== undefined && digitsArg !== 'auto') {
    digits = constrainInt(digitsArg, 0, 9, OVERFLOW_REJECT)
    roundingIncrement = Math.pow(10, 9 - digits)
  }

  return {
    smallestUnit,
    fractionalSecondDigits: digits,
    roundingMode: parseRoundingModeOption(options, Math.trunc),
    roundingIncrement,
  }
}
