import { Calendar, DateMarker, ExpandedDateMarker, TimeZone } from './types'

// TODO: Add calendar functionality
export const getYear = (marker: DateMarker, _calendar?: Calendar) =>
  new Date(marker).getUTCFullYear()

// TODO: Add calendar functionality
export const getMonth = (marker: DateMarker, _calendar?: Calendar) =>
  new Date(marker).getUTCMonth()

// TODO: Add calendar functionality
export const getMonthDay = (marker: DateMarker, _calendar?: Calendar) =>
  new Date(marker).getUTCDate()

// TODO: Add calendar functionality
export const getHours = (marker: DateMarker, _calendar?: Calendar) =>
  new Date(marker).getUTCHours()

// TODO: Add calendar functionality
export const getMinutes = (marker: DateMarker, _calendar?: Calendar) =>
  new Date(marker).getUTCMinutes()

// TODO: Add calendar functionality
export const getSeconds = (marker: DateMarker, _calendar?: Calendar) =>
  new Date(marker).getUTCSeconds()

// TODO: Add calendar functionality
export const getMilliseconds = (marker: DateMarker, _calendar?: Calendar) =>
  new Date(marker).getUTCMilliseconds()

export const getTimeZoneOffset = (
  marker: DateMarker,
  timeZone: TimeZone = 'local'
) => {
  if (timeZone.toLowerCase() === 'local') {
    const utcDate = new Date(marker)
    const localDate = new Date(
      utcDate.getUTCFullYear(),
      utcDate.getUTCMonth(),
      utcDate.getUTCDate(),
      utcDate.getUTCHours(),
      utcDate.getUTCMinutes(),
      utcDate.getUTCSeconds(),
      utcDate.getUTCMilliseconds()
    )
    // Native date returns value with flipped sign :(
    return -localDate.getTimezoneOffset()
  }
  return 0
}

export const getTimeZoneOffsetForTimestamp = (
  timestamp: number,
  timeZone: TimeZone = 'local'
) => {
  if (timeZone.toLowerCase() === 'local') {
    // Native date returns value with flipped sign :(
    return -new Date(timestamp).getTimezoneOffset()
  }
  return 0
}
