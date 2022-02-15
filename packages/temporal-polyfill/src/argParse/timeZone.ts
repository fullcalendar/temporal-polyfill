import { ensureObj } from '../dateUtils/abstract'
import { TimeZone } from '../public/timeZone'
import { TimeZoneProtocol } from '../public/types'

export type TimeZoneArgSimple = TimeZoneProtocol | string
export type TimeZoneArgBag = { timeZone: TimeZoneArgSimple }

export function isTimeZoneArgBag(arg: any): arg is TimeZoneArgBag {
  return arg.timeZone // boolean-ish
}

// bag ITEM
// weird
export function parseTimeZoneFromBag(arg: TimeZoneArgSimple): TimeZone {
  if (typeof arg === 'object') {
    if (typeof arg.id === 'string') {
      return arg as TimeZone // custom implementation
    } else {
      throw new RangeError('Invalid timeZone')
    }
  }
  return new TimeZone(String(arg))
}

export function extractTimeZone(input: TimeZoneArgBag): TimeZone {
  if (input.timeZone === undefined) {
    throw new TypeError('Must specify timeZone')
  }
  return ensureObj(TimeZone, input.timeZone)
}
