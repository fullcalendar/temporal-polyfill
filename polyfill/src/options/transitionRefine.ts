import type { Temporal } from 'temporal-spec'
import * as errorMessages from '../internal/errorMessages'
import { throwRangeError } from '../internal/utils'
import { coerceDirection } from './coerce'
import { directionName } from './config'
import { Direction } from './model'
import { normalizeOptionsOrString } from './normalize'

/*
High-level transition option refinement.

Temporal.TimeZone transition APIs accept either a direction string shorthand or
an options object. This file owns that whole-options shape and the resulting
internal direction enum.
*/

export function refineDirectionOptions(
  options: Temporal.TransitionOptions | Temporal.TransitionOptions['direction'],
): Direction {
  const normalizedOptions = normalizeOptionsOrString<
    Temporal.TransitionOptions,
    typeof directionName
  >(options, directionName)
  const res = coerceDirection(normalizedOptions, 0)
  if (!res) {
    // neither positive or negative
    throwRangeError(errorMessages.invalidEntity(directionName, res))
  }
  return res
}
