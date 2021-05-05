import { Calendar, DateMarker, TimeZone } from 'src/types'

// TODO: Add calendar functionality
export const getYear = (marker: DateMarker, _calendar?: Calendar) =>
  new Date(marker).getUTCFullYear()

// TODO: Add calendar functionality
export const getMonth = (marker: DateMarker, _calendar?: Calendar) =>
  new Date(marker).getUTCMonth() + 1

// TODO: Add calendar functionality
export const getMonthDay = (marker: DateMarker, _calendar?: Calendar) =>
  new Date(marker).getUTCDate()
// TODO: I am of the opinion this would be more appropriate
export const getDay = getMonthDay

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

export const getTimeZoneOffset = (marker: DateMarker, timeZone: TimeZone) => {
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
  } else if (timeZone.toLowerCase() === 'utc') return 0

  // TODO: Implement for other strings
  throw new Error('Unimplemented')
}

export const getTimeZoneOffsetForTimestamp = (
  timestamp: string,
  timeZone: TimeZone
) => {
  if (timeZone.toLowerCase() === 'local') {
    const localDate = new Date(timestamp)
    // Native date returns value with flipped sign :(
    return -localDate.getTimezoneOffset()
  } else if (timeZone.toLowerCase() === 'utc') return 0

  // TODO: Implement for other strings
  throw new Error('Unimplemented')
}
