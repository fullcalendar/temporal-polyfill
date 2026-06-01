import type { Temporal } from 'temporal-spec'
import type { RoundingMathOptions, RoundingMode } from 'temporal-utils'
import { normalizeRoundToOptions } from '../roundToUtils'

/*
Shoehorns a separately-held smallestUnit into a raw options object for the
native branch, whose underlying `.round()` method accepts only a single
options-like argument and does its own spec-compliant parsing. (The shim
branch instead refines directly via refineRoundToOptions.)
*/
export function createRoundToOptions<
  UN extends Temporal.PluralizeUnit<Temporal.DateUnit | Temporal.TimeUnit>,
>(
  smallestUnit: UN,
  options?: RoundingMathOptions | RoundingMode,
): { smallestUnit: UN } & RoundingMathOptions {
  return { ...normalizeRoundToOptions(options), smallestUnit }
}
