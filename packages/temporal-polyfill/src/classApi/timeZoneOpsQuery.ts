import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { TimeZoneOffsetOps, TimeZoneOps } from '../internal/timeZoneOps'
import { TimeZoneSlot } from './slotClass'
import { createAdapterOps, simpleTimeZoneAdapters } from './timeZoneAdapter'

export function createTimeZoneOps(
  timeZoneSlot: TimeZoneSlot,
  adapterFuncs?: any,
): TimeZoneOps {
  if (typeof timeZoneSlot === 'string') {
    return queryNativeTimeZone(timeZoneSlot)
  }
  return createAdapterOps(timeZoneSlot, adapterFuncs) as any
}

export function createTimeZoneOffsetOps(
  timeZoneSlot: TimeZoneSlot,
): TimeZoneOffsetOps {
  return createTimeZoneOps(timeZoneSlot, simpleTimeZoneAdapters as any)
}
