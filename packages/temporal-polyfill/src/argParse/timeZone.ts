import { ensureObj } from '../dateUtils/abstract'
import { TimeZone } from '../public/timeZone'
import { TimeZoneProtocol } from '../public/types'

export type TimeZoneArgSimple = TimeZoneProtocol | string
export type TimeZoneArgBag = { timeZone: TimeZoneArgSimple }

export function isTimeZoneArgBag(arg: any): arg is TimeZoneArgBag {
  return arg.timeZone // boolean-ish
}

export function extractTimeZone(input: TimeZoneArgBag): TimeZone {
  if (input.timeZone == null) {
    throw new Error('Must specify timeZone')
  }
  return ensureObj(TimeZone, input.timeZone)
}
