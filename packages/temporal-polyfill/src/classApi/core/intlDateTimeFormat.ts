import { createDateTimeFormatClass } from '../intlDateTimeFormat'
import { getTemporalBrandingAndSlots } from './temporalSlots'

export type DateTimeFormat = Intl.DateTimeFormat
export const DateTimeFormat = createDateTimeFormatClass(
  getTemporalBrandingAndSlots,
)
