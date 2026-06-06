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

export const getISO: () => Record = NativeTemporal ? Native.getISO : Shim.getISO

export const getGregory: () => Record = NativeTemporal
  ? Native.getGregory
  : Shim.getGregory

export const getExotic: (calendarId: string) => Record = NativeTemporal
  ? Native.getExotic
  : Shim.getExotic

export function getBasic(calendarId: string): Record {
  if (calendarId === isoCalendarId) {
    return getISO()
  }
  if (calendarId === gregoryCalendarId) {
    return getGregory()
  }
  throw new RangeError(
    errorMessages.exoticCalendarRequired(calendarId, 'getExotic or getAny'),
  )
}

export function getAny(calendarId: string): Record {
  if (calendarId === isoCalendarId) {
    return getISO()
  }
  if (calendarId === gregoryCalendarId) {
    return getGregory()
  }
  return getExotic(calendarId)
}
