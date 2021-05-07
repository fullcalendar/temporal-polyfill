import {
  getMonth,
  getMonthDay,
  getHours,
  getTimeZoneOffset,
  getYear,
  getMinutes,
  getMilliseconds,
} from './get'
import { DateMarker, FormatStrOptions, TimeZone } from './types'

export const formatTimestamp = (marker: DateMarker, timeZone?: TimeZone) => {
  return marker - getTimeZoneOffset(marker, timeZone) * 60 * 1000
}

export const formatNative = (marker: DateMarker, timeZone?: TimeZone) =>
  new Date(formatTimestamp(marker, timeZone))

export const formatISOMonth = (marker: DateMarker) =>
  `${getYear(marker)}-${getMonth(marker)}`

export const formatISODate = (marker: DateMarker) =>
  `${formatISOMonth(marker)}-${getMonthDay(marker)}`

export const formatISODateTime = (marker: DateMarker) =>
  `${formatISODate(marker)}T${getHours(marker)}:${getMinutes(
    marker
  )}:${getMilliseconds(marker)}`

export const formatISO = (marker: DateMarker, timeZone?: TimeZone) => {
  const offset = getTimeZoneOffset(marker, timeZone)
  return `${formatISODateTime(marker)}-${offset / 60}:${offset % 60}`
}

export const formatStr = (
  marker: DateMarker,
  tokens: string,
  options?: FormatStrOptions
) => {
  // FIXME: Incomplete Function
  const year = String(getYear(marker))
  const month = String(getMonth(marker) + 1)
  const day = String(getMonthDay(marker))
  const formats = {
    YY: year.slice(-2),
    YYYY: year,
    M: month,
    MM: month.length == 2 ? month : '0' + month,
  }

  return tokens
}
