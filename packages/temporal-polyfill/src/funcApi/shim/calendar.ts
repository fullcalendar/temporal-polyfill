import { createSlotClass } from '../../classApi/slotClass'
import {
  InternalCalendar,
  getInternalCalendarId,
} from '../../internal/externalCalendar'
import { CalendarRecordBranding } from '../common-branding'

export type CalendarShimRecord = any

export const [
  CalendarShimRecord,
  createCalendarShimRecord,
  getCalendarShimRecordInternal,
] = createSlotClass(
  CalendarRecordBranding,
  (internalCalendar: InternalCalendar) => internalCalendar, // TODO: use identity
  (internalCalendar: InternalCalendar) =>
    getInternalCalendarId(internalCalendar), // formatFunc
  {}, // getters
  {},
  {},
)
