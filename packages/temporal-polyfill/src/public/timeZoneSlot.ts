import { isObjectlike } from '../internal/utils'

// public
import { getSlots } from './slots'
import { createProtocolChecker } from './publicUtils'
import { TimeZoneArg, TimeZoneProtocol } from './timeZone'
import { refineTimeZoneSlotString } from '../internal/timeZoneSlotString'

export type TimeZoneSlot = TimeZoneProtocol | string

const checkTimeZoneProtocol = createProtocolChecker([
  'getPossibleInstantsFor',
  'getOffsetNanosecondsFor',
])

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
