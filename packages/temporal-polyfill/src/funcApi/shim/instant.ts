import { epochGetters } from '../../classApi/mixins'
import { createSlotClass } from '../../classApi/slotClass'
import { constructEpochNanoSlots } from '../../internal/construct'
import { formatInstantIso } from '../../internal/isoFormat'
import { refineTimeZoneId } from '../../internal/timeZoneId'
import { InstantRecordBranding } from '../common-branding'

export type InstantShimRecord = any

export const [
  InstantShimRecord,
  createInstantShimRecord,
  getInstantShimRecordSlots,
] = createSlotClass(
  InstantRecordBranding,
  constructEpochNanoSlots,
  (slots, options) => formatInstantIso(refineTimeZoneId, slots, options),
  epochGetters,
  {},
  {},
)
