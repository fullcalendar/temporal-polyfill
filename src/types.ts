export type DateMarker = number

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

export type TimeZone = 'local' | 'UTC' | string

export type Calendar = string
