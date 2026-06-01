import type { RoundingMathOptions, RoundingMode } from 'temporal-utils'
import { roundingModeName } from '../internal/optionsConfig'
import { normalizeOptionsOrString } from '../internal/optionsNormalize'

export function normalizeRoundToOptions(
  options?: RoundingMathOptions | RoundingMode,
): RoundingMathOptions {
  // Unlike the required-option callers of normalizeOptionsOrString, roundTo's
  // options are optional, so handle undefined here with an empty null-proto
  // object (avoids Object.prototype pollution; matches createOptionsObject).
  if (options === undefined) {
    return Object.create(null)
  }
  return normalizeOptionsOrString<RoundingMathOptions, typeof roundingModeName>(
    options,
    roundingModeName,
  )
}
