import type { Temporal } from 'temporal-spec'
import type { RoundingMathOptions, RoundingMode } from 'temporal-utils'
import { coerceRoundingIncInteger } from '../../internal/optionsCoerce'
import { normalizeUnitRoundOptions } from '../../internal/optionsRoundingRefine'
import { isObjectLike } from '../../internal/utils'

/*
Option preparation for the native branch of the function API: building and
copying the options and fields bags that wrappers hand to native Temporal, which
then does its own spec-compliant parsing. (The shim branch refines options
through internal/options*.ts instead.)
*/

// Rounding options
// -----------------------------------------------------------------------------
// Options for the roundTo* functions, which take the unit separately.

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
  const copy = refineProps(normalizeUnitRoundOptions(options), {}) as {
    smallestUnit: UN
  } & RoundingMathOptions
  copy.smallestUnit = smallestUnit
  return copy
}

/*
Options for temporal-utils' year/month/week rounding, which only allows an
increment of exactly 1 and checks that before anything has coerced the value.
Coerce here first, as the shim branch does, so 1.9, true and "1" all mean 1.
*/
export function createCalendarRoundOptions(
  options?: RoundingMathOptions | RoundingMode,
): RoundingMathOptions {
  const copy = refineProps(normalizeUnitRoundOptions(options), {})
  copy.roundingIncrement = coerceRoundingIncInteger(copy)
  return copy
}

// Copying options and fields
// -----------------------------------------------------------------------------
// One-pass copies of options and fields bags, with chosen props refined.

/*
Copies the props, then replaces the value at each of the refiners' keys with
that refiner's result, called with the copied value. With no refiners, it's a
plain one-pass copy.

Native doesn't understand function-API records, so some wrappers have to change
a property before passing an options or fields object on, such as swapping a
record for its native object or checking a time zone ID. They do that on a copy
made here, never on the caller's object.

Both branches of the function API must accept the same objects and produce the
same results. So the copy keeps every enumerable property, including ones
inherited through a prototype, which the shim branch reads like any other. A
spread would drop those.

Each property of the caller's object is read exactly once. Unlike the shim
branch, the copy reads them all up front, in key order, rather than in the
order the spec reads them. That departure is deliberate.

A missing or non-object value passes through unchanged, so native reports it
the way it would have anyway (undefined is allowed, null throws a TypeError).
*/
export function refineProps<P, R extends RefinerMap<P>>(
  props: P,
  refiners: R,
): RefinedProps<P, R> {
  if (!isObjectLike(props)) {
    return props as any
  }

  const copy: any = {}
  for (const key in props) {
    copy[key] = props[key]
  }
  for (const key in refiners) {
    copy[key] = refiners[key]!(copy[key])
  }
  return copy
}

// Types
// -----------------------------------------------------------------------------

type RefinerMap<P> = {
  [K in keyof NonNullable<P>]?: (value: NonNullable<P>[K]) => unknown
}

type RefinedProps<P, R> = Omit<NonNullable<P>, keyof R> & {
  [K in keyof R]: R[K] extends (value: any) => infer V ? V : never
}
