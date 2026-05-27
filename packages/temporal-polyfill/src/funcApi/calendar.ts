import * as errorMessages from '../internal/errorMessages'
import {
  gregoryCalendarId,
  isoCalendarId,
} from '../internal/intlCalendarConfig'
import { NativeTemporal } from '../nativeSwitch'
import * as Native from './native/calendar'
import type { CalendarRecord } from './recordTypes'
import * as Shim from './shim/calendar'

export type { CalendarRecord }

export const getIsoCalendar: () => CalendarRecord = NativeTemporal
  ? Native.getIsoCalendar
  : Shim.getIsoCalendar

export const getGregoryCalendar: () => CalendarRecord = NativeTemporal
  ? Native.getGregoryCalendar
  : Shim.getGregoryCalendar

export const getIntlCalendar: (calendarId: string) => CalendarRecord =
  NativeTemporal ? Native.getIntlCalendar : Shim.getIntlCalendar

export function getCoreCalendar(calendarId: string): CalendarRecord {
  if (calendarId === isoCalendarId) {
    return getIsoCalendar()
  }
  if (calendarId === gregoryCalendarId) {
    return getGregoryCalendar()
  }
  throw new RangeError(
    errorMessages.exoticCalendarRequired(
      calendarId,
      'getIntlCalendar or getAnyCalendar',
    ),
  )
}

export function getAnyCalendar(calendarId: string): CalendarRecord {
  if (calendarId === isoCalendarId) {
    return getIsoCalendar()
  }
  if (calendarId === gregoryCalendarId) {
    return getGregoryCalendar()
  }
  return getIntlCalendar(calendarId)
}
