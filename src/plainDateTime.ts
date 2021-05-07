import { LocaleType, TimeZoneType } from './types'

export class PlainDateTime {
  constructor() {}

  static from() {}

  static compare(a: PlainDateTime, b: PlainDateTime) {}

  year() {}
  month() {}
  day() {}
  hour() {}
  minute() {}
  second() {}
  millisecond() {}
  calendar() {}
  dayOfWeek() {}
  weekOfYear() {}

  with() {}
  add() {}
  subtract() {}
  since() {}
  round() {}

  toString() {}
  toLocaleString(locale: LocaleType, options: unknown) {}
  toZonedDateTime(timeZone: TimeZoneType) {}
}
