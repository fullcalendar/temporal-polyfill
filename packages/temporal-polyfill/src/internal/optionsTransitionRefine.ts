import * as errorMessages from './errorMessages'
import { coerceDirection } from './optionsCoerce'
import { directionName } from './optionsConfig'
import { Direction } from './optionsModel'
import type { DirectionName, DirectionOptions } from './optionsModel'
import { normalizeOptionsOrString } from './optionsNormalize'

/*
High-level transition option refinement.

Temporal.TimeZone transition APIs accept either a direction string shorthand or
an options object. This file owns that whole-options shape and the resulting
internal direction enum.
*/

export function refineDirectionOptions(
  options: DirectionOptions | DirectionName,
): Direction {
  const normalizedOptions = normalizeOptionsOrString<
    DirectionOptions,
    typeof directionName
  >(options, directionName)
  const res = coerceDirection(normalizedOptions, 0)
  if (!res) {
    // neither positive or negative
    throw new RangeError(errorMessages.invalidEntity(directionName, res))
  }
  return res
}
