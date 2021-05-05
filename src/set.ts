import { Calendar, DateMarker } from './types'

export const setYear = (
  marker: DateMarker,
  year: number,
  // TODO: Add calendar functionality
  _calendar?: Calendar
) => {
  const utcDate = new Date(marker)
  utcDate.setUTCFullYear(year)
  return utcDate.valueOf()
}

export const setMonth = (
  marker: DateMarker,
  month: number,
  // TODO: Add calendar functionality
  _calendar?: Calendar
) => {
  const utcDate = new Date(marker)
  utcDate.setUTCMonth(month - 1)
  return utcDate.valueOf()
}

export const setMonthDay = (
  marker: DateMarker,
  monthDay: number,
  // TODO: Add calendar functionality
  _calendar?: Calendar
) => {
  const utcDate = new Date(marker)
  utcDate.setUTCDate(monthDay)
  return utcDate.valueOf()
}

export const setHours = (marker: DateMarker, hours: number) => {
  const utcDate = new Date(marker)
  utcDate.setUTCHours(hours)
  return utcDate.valueOf()
}

export const setMinutes = (marker: DateMarker, minutes: number) => {
  const utcDate = new Date(marker)
  utcDate.setUTCMinutes(minutes)
  return utcDate.valueOf()
}

export const setSeconds = (marker: DateMarker, seconds: number) => {
  const utcDate = new Date(marker)
  utcDate.setUTCSeconds(seconds)
  return utcDate.valueOf()
}

export const setMilliseconds = (marker: DateMarker, milliseconds: number) => {
  const utcDate = new Date(marker)
  utcDate.setUTCMilliseconds(milliseconds)
  return utcDate.valueOf()
}
