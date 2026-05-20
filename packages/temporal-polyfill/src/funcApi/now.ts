import * as Native from './native/now'
import { Temporal } from './nativeSwitch'
import * as Shim from './shim/now'

export const timeZoneId = Temporal ? Native.timeZoneId : Shim.timeZoneId
export const instant = Temporal ? Native.instant : Shim.instant
export const zonedDateTimeISO = Temporal
  ? Native.zonedDateTimeISO
  : Shim.zonedDateTimeISO
export const plainDateTimeISO = Temporal
  ? Native.plainDateTimeISO
  : Shim.plainDateTimeISO
export const plainDateISO = Temporal ? Native.plainDateISO : Shim.plainDateISO
export const plainTimeISO = Temporal ? Native.plainTimeISO : Shim.plainTimeISO
