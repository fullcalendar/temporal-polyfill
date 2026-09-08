import type { RoundingMathOptions, RoundingMode } from 'temporal-utils'
import {
  coerceRoundingIncInteger,
  coerceRoundingMode,
} from '../internal/optionsCoerce'
import { roundingModeName } from '../internal/optionsConfig'
import { RoundingMathTuple, RoundingModeEnum } from '../internal/optionsModel'
import { normalizeOptionsOrString } from '../internal/optionsNormalize'
import { validateRoundingInc } from '../internal/optionsValidate'
import { Unit } from '../internal/units'

// Options
// -----------------------------------------------------------------------------

/*
Refines roundTo*-style args where smallestUnit is already known separately
(as a positional arg) and the options bag only carries roundingIncrement/
roundingMode. Avoids synthesizing a raw options object for re-parsing.
*/
export function refineRoundToOptions(
  smallestUnit: Unit,
  options?: RoundingMathOptions | RoundingMode,
  solarMode?: boolean, // Instant: increments validated against a full day
): RoundingMathTuple {
  options = normalizeRoundToOptions(options)

  // alphabetical
  let roundingInc = coerceRoundingIncInteger(options)
  const roundingMode = coerceRoundingMode(options, RoundingModeEnum.HalfExpand)

  roundingInc = validateRoundingInc(
    roundingInc,
    smallestUnit,
    undefined,
    solarMode,
  )
  return [roundingInc, roundingMode]
}

// Unlike the required-option callers of normalizeOptionsOrString, roundTo's
// options are optional, so handle undefined here with an empty null-proto
// object (avoids Object.prototype pollution; matches createOptionsObject).
export function normalizeRoundToOptions(
  options?: RoundingMathOptions | RoundingMode,
): RoundingMathOptions {
  if (options === undefined) {
    return Object.create(null)
  }
  return normalizeOptionsOrString<RoundingMathOptions, typeof roundingModeName>(
    options,
    roundingModeName,
  )
}
