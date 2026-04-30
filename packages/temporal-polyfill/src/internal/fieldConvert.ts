import { timeFieldDefaults, timeFieldNamesAsc } from './fieldNames'
import { TimeFields } from './fieldTypes'
import { constrainIsoTimeFields } from './isoMath'
import { Overflow } from './optionsModel'
import { bindArgs, remapProps } from './utils'

// Time fields do not carry a calendar. Keep this helper as the internal
// boundary between user-facing bags and ISO-date algorithms, even though it is
// currently an identity remap.
export const timeFieldsToIso = bindArgs(
  remapProps<TimeFields, TimeFields>,
  timeFieldNamesAsc,
  timeFieldNamesAsc,
)

// Inverse of timeFieldsToIso(), also currently an identity remap.
export const isoTimeFieldsToCal = bindArgs(
  remapProps<TimeFields, TimeFields>,
  timeFieldNamesAsc,
  timeFieldNamesAsc,
)

export function resolveTimeFields(
  fields: Partial<TimeFields>,
  overflow?: Overflow,
): TimeFields {
  // Start from Temporal's default time bag so partial inputs behave like full
  // records before overflow handling clamps or rejects out-of-range values.
  return constrainIsoTimeFields(
    timeFieldsToIso({ ...timeFieldDefaults, ...fields }),
    overflow,
  )
}
