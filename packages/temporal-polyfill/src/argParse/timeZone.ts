import { Temporal } from 'temporal-spec'
import { ensureObj } from '../dateUtils/abstract'
import { TimeZone } from '../public/timeZone'
import { isObjectLike } from './refine'

export function timeZoneFromObj(obj: any): Temporal.TimeZoneProtocol {
  const innerTimeZone = obj.timeZone
  if (innerTimeZone === undefined) {
    return obj
  }
  if (isObjectLike(innerTimeZone) && innerTimeZone.timeZone === undefined) {
    return innerTimeZone as any
  }
  return new TimeZone(innerTimeZone)
}

export function extractTimeZone(input: any): Temporal.TimeZoneProtocol {
  if (input.timeZone === undefined) {
    throw new TypeError('Must specify timeZone')
  }
  return ensureObj(TimeZone, input.timeZone)
}
