import * as errorMessages from '../internal/errorMessages'
import {
  gregoryCalendarId,
  isoCalendarId,
} from '../internal/intlCalendarConfig'
import { NativeTemporal } from '../nativeSwitch'
import * as Native from './native/calendar'
import * as Shim from './shim/calendar'

export const getIsoCalendar = NativeTemporal
  ? Native.getIsoCalendar
  : Shim.getIsoCalendar

export const getGregoryCalendar = NativeTemporal
  ? Native.getGregoryCalendar
  : Shim.getGregoryCalendar

export const getIntlCalendar = NativeTemporal
  ? Native.getIntlCalendar
  : Shim.getIntlCalendar

export function getCoreCalendar(calendarId: string) {
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

export function getAnyCalendar(calendarId: string) {
  if (calendarId === isoCalendarId) {
    return getIsoCalendar()
  }
  if (calendarId === gregoryCalendarId) {
    return getGregoryCalendar()
  }
  return getIntlCalendar(calendarId)
}
