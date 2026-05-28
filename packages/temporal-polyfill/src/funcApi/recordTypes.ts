export declare const CalendarRecordBrand: unique symbol
export declare const PlainDateRecordBrand: unique symbol

export type CalendarRecord = {
  readonly [CalendarRecordBrand]: undefined
}

export type PlainDateRecord = {
  readonly [PlainDateRecordBrand]: undefined
}
