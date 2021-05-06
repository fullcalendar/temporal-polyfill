import { getTimeZoneOffsetForTimestamp } from './get'
import { DateMarker, TimeZone } from './types'

export const parseTimestamp = (
  timestamp: number,
  timeZone?: TimeZone
): DateMarker => {
  return timestamp - getTimeZoneOffsetForTimestamp(timestamp, timeZone)
}

export const parseNow = (timeZone?: TimeZone): DateMarker =>
  parseTimestamp(Date.now(), timeZone)

export const parseNative = (dateObj: Date, timeZone?: TimeZone): DateMarker =>
  parseTimestamp(dateObj.valueOf(), timeZone)

export const parseISO = (isoString: string, timeZone?: TimeZone): DateMarker =>
  parseTimestamp(Date.parse(isoString), timeZone)
