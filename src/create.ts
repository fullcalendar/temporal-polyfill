import { Calendar, DateMarker } from './types'

type CreateMarkerObject = {
  year: number
  month?: number
  monthDay?: number
  hours?: number
  minutes?: number
  seconds?: number
  milliseconds?: number
}
// FIXME: This array type doesn't work for most use cases
type CreateMarkerArray = [
  year: number,
  month?: number,
  monthDay?: number,
  hours?: number,
  minutes?: number,
  seconds?: number,
  milliseconds?: number
]
type CreateMarkerInput = CreateMarkerObject | CreateMarkerArray

export const createMarker: (
  input?: CreateMarkerInput,
  // TODO: Add calendar functionality
  calendar?: Calendar
) => DateMarker = (input) => {
  if (!input) return Date.now()

  if (Array.isArray(input)) {
    const [year, month, monthDay, hours, minutes, seconds, milliseconds] = input
    return Date.UTC(
      year,
      (month || 1) - 1,
      monthDay || 1,
      hours || 0,
      minutes || 0,
      seconds || 0,
      milliseconds || 0
    )
  }

  const { year, month, monthDay, hours, minutes, seconds, milliseconds } = input
  return Date.UTC(
    year,
    (month || 1) - 1,
    monthDay || 1,
    hours || 0,
    minutes || 0,
    seconds || 0,
    milliseconds || 0
  )
}

export default createMarker
