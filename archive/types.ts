/** A number that compactly expresses a timezoneless year-month-day-hour-minute-second-ms */
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

export type FormatStrOptions = {
  /** A timezone, like 'America/New_York' */
  timeZone?: TimeZone
  /** One or more locale codes */
  locale?: Locale | Locale[]
  /** Like 'January' */
  months?: string[]
  /** Like 'Jan' */
  monthsShort?: string[]
  /** Like 'J' */
  monthsNarrow?: string[]
  /** Like 'Saturday' */
  weekdays?: string[]
  /** Like 'Sat' */
  weekdaysShort?: string[]
  /** Like 'S' */
  weekdaysNarrow?: string[]
  /** For ranges, see formatRangeStr */
  separator?: string
}
