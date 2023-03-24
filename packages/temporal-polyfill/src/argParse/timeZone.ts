import { Temporal } from 'temporal-spec'
import { ensureObj } from '../dateUtils/abstract'
import { TimeZone } from '../public/timeZone'

export function extractTimeZone(input: any): Temporal.TimeZoneProtocol {
  if (input.timeZone === undefined) {
    throw new TypeError('Must specify timeZone')
  }
  return ensureObj(TimeZone, input.timeZone)
}
