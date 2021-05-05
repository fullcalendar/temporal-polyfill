import { getTimeZoneOffsetForTimestamp } from './get'
import { TimeZone } from './types'

export const parseTimestamp = (timestamp: number, timeZone?: TimeZone) => {
  return timestamp + getTimeZoneOffsetForTimestamp(timestamp, timeZone ?? 'utc')
}

export const parseNow = (timeZone?: TimeZone) => {
  return parseTimestamp(Date.now(), timeZone)
}

export const parseNative = (dateObj: Date, timeZone?: TimeZone) => {
  return parseTimestamp(dateObj.valueOf(), timeZone)
}

export const parseISO = (isoString: string, timeZone?: TimeZone) => {
  return parseTimestamp(Date.parse(isoString), timeZone)
}
