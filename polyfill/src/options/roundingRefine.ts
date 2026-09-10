import type { Temporal } from 'temporal-spec'
import type { RoundingMathOptions, RoundingMode } from 'temporal-utils'
import { requirePropDefined } from '../internal/cast'
import * as errorMessages from '../internal/errorMessages'
import type {
  DurationRoundingOptions,
  DurationTotalOptions,
} from '../internal/temporalSpecHelpers'
import { type DayTimeUnit, Unit } from '../internal/units'
import { throwRangeError } from '../internal/utils'
import {
  coerceLargestUnit,
  coerceRoundingIncInteger,
  coerceRoundingMode,
  coerceSmallestUnit,
  coerceTotalUnit,
} from './coerce'
import {
  largestUnitStr,
  relativeToName,
  roundingModeName,
  smallestUnitStr,
  totalUnitStr,
} from './config'
import { RoundingModeEnum } from './model'
import type {
  DiffTuple,
  DurationRoundingTuple,
  RoundingMathTuple,
  RoundingTuple,
  UnitDiffRoundingTuple,
} from './model'
import { normalizeOptions, normalizeOptionsOrString } from './normalize'
import {
  checkLargestSmallestUnit,
  validateRoundingInc,
  validateUnitRange,
} from './validate'

/*
High-level rounding, diff, and total option refinement.

These functions read complete option bags and return operation tuples. They are
not generic coercion helpers: their job is preserving Temporal's option read
order while validating relationships such as largest/smallest unit and
rounding increment divisibility.
*/

function invertRoundingMode(roundingMode: RoundingModeEnum): RoundingModeEnum {
  if (roundingMode < 4) {
    return (roundingMode + 2) % 4
  }
  return roundingMode
}

export function refineDiffOptions<
  UN extends Temporal.DateUnit | Temporal.TimeUnit,
>(
  roundingModeInvert: boolean | undefined,
  options: Temporal.RoundingOptionsWithLargestUnit<UN> | undefined,
  defaultLargestUnit: Unit,
  maxUnit = Unit.Year,
  minUnit = Unit.Nanosecond,
  defaultRoundingMode: RoundingModeEnum = RoundingModeEnum.Trunc,
): DiffTuple {
  options = normalizeOptions(options)

  // alphabetical
  let largestUnit = coerceLargestUnit(options, minUnit)
  let roundingInc = coerceRoundingIncInteger(options) // "roundingIncrement"
  let roundingMode = coerceRoundingMode(options, defaultRoundingMode)
  let smallestUnit = coerceSmallestUnit(options, minUnit, true)

  largestUnit = validateUnitRange(largestUnitStr, largestUnit, minUnit, maxUnit)
  smallestUnit = validateUnitRange(
    smallestUnitStr,
    smallestUnit,
    minUnit,
    maxUnit,
  )

  if (largestUnit == null) {
    largestUnit = Math.max(defaultLargestUnit, smallestUnit)
  } else {
    checkLargestSmallestUnit(largestUnit, smallestUnit)
  }

  roundingInc = validateRoundingInc(roundingInc, smallestUnit, true)

  if (roundingModeInvert) {
    roundingMode = invertRoundingMode(roundingMode)
  }

  return [largestUnit, smallestUnit, roundingInc, roundingMode]
}

export function refineDurationRoundOptions<RA, R>(
  options:
    | DurationRoundingOptions<RA>
    | Temporal.PluralizeUnit<Temporal.DateUnit | Temporal.TimeUnit>,
  defaultLargestUnit: Unit,
  refineRelativeTo: (relativeTo?: RA) => R,
): DurationRoundingTuple<R> {
  options = normalizeOptionsOrString<
    DurationRoundingOptions<RA>,
    typeof smallestUnitStr
  >(options, smallestUnitStr)

  // alphabetical
  let largestUnit = coerceLargestUnit(options)
  const relativeToInternals = refineRelativeTo(options[relativeToName])
  let roundingInc = coerceRoundingIncInteger(options) // "roundingIncrement"
  const roundingMode = coerceRoundingMode(options, RoundingModeEnum.HalfExpand)
  let smallestUnit = coerceSmallestUnit(options)

  if (largestUnit === undefined && smallestUnit === undefined) {
    throwRangeError(errorMessages.missingSmallestLargestUnit)
  }

  if (smallestUnit == null) {
    smallestUnit = Unit.Nanosecond
  }
  if (largestUnit == null) {
    largestUnit = Math.max(smallestUnit, defaultLargestUnit)
  }

  checkLargestSmallestUnit(largestUnit, smallestUnit)
  roundingInc = validateRoundingInc(roundingInc, smallestUnit, true)

  if (
    roundingInc > 1 &&
    smallestUnit > Unit.Hour && // a date unit?
    largestUnit !== smallestUnit
  ) {
    throwRangeError(
      'For calendar units with roundingIncrement > 1, use largestUnit = smallestUnit',
    )
  }

  return [
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
    relativeToInternals,
  ]
}

export function refineRoundingOptions<UN extends 'day' | Temporal.TimeUnit>(
  options: Temporal.RoundingOptions<UN> | Temporal.PluralizeUnit<UN>,
  maxUnit: DayTimeUnit = Unit.Day,
  solarMode?: boolean,
): RoundingTuple {
  options = normalizeOptionsOrString<
    Temporal.RoundingOptions<UN>,
    typeof smallestUnitStr
  >(options, smallestUnitStr)

  // alphabetical
  let roundingInc = coerceRoundingIncInteger(options) // "roundingIncrement"
  const roundingMode = coerceRoundingMode(options, RoundingModeEnum.HalfExpand)
  let smallestUnit = coerceSmallestUnit(options)

  smallestUnit = requirePropDefined(smallestUnitStr, smallestUnit)
  smallestUnit = validateUnitRange(
    smallestUnitStr,
    smallestUnit,
    Unit.Nanosecond,
    maxUnit,
  )!
  roundingInc = validateRoundingInc(
    roundingInc,
    smallestUnit,
    undefined,
    solarMode,
  )

  return [smallestUnit, roundingInc, roundingMode]
}

function refineRoundingMathOptions(
  smallestUnit: Unit,
  options: RoundingMathOptions | RoundingMode,
  allowManyLargeUnits?: boolean,
  defaultRoundingMode = RoundingModeEnum.HalfExpand,
): RoundingMathTuple {
  options = normalizeOptionsOrString<
    RoundingMathOptions,
    typeof roundingModeName
  >(options, roundingModeName)

  // alphabetical
  let roundingInc = coerceRoundingIncInteger(options) // "roundingIncrement"
  const roundingMode = coerceRoundingMode(options, defaultRoundingMode)

  roundingInc = validateRoundingInc(
    roundingInc,
    smallestUnit,
    allowManyLargeUnits,
  )
  return [roundingInc, roundingMode]
}

/*
Refines temporal-utils' two diff paths without manufacturing Temporal options.
Any rounding option (a mode, or the presence of an increment) selects the
rounded path, where the requested unit is both largest and smallest and
the mode defaults to until()'s `trunc`. Otherwise the result is an exact
total, represented by an undefined mode, and no options are read at all.
*/
export function refineUnitDiffOptions(
  unit: Unit,
  options: RoundingMathOptions | RoundingMode | undefined,
): UnitDiffRoundingTuple {
  const isRounded =
    typeof options === 'string' ||
    Boolean(
      options &&
        (options.roundingMode || options.roundingIncrement !== undefined),
    )

  return isRounded
    ? refineRoundingMathOptions(
        unit,
        options as RoundingMathOptions | RoundingMode,
        true,
        RoundingModeEnum.Trunc,
      )
    : [1, undefined]
}

/*
Refines roundTo*-style args where smallestUnit is already known separately
(as a positional arg) and the options bag only carries roundingIncrement/
roundingMode. Avoids synthesizing a raw options object for re-parsing.
*/
export function refineUnitRoundOptions(
  smallestUnit: Unit,
  options?: RoundingMathOptions | RoundingMode,
  solarMode?: boolean, // Instant: increments validated against a full day
): RoundingMathTuple {
  options = normalizeUnitRoundOptions(options)

  // alphabetical
  let roundingInc = coerceRoundingIncInteger(options) // "roundingIncrement"
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
export function normalizeUnitRoundOptions(
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

export function refineTotalOptions<RA, R>(
  options:
    | Temporal.PluralizeUnit<'day' | Temporal.TimeUnit>
    | DurationTotalOptions<RA>,
  refineRelativeTo: (relativeTo?: RA) => R | undefined,
): [Unit, R | undefined] {
  options = normalizeOptionsOrString<
    DurationTotalOptions<RA>,
    typeof totalUnitStr
  >(options, totalUnitStr)

  // alphabetical
  const relativeToInternals = refineRelativeTo(options[relativeToName])
  let totalUnit = coerceTotalUnit(options) // "unit"
  totalUnit = requirePropDefined(totalUnitStr, totalUnit)

  return [
    totalUnit, // required
    relativeToInternals,
  ]
}
