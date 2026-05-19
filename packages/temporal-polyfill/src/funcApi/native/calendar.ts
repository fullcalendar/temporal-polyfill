import { createSlotClass } from '../../classApi/slotClass'
import { CalendarRecordBranding } from '../common-branding'

export type CalendarNativeRecord = any

export const [
  CalendarNativeRecord,
  createCalendarNativeRecord,
  getCalendarNativeRecordId,
] = createSlotClass(
  CalendarRecordBranding,
  (calendarId: string) => calendarId, // TODO: use identity
  (calendarId: string) => calendarId, // formatFunc. TODO: use identity
  {}, // getters
  {},
  {},
)
