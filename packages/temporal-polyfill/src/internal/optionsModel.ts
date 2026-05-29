import { type SubsecDigits } from './optionsInput'
import { Unit } from './units'

/*
Shared internal option model.

There are two internal shapes in this file:

- const enums are the small internal representations produced by coercion.
- `*Tuple` types are compact internal-only return values from the
  `refine*Options` helpers. User input should never be modeled as a tuple.

Raw option-bag input shapes live in optionsInput.

Keeping this model apart from normalization, coercion, validation, and
call-site refinement avoids pulling implementation helpers into otherwise
independent option modules.
*/

// Coerced internal option values. These are never raw user strings.
export const enum Overflow {
  Constrain = 0,
  Reject = 1,
}

export const enum EpochDisambig {
  Compat = 0,
  Reject = 1,
  Earlier = 2,
  Later = 3,
}

export const enum OffsetDisambig {
  Reject = 0,
  Use = 1,
  Prefer = 2,
  Ignore = 3,
}

export const enum CalendarDisplay {
  Auto = 0,
  Never = 1,
  Critical = 2,
  Always = 3,
}

export const enum TimeZoneDisplay {
  Auto = 0,
  Never = 1,
  Critical = 2,
}

export const enum OffsetDisplay {
  Auto = 0,
  Never = 1,
}

export const enum RoundingMode {
  // Modes that get inverted by optionsRoundingRefine.invertRoundingMode.
  // If this enum changes, update roundingModeMap and roundingModeFuncs in
  // optionsConfig so string coercion and rounding dispatch stay aligned.
  Floor = 0,
  HalfFloor = 1,
  Ceil = 2,
  HalfCeil = 3,
  // other modes
  Trunc = 4,
  HalfTrunc = 5,
  Expand = 6,
  HalfExpand = 7,
  HalfEven = 8,
}

/*
common SubsecDigits addons:
  -1 means hide seconds
  undefined means 'auto' (display all digits but no trailing zeros)
*/

export const enum Direction {
  Previous = -1, // compatible with internal getTransition
  Next = 1, // "
}

// Refined internal tuples. The tuple order follows each refining helper's
// chosen return contract, not the user's option-property order.
export type ZonedFieldTuple = [Overflow, OffsetDisambig, EpochDisambig]

// Refined internal tuples. Units and modes have already been validated and
// converted to internal enum values by the time these shapes are used.
export type RoundingMathTuple = [
  roundingInc: number,
  roundingMode: RoundingMode,
]

export type RoundingTuple = [smallestUnit: Unit, ...RoundingMathTuple]

export type DiffTuple = [largestUnit: Unit, ...RoundingTuple]

export type DurationRoundingTuple<R> = [...DiffTuple, R]

// Refined internal tuples used by ISO string formatting.
export type TimeDisplayTuple = [
  roundingMode: RoundingMode,
  nanoInc: number,
  subsecDigits: SubsecDigits | -1 | undefined, // TODO: change -1 to null?
]

export type ZonedDateTimeDisplayTuple = [
  CalendarDisplay,
  TimeZoneDisplay,
  OffsetDisplay,
  ...TimeDisplayTuple,
]

export type DateTimeDisplayTuple = [CalendarDisplay, ...TimeDisplayTuple]

export type InstantDisplayTuple = [string | undefined, ...TimeDisplayTuple]
