import type { Temporal } from 'temporal-spec'
import type { RoundingMathOptions, RoundingMode } from 'temporal-utils'
import { coerceRoundingIncInteger } from '../../internal/optionsCoerce'
import { normalizeUnitRoundOptions } from '../../internal/optionsRoundingRefine'

/*
Shoehorns a separately-held smallestUnit into a raw options object for the
native branch, whose underlying `.round()` method accepts only a single
options-like argument and does its own spec-compliant parsing. (The shim
branch instead refines directly via refineUnitRoundOptions.)
*/
export function createRoundToOptions<
  UN extends Temporal.PluralizeUnit<Temporal.DateUnit | Temporal.TimeUnit>,
>(
  smallestUnit: UN,
  options?: RoundingMathOptions | RoundingMode,
): { smallestUnit: UN } & RoundingMathOptions {
  return { ...normalizeUnitRoundOptions(options), smallestUnit }
}

/*
Options for temporal-utils' year/month/week rounding, which only allows an
increment of exactly 1 and checks that before anything has coerced the value.
Coerce here first, as the shim branch does, so 1.9, true and "1" all mean 1.
*/
export function createCalendarRoundOptions(
  options?: RoundingMathOptions | RoundingMode,
): RoundingMathOptions {
  const normOptions = normalizeUnitRoundOptions(options)

  return {
    ...normOptions,
    roundingIncrement: coerceRoundingIncInteger(normOptions),
  } as RoundingMathOptions
}
