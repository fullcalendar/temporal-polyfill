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

export const getIso: () => Record = NativeTemporal ? Native.getIso : Shim.getIso

export const getGregory: () => Record = NativeTemporal
  ? Native.getGregory
  : Shim.getGregory

export const getExotic: (calendarId: string) => Record = NativeTemporal
  ? Native.getExotic
  : Shim.getExotic

export function getBasic(calendarId: string): Record {
  if (calendarId === isoCalendarId) {
    return getIso()
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
    return getIso()
  }
  if (calendarId === gregoryCalendarId) {
    return getGregory()
  }
  return getExotic(calendarId)
}
