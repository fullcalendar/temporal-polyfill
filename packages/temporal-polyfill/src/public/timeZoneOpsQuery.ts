import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { SimpleTimeZoneOps, TimeZoneOps } from '../internal/timeZoneOps'
import { createAdapterOps, simpleTimeZoneAdapters } from './timeZoneAdapter'
import { TimeZoneSlot } from './timeZoneSlot'

export function createTimeZoneOps(
  timeZoneSlot: TimeZoneSlot,
  adapterFuncs?: any
): TimeZoneOps {
  if (typeof timeZoneSlot === 'string') {
    return queryNativeTimeZone(timeZoneSlot)
  }
  return createAdapterOps(timeZoneSlot, adapterFuncs) as any
}

export function createSimpleTimeZoneOps(timeZoneSlot: TimeZoneSlot): SimpleTimeZoneOps {
  return createTimeZoneOps(timeZoneSlot, simpleTimeZoneAdapters as any)
}
