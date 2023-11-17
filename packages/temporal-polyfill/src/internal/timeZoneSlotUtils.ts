import { ensureString } from './cast'
import { parseMaybeOffsetNano, parseTimeZoneId } from './isoParse'
import { getSlots } from './slots'
import { isObjectlike } from './utils'

// public
import { createProtocolChecker } from '../public/publicUtils'
import { TimeZoneArg, TimeZoneProtocol } from '../public/timeZone'

export type TimeZoneSlot = TimeZoneProtocol | string

export const utcTimeZoneId = 'UTC'

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

export function refineTimeZoneSlotString(arg: string): string {
  return parseTimeZoneId(ensureString(arg))
}

export function getCommonTimeZoneSlot(a: TimeZoneSlot, b: TimeZoneSlot): TimeZoneSlot {
  if (!isTimeZoneSlotsEqual(a, b, true)) { // loose=true
    throw new RangeError(`TimeZones not equal`)
  }
  return a
}

export function isTimeZoneSlotsEqual(a: TimeZoneSlot, b: TimeZoneSlot, loose?: boolean): boolean {
  return a === b || getTimeZoneSlotRaw(a, loose) === getTimeZoneSlotRaw(b, loose)
}

/*
TODO: pre-parse offset somehow? not very performant
*/
function getTimeZoneSlotRaw(slot: TimeZoneSlot, loose?: boolean): string | number {
  const id = getTimeZoneSlotId(slot)

  if (loose && id === 'UTC') {
    return 0
  }

  const offsetNano = parseMaybeOffsetNano(id)
  if (offsetNano !== undefined) {
    return offsetNano
  }

  return id
}

export function getTimeZoneSlotId(slot: TimeZoneSlot): string {
  return typeof slot === 'string' ? slot : ensureString(slot.id)
}
