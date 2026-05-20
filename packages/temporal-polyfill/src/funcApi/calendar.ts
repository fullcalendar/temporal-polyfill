import * as Native from './native/calendar'
import { Temporal } from './nativeSwitch'
import * as Shim from './shim/calendar'

export const getIsoCalendar = Temporal
  ? Native.getIsoCalendar
  : Shim.getIsoCalendar
export const getGregoryCalendar = Temporal
  ? Native.getGregoryCalendar
  : Shim.getGregoryCalendar
export const getIntlCalendar = Temporal
  ? Native.getIntlCalendar
  : Shim.getIntlCalendar
