import { Calendar, DateMarker } from 'src/types'

type CreateMarkerInput =
  | {
      year: number
      month?: number
      day?: number
      hour?: number
      minute?: number
      second?: number
      millisecond?: number
    }
  // FIXME: This array type doesn't work for most use cases
  | [
      number, // year
      number?, // month
      number?, // day
      number?, // hour
      number?, // minute
      number?, // second
      number? // millisecond
    ]

export const createMarker: (
  input?: CreateMarkerInput,
  // TODO: Add calendar functionality
  calendar?: Calendar
) => DateMarker = (input) => {
  if (!input) return Date.now()

  if (Array.isArray(input)) {
    const [year, month, day, hour, minute, second, millisecond] = input
    return Date.UTC(
      year,
      (month || 1) - 1,
      day || 1,
      hour || 0,
      minute || 0,
      second || 0,
      millisecond || 0
    )
  }

  const { year, month, day, hour, minute, second, millisecond } = input
  return Date.UTC(
    year,
    (month || 1) - 1,
    day || 1,
    hour || 0,
    minute || 0,
    second || 0,
    millisecond || 0
  )
}

export default createMarker
