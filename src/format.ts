import {
  getMonth,
  getMonthDay,
  getHours,
  getTimeZoneOffset,
  getYear,
  getMinutes,
  getMilliseconds,
} from './get'
import { DateMarker, TimeZone } from './types'

export const formatTimestamp = (marker: DateMarker, timeZone?: TimeZone) =>
  marker + getTimeZoneOffset(marker, timeZone)

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
