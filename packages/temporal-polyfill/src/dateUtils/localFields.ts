// local essentials
// special note about not doing spreads

export interface LocalYearFields {
  year: number;
}

export interface LocalYearMonthFields extends LocalYearFields {
  month: number;
}

export interface LocalDateFields extends LocalYearMonthFields {
  day: number;
}

export interface LocalMonthDayFields {
  monthCode: string;
  day: number;
}

export interface LocalTimeFields {
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
  microsecond: number;
  nanosecond: number;
}

export type LocalDateTimeFields = LocalDateFields & LocalTimeFields
