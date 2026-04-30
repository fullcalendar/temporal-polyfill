import { timeFieldDefaults, timeFieldNamesAsc } from './fieldNames'
import { TimeFields } from './fieldTypes'
import { IsoTimeFields, isoTimeFieldNamesAsc } from './isoFields'
import { constrainIsoTimeFields } from './isoMath'
import { Overflow } from './optionsModel'
import { bindArgs, remapProps } from './utils'

// Public Temporal time fields and internal ISO time fields carry the same
// numeric values, but their property names differ. Keep this conversion outside
// fieldRefine so callers do not imply any user-observable coercion happens here.
export const timeFieldsToIso = bindArgs(
  remapProps<TimeFields, IsoTimeFields>,
  timeFieldNamesAsc,
  isoTimeFieldNamesAsc,
)

// Inverse of timeFieldsToIso(), used when internal ISO time slots need to be
// exposed through the calendar-shaped field records used by from-fields paths.
export const isoTimeFieldsToCal = bindArgs(
  remapProps<IsoTimeFields, TimeFields>,
  isoTimeFieldNamesAsc,
  timeFieldNamesAsc,
)

export function resolveTimeFields(
  fields: Partial<TimeFields>,
  overflow?: Overflow,
): IsoTimeFields {
  // Start from Temporal's default time bag so partial inputs behave like full
  // records before overflow handling clamps or rejects out-of-range values.
  return constrainIsoTimeFields(
    timeFieldsToIso({ ...timeFieldDefaults, ...fields }),
    overflow,
  )
}
