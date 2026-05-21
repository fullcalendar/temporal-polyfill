import { NativeTemporal } from '../nativeSwitch'
import * as Native from './native/now'
import * as Shim from './shim/now'

export const timeZoneId = NativeTemporal ? Native.timeZoneId : Shim.timeZoneId
export const instant = NativeTemporal ? Native.instant : Shim.instant
export const zonedDateTimeISO = NativeTemporal
  ? Native.zonedDateTimeISO
  : Shim.zonedDateTimeISO
export const plainDateTimeISO = NativeTemporal
  ? Native.plainDateTimeISO
  : Shim.plainDateTimeISO
export const plainDateISO = NativeTemporal
  ? Native.plainDateISO
  : Shim.plainDateISO
export const plainTimeISO = NativeTemporal
  ? Native.plainTimeISO
  : Shim.plainTimeISO
