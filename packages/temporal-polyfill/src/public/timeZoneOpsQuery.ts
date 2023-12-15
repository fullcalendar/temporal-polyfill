import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { SimpleTimeZoneOps, TimeZoneOps } from '../internal/timeZoneOps'
import { createAdapterOps, simpleTimeZoneAdapters, timeZoneAdapters } from './timeZoneAdapter'
import { TimeZoneSlot } from './timeZoneSlot'

export function createTimeZoneOps(
  timeZoneSlot: TimeZoneSlot,
  adapterFuncs = timeZoneAdapters
): TimeZoneOps {
  if (typeof timeZoneSlot === 'string') {
    return queryNativeTimeZone(timeZoneSlot)
  }
  return createAdapterOps(timeZoneSlot, adapterFuncs)
}

export function createSimpleTimeZoneOps(timeZoneSlot: TimeZoneSlot): SimpleTimeZoneOps {
  return createTimeZoneOps(timeZoneSlot, simpleTimeZoneAdapters as any)
}
