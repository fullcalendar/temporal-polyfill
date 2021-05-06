import { Calendar, DateMarker, ExpandedDateMarker } from './types'

// FIXME: This tuple type doesn't work for most use cases
export type CreateMarkerArray = [
  year: number,
  month?: number,
  monthDay?: number,
  hours?: number,
  minutes?: number,
  seconds?: number,
  milliseconds?: number
]

type CreateMarkerInput = ExpandedDateMarker | CreateMarkerArray

/**
 * Returns the number of milliseconds between 00:00:00 January 1, 1970 and the specified date.
 * @param {CreateMarkerInput} input The expanded Date
 * @param {Calendar=} calendar The calendar used to represent the input
 *
 * @returns A DateMarker representation of the date entered into the input field using the specified calendar
 */
export const createMarker: (
  input: CreateMarkerInput,
  // TODO: Add calendar functionality
  calendar?: Calendar
) => DateMarker = (input) => {
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
