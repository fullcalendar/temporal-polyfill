export declare const CalendarRecordBrand: unique symbol
export declare const PlainDateRecordBrand: unique symbol

// for brand, why not void instead of undefined?

export type CalendarRecord = {
  readonly [CalendarRecordBrand]: undefined
  toJSON(): string
  valueOf(): never
}

export type PlainDateRecord = {
  readonly [PlainDateRecordBrand]: undefined
  readonly calendarId: string
  readonly era: string | undefined
  readonly eraYear: number | undefined
  readonly year: number
  readonly month: number
  readonly monthCode: string
  readonly day: number
  toJSON(): string
  valueOf(): never
}
