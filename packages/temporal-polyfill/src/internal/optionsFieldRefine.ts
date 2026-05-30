import type { Temporal } from 'temporal-spec'
import { requireObjectLike } from './cast'
import {
  coerceEpochDisambig,
  coerceOffsetDisambig,
  coerceOverflow,
} from './optionsCoerce'
import { EpochDisambig, OffsetDisambig, Overflow } from './optionsModel'
import type { ZonedFieldTuple } from './optionsModel'
import { getOptionsObject } from './optionsNormalize'

/*
High-level field-construction option refinement.

These readers cover option bags used while constructing or updating Temporal
fields: overflow, offset disambiguation, and epoch disambiguation. They keep
the observable option read order close to the field-resolution operations that
depend on it.
*/

export function refineOverflowOptions(
  options: Temporal.OverflowOptions | undefined,
): Overflow {
  return options === undefined
    ? Overflow.Constrain
    : coerceOverflow(requireObjectLike(options))
}

export function refineZonedFieldOptions(
  options: Temporal.ZonedDateTimeFromOptions | undefined,
  defaultOffsetDisambig: OffsetDisambig = OffsetDisambig.Reject,
): ZonedFieldTuple {
  options = getOptionsObject(options)

  // alphabetical
  const epochDisambig = coerceEpochDisambig(options) // "disambig"
  const offsetDisambig = coerceOffsetDisambig(options, defaultOffsetDisambig) // "offset"
  const overflow = coerceOverflow(options) // "overflow"

  return [overflow, offsetDisambig, epochDisambig]
}

export function refineEpochDisambigOptions(
  options: Temporal.DisambiguationOptions | undefined,
): EpochDisambig {
  return coerceEpochDisambig(getOptionsObject(options))
}
