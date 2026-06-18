export declare const CalendarRecordBrand: unique symbol
export declare const PlainDateRecordBrand: unique symbol
export declare const PlainDateTimeRecordBrand: unique symbol
export declare const PlainTimeRecordBrand: unique symbol
export declare const PlainYearMonthRecordBrand: unique symbol
export declare const PlainMonthDayRecordBrand: unique symbol
export declare const InstantRecordBrand: unique symbol
export declare const ZonedDateTimeRecordBrand: unique symbol
export declare const DurationRecordBrand: unique symbol

// for brand, why not void instead of undefined?

export type CalendarRecord = {
  readonly [CalendarRecordBrand]: undefined
  toJSON(): string
  valueOf(): string
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

export type PlainDateTimeRecord = {
  readonly [PlainDateTimeRecordBrand]: undefined
  readonly calendarId: string
  readonly era: string | undefined
  readonly eraYear: number | undefined
  readonly year: number
  readonly month: number
  readonly monthCode: string
  readonly day: number
  readonly hour: number
  readonly minute: number
  readonly second: number
  readonly millisecond: number
  readonly microsecond: number
  readonly nanosecond: number
  toJSON(): string
  valueOf(): never
}

export type PlainTimeRecord = {
  readonly [PlainTimeRecordBrand]: undefined
  readonly hour: number
  readonly minute: number
  readonly second: number
  readonly millisecond: number
  readonly microsecond: number
  readonly nanosecond: number
  toJSON(): string
  valueOf(): never
}

export type PlainYearMonthRecord = {
  readonly [PlainYearMonthRecordBrand]: undefined
  readonly calendarId: string
  readonly era: string | undefined
  readonly eraYear: number | undefined
  readonly year: number
  readonly month: number
  readonly monthCode: string
  toJSON(): string
  valueOf(): never
}

export type PlainMonthDayRecord = {
  readonly [PlainMonthDayRecordBrand]: undefined
  readonly calendarId: string
  readonly monthCode: string
  readonly day: number
  toJSON(): string
  valueOf(): never
}

export type InstantRecord = {
  readonly [InstantRecordBrand]: undefined
  readonly epochMilliseconds: number
  readonly epochNanoseconds: bigint
  toJSON(): string
  valueOf(): never
}

export type ZonedDateTimeRecord = {
  readonly [ZonedDateTimeRecordBrand]: undefined
  readonly calendarId: string
  readonly epochMilliseconds: number
  readonly epochNanoseconds: bigint
  readonly timeZoneId: string
  readonly era: string | undefined
  readonly eraYear: number | undefined
  readonly year: number
  readonly month: number
  readonly monthCode: string
  readonly day: number
  readonly hour: number
  readonly minute: number
  readonly second: number
  readonly millisecond: number
  readonly microsecond: number
  readonly nanosecond: number
  toJSON(): string
  valueOf(): never
}

export type DurationRecord = {
  readonly [DurationRecordBrand]: undefined
  readonly years: number
  readonly months: number
  readonly weeks: number
  readonly days: number
  readonly hours: number
  readonly minutes: number
  readonly seconds: number
  readonly milliseconds: number
  readonly microseconds: number
  readonly nanoseconds: number
  toJSON(): string
  valueOf(): never
}
