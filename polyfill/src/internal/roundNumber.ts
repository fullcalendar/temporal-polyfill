import { roundingModeFuncs } from './optionsConfig'
import { RoundingModeEnum } from './optionsModel'

/*
Never receives smallestUnit/roundingIncrement. Use computeNanoInc for that.
*/
export function roundNumberToInc(
  num: number,
  roundingInc: number,
  roundingMode: RoundingModeEnum,
): number {
  // Rounding a small negative toward zero can give -0, such as Math.trunc(-0.1),
  // which must not reach results where Object.is or a function-API caller sees it
  return roundWithMode(num / roundingInc, roundingMode) * roundingInc || 0
}

export function roundWithMode(
  num: number,
  roundingMode: RoundingModeEnum,
): number {
  return roundingModeFuncs[roundingMode](num)
}
