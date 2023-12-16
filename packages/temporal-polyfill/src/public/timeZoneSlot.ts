import { isObjectlike } from '../internal/utils'
import { refineTimeZoneSlotString } from '../genericApi/timeZoneSlotString'
import { getSlots } from './slotsForClasses'
import { TimeZoneArg } from './timeZone'
import { TimeZoneProtocol, checkTimeZoneProtocol } from './timeZoneProtocol'

export type TimeZoneSlot = TimeZoneProtocol | string

export function refineTimeZoneSlot(arg: TimeZoneArg): TimeZoneSlot {
  if (isObjectlike(arg)) {
    const { timeZone } = (getSlots(arg) || {}) as { timeZone?: TimeZoneSlot }

    if (timeZone) {
      return timeZone // TimeZoneOps
    }

    checkTimeZoneProtocol(arg as TimeZoneProtocol)
    return arg as TimeZoneProtocol
  }
  return refineTimeZoneSlotString(arg)
}
