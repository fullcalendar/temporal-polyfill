import { Temporal } from 'temporal-spec'
import {
  MICROSECOND,
  MILLISECOND,
  MINUTE,
  NANOSECOND,
  SECOND,
  nanoIn,
  unitDigitMap,
} from '../dateUtils/units'
import { OVERFLOW_REJECT } from './overflowHandling'
import { constrainInt, ensureOptionsObj } from './refine'
import { parseRoundingModeOption } from './roundingMode'
import { RoundingConfig } from './roundingOptions'
import { parseUnit } from './unitStr'

export type DurationToStringUnitInt = // TODO: move this??? weird name/location for this
  typeof SECOND |
  typeof MILLISECOND |
  typeof MICROSECOND |
  typeof NANOSECOND

export type TimeToStringUnitInt = typeof MINUTE | DurationToStringUnitInt

export interface TimeToStringConfig<
  UnitType extends TimeToStringUnitInt = TimeToStringUnitInt
> extends RoundingConfig<UnitType> {
  fractionalSecondDigits: number | undefined
}

export type DurationToStringConfig = TimeToStringConfig<DurationToStringUnitInt>

export function parseTimeToStringOptions<UnitType extends TimeToStringUnitInt>(
  options: Temporal.ToStringPrecisionOptions | undefined,
  largestUnit: UnitType = MINUTE as UnitType,
): TimeToStringConfig<UnitType> {
  const ensuredOptions = ensureOptionsObj(options)
  const smallestUnitArg = ensuredOptions.smallestUnit
  const digitsArg = ensuredOptions.fractionalSecondDigits
  let smallestUnit = NANOSECOND as UnitType
  let incNano = 1
  let digits: number | undefined

  if (smallestUnitArg !== undefined) {
    smallestUnit = parseUnit<UnitType>(
      smallestUnitArg,
      undefined, // no default. a required field
      NANOSECOND as UnitType, // minUnit
      largestUnit, // maxUnit
    )
    incNano = nanoIn[smallestUnit]
    digits = unitDigitMap[smallestUnit] || 0
  } else if (digitsArg !== undefined && digitsArg !== 'auto') {
    digits = constrainInt(digitsArg, 0, 9, OVERFLOW_REJECT)
    incNano = Math.pow(10, 9 - digits)
  }

  return {
    smallestUnit,
    fractionalSecondDigits: digits,
    roundingFunc: parseRoundingModeOption(options, Math.trunc),
    incNano,
  }
}
