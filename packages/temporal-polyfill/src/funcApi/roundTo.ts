import type { Temporal } from 'temporal-spec'
import {
  coerceRoundingIncInteger,
  coerceRoundingMode,
} from '../internal/optionsCoerce'
import { RoundingMathTuple, RoundingMode } from '../internal/optionsModel'
import { normalizeOptions } from '../internal/optionsNormalize'
import { validateRoundingInc } from '../internal/optionsValidate'
import type { RoundingMathOptions } from '../internal/temporalSpecHelpers'
import { Unit } from '../internal/units'

export function refineRoundToOptions(
  smallestUnit: Unit,
  options?: RoundingMathOptions,
): RoundingMathTuple {
  options = normalizeOptions(options)

  // alphabetical
  let roundingInc = coerceRoundingIncInteger(options)
  const roundingMode = coerceRoundingMode(options, RoundingMode.HalfExpand)

  roundingInc = validateRoundingInc(roundingInc, smallestUnit)
  return [roundingInc, roundingMode]
}

export function createRoundToOptions<
  UN extends Temporal.PluralizeUnit<Temporal.DateUnit | Temporal.TimeUnit>,
  O extends RoundingMathOptions,
>(
  smallestUnit: UN,
  options?: O,
): { smallestUnit: UN } & O & RoundingMathOptions {
  options = normalizeOptions(options) as O
  return { ...options, smallestUnit }
}
