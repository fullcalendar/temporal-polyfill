// A number that compactly expresses a timezoneless year-month-day-hour-minute-second-ms
export type DateMarker = number

export type ExpandedDateMarker = {
  year: number
  month?: number
  monthDay?: number
  hours?: number
  minutes?: number
  seconds?: number
  milliseconds?: number
}

export type Duration = {
  years: number
  months: number
  days: number
  hours: number
  minutes: number
  seconds: number
  milliseconds: number
}

export type LooseDuration = Partial<Duration>

export type Locale = string

export type TimeZone = 'local' | 'utc'

export type Calendar = string
