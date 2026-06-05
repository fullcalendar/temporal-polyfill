import * as errorMessages from '../internal/errorMessages'
import {
  gregoryCalendarId,
  isoCalendarId,
} from '../internal/intlCalendarConfig'
import { NativeTemporal } from '../nativeSwitch'
import * as Native from './native/calendar'
import type { CalendarRecord as Record } from './recordTypes'
import * as Shim from './shim/calendar'

export type { Record }

export const getIsoCalendar: () => Record = NativeTemporal
  ? Native.getIsoCalendar
  : Shim.getIsoCalendar

export const getGregoryCalendar: () => Record = NativeTemporal
  ? Native.getGregoryCalendar
  : Shim.getGregoryCalendar

export const getExoticCalendar: (calendarId: string) => Record = NativeTemporal
  ? Native.getExoticCalendar
  : Shim.getExoticCalendar

export function getCoreCalendar(calendarId: string): Record {
  if (calendarId === isoCalendarId) {
    return getIsoCalendar()
  }
  if (calendarId === gregoryCalendarId) {
    return getGregoryCalendar()
  }
  throw new RangeError(
    errorMessages.exoticCalendarRequired(
      calendarId,
      'getExoticCalendar or getAnyCalendar',
    ),
  )
}

export function getAnyCalendar(calendarId: string): Record {
  if (calendarId === isoCalendarId) {
    return getIsoCalendar()
  }
  if (calendarId === gregoryCalendarId) {
    return getGregoryCalendar()
  }
  return getExoticCalendar(calendarId)
}
