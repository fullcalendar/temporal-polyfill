import { requireObjectLike } from './cast'
import {
  coerceEpochDisambig,
  coerceOffsetDisambig,
  coerceOverflow,
} from './optionsCoerce'
import { EpochDisambig, OffsetDisambig, Overflow } from './optionsModel'
import type {
  EpochDisambigOptions,
  OverflowOptions,
  ZonedFieldOptions,
  ZonedFieldTuple,
} from './optionsModel'
import { normalizeOptions } from './optionsNormalize'

/*
High-level field-construction option refinement.

These readers cover option bags used while constructing or updating Temporal
fields: overflow, offset disambiguation, and epoch disambiguation. They keep
the observable option read order close to the field-resolution operations that
depend on it.
*/

export function refineOverflowOptions(
  options: OverflowOptions | undefined,
): Overflow {
  return options === undefined
    ? Overflow.Constrain
    : coerceOverflow(requireObjectLike(options))
}

export function refineZonedFieldOptions(
  options: ZonedFieldOptions | undefined,
  defaultOffsetDisambig: OffsetDisambig = OffsetDisambig.Reject,
): ZonedFieldTuple {
  options = normalizeOptions(options)

  // alphabetical
  const epochDisambig = coerceEpochDisambig(options) // "disambig"
  const offsetDisambig = coerceOffsetDisambig(options, defaultOffsetDisambig) // "offset"
  const overflow = coerceOverflow(options) // "overflow"

  return [overflow, offsetDisambig, epochDisambig]
}

export function refineEpochDisambigOptions(
  options: EpochDisambigOptions | undefined,
): EpochDisambig {
  return coerceEpochDisambig(normalizeOptions(options))
}
