import { timeFieldDefaults, timeFieldNamesAsc } from './fieldNames'
import { TimeFields } from './fieldTypes'
import { constrainIsoTimeFields } from './isoMath'
import { Overflow } from './optionsModel'
import { pluckProps } from './utils'

export function resolveTimeFields(
  fields: Partial<TimeFields>,
  overflow?: Overflow,
): TimeFields {
  // Start from Temporal's default time bag so partial inputs behave like full
  // records before overflow handling clamps or rejects out-of-range values.
  return constrainIsoTimeFields(
    pluckProps(timeFieldNamesAsc, { ...timeFieldDefaults, ...fields }),
    overflow,
  )
}
