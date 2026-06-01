import type { Temporal } from 'temporal-spec'
import {
  coerceRoundingIncInteger,
  coerceRoundingMode,
} from '../internal/optionsCoerce'
import { roundingModeName } from '../internal/optionsConfig'
import { RoundingMathTuple, RoundingMode } from '../internal/optionsModel'
import {
  getOptionsObject,
  normalizeOptionsOrString,
} from '../internal/optionsNormalize'
import { validateRoundingInc } from '../internal/optionsValidate'
import type {
  RoundingMathOptions,
  RoundingModeName,
} from '../internal/temporalSpecHelpers'
import { Unit } from '../internal/units'

export type RoundToOptions = RoundingModeName | RoundingMathOptions

export function refineRoundToOptions(
  smallestUnit: Unit,
  options?: RoundToOptions,
): RoundingMathTuple {
  options = normalizeRoundToOptions(options)

  // alphabetical
  let roundingInc = coerceRoundingIncInteger(options)
  const roundingMode = coerceRoundingMode(options, RoundingMode.HalfExpand)

  roundingInc = validateRoundingInc(roundingInc, smallestUnit)
  return [roundingInc, roundingMode]
}

export function createRoundToOptions<
  UN extends Temporal.PluralizeUnit<Temporal.DateUnit | Temporal.TimeUnit>,
>(
  smallestUnit: UN,
  options?: RoundToOptions,
): { smallestUnit: UN } & RoundingMathOptions {
  options = normalizeRoundToOptions(options)
  return { ...options, smallestUnit }
}

export function normalizeRoundToOptions(
  options?: RoundToOptions,
): RoundingMathOptions {
  if (options === undefined) {
    return getOptionsObject(undefined)
  }
  return normalizeOptionsOrString<RoundingMathOptions, typeof roundingModeName>(
    options,
    roundingModeName,
  )
}
