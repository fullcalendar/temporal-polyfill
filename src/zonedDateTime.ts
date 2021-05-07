import { Calendar } from './calendar'
import { TimeZone } from './timezone'
import { LocaleType } from './types'

export class ZonedDateTime {
  constructor() {}

  static from() {}

  static compare(a: ZonedDateTime, b: ZonedDateTime) {}

  year() {}
  month() {}
  day() {}
  hour() {}
  minute() {}
  second() {}
  millisecond() {}
  epochMilliseconds() {}
  calendar() {}
  timeZone() {}
  dayOfWeek() {}
  weekOfYear() {}

  with() {}
  withTimeZone(timeZone: TimeZone | string) {}
  withCalendar(calendar: Calendar | string) {}

  toString() {}
  toLocaleString(locale: LocaleType, options: unknown) {}
}
