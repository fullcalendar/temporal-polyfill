import { roundingModeFuncs } from '../options/config'
import { RoundingModeEnum } from '../options/model'

/*
Never receives smallestUnit/roundingIncrement. Use computeNanoInc for that.
*/
export function roundNumberToInc(
  num: number,
  roundingInc: number,
  roundingMode: RoundingModeEnum,
): number {
  return roundWithMode(num / roundingInc, roundingMode) * roundingInc
}

export function roundWithMode(
  num: number,
  roundingMode: RoundingModeEnum,
): number {
  return roundingModeFuncs[roundingMode](num)
}
