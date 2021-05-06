import createMarker from './create'
import { getTimeZoneOffsetForTimestamp } from './get'
import { DateMarker, TimeZone } from './types'

export const parseTimestamp = (
  timestamp: number,
  timeZone?: TimeZone
): DateMarker => {
  return (
    timestamp + getTimeZoneOffsetForTimestamp(timestamp, timeZone) * 60 * 1000
  )
}

export const parseNow = (timeZone?: TimeZone): DateMarker =>
  parseTimestamp(Date.now(), timeZone)

export const parseNative = (dateObj: Date, timeZone?: TimeZone): DateMarker =>
  parseTimestamp(dateObj.valueOf(), timeZone)

export const parseISO = (
  isoString: string,
  timeZone?: TimeZone
): DateMarker => {
  const regex = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})(?:T(?<hour>\d{2}):(?<minute>\d{2}):(?<second>\d{2}).(?<millisecond>\d{3})Z)?/
  const match = isoString.match(regex)

  if (match === null || match.length < 8) throw new Error('Invalid ISO String')

  return createMarker(match.slice(1, 8).map((val) => parseInt(val)))
}
