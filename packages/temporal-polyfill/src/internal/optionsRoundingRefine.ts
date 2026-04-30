import { requirePropDefined } from './cast'
import * as errorMessages from './errorMessages'
import {
  coerceLargestUnit,
  coerceRoundingIncInteger,
  coerceRoundingMode,
  coerceSmallestUnit,
  coerceTotalUnit,
} from './optionsCoerce'
import {
  largestUnitStr,
  relativeToName,
  roundingModeName,
  smallestUnitStr,
  totalUnitStr,
} from './optionsConfig'
import { RoundingMode } from './optionsModel'
import type {
  DiffOptions,
  DiffTuple,
  DurationRoundingOptions,
  DurationRoundingTuple,
  DurationTotalOptions,
  RoundingMathOptions,
  RoundingMathTuple,
  RoundingModeName,
  RoundingOptions,
  RoundingTuple,
} from './optionsModel'
import { normalizeOptions, normalizeOptionsOrString } from './optionsNormalize'
import {
  checkLargestSmallestUnit,
  validateRoundingInc,
  validateUnitRange,
} from './optionsValidate'
import {
  type DayTimeUnit,
  type DayTimeUnitName,
  Unit,
  type UnitName,
} from './units'

/*
High-level rounding, diff, and total option refinement.

These functions read complete option bags and return operation tuples. They are
not generic coercion helpers: their job is preserving Temporal's option read
order while validating relationships such as largest/smallest unit and
rounding increment divisibility.
*/

function invertRoundingMode(roundingMode: RoundingMode): RoundingMode {
  if (roundingMode < 4) {
    return (roundingMode + 2) % 4
  }
  return roundingMode
}

export function refineDiffOptions<UN extends UnitName>(
  roundingModeInvert: boolean | undefined,
  options: DiffOptions<UN> | undefined,
  defaultLargestUnit: Unit,
  maxUnit = Unit.Year,
  minUnit = Unit.Nanosecond,
  defaultRoundingMode: RoundingMode = RoundingMode.Trunc,
): DiffTuple {
  options = normalizeOptions(options)

  let largestUnit = coerceLargestUnit(options, minUnit)
  let roundingInc = coerceRoundingIncInteger(options)
  let roundingMode = coerceRoundingMode(options, defaultRoundingMode)
  let smallestUnit = coerceSmallestUnit(options, minUnit, true)!

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
  options: DurationRoundingOptions<RA> | UnitName,
  defaultLargestUnit: Unit,
  refineRelativeTo: (relativeTo?: RA) => R,
): DurationRoundingTuple<R> {
  options = normalizeOptionsOrString<
    DurationRoundingOptions<RA>,
    typeof smallestUnitStr
  >(options, smallestUnitStr)

  // alphabetcal
  let largestUnit = coerceLargestUnit(options)
  const relativeToInternals = refineRelativeTo(options[relativeToName])
  let roundingInc = coerceRoundingIncInteger(options)
  const roundingMode = coerceRoundingMode(options, RoundingMode.HalfExpand)
  let smallestUnit = coerceSmallestUnit(options)

  if (largestUnit === undefined && smallestUnit === undefined) {
    throw new RangeError(errorMessages.missingSmallestLargestUnit)
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
    throw new RangeError(
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

export function refineRoundingOptions<UN extends DayTimeUnitName>(
  options: RoundingOptions<UN> | UN,
  maxUnit: DayTimeUnit = Unit.Day,
  solarMode?: boolean,
): RoundingTuple {
  options = normalizeOptionsOrString<
    RoundingOptions<UN>,
    typeof smallestUnitStr
  >(options, smallestUnitStr)

  // alphabetical
  let roundingInc = coerceRoundingIncInteger(options)
  const roundingMode = coerceRoundingMode(options, RoundingMode.HalfExpand)
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
  options: RoundingModeName | RoundingMathOptions,
  allowManyLargeUnits?: boolean,
): RoundingMathTuple {
  options = normalizeOptionsOrString<
    RoundingMathOptions,
    typeof roundingModeName
  >(options, roundingModeName)

  // alphabetical
  let roundingInc = coerceRoundingIncInteger(options)
  const roundingMode = coerceRoundingMode(options, RoundingMode.HalfExpand)

  roundingInc = validateRoundingInc(
    roundingInc,
    smallestUnit,
    allowManyLargeUnits,
  )
  return [roundingInc, roundingMode]
}

/*
For funcApi
*/
export function refineUnitDiffOptions(
  smallestUnit: Unit,
  options: RoundingModeName | RoundingMathOptions,
): RoundingMathTuple | [undefined, undefined] {
  if (options !== undefined) {
    return refineRoundingMathOptions(smallestUnit, options, true)
  }
  return [] as unknown as [undefined, undefined]
}

/*
For funcApi
*/
export function refineUnitRoundOptions(
  smallestUnit: Unit,
  options: RoundingModeName | RoundingMathOptions,
): RoundingMathTuple {
  if (options !== undefined) {
    return refineRoundingMathOptions(smallestUnit, options)
  }
  return [1, RoundingMode.HalfExpand]
}

export function refineTotalOptions<RA, R>(
  options: UnitName | DurationTotalOptions<RA>,
  refineRelativeTo: (relativeTo?: RA) => R | undefined,
): [Unit, R | undefined] {
  options = normalizeOptionsOrString<
    DurationTotalOptions<RA>,
    typeof totalUnitStr
  >(options, totalUnitStr)

  // alphabetical
  const relativeToInternals = refineRelativeTo(options[relativeToName])
  let totalUnit = coerceTotalUnit(options)
  totalUnit = requirePropDefined(totalUnitStr, totalUnit)

  return [
    totalUnit, // required
    relativeToInternals,
  ]
}
