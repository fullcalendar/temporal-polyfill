import { Calendar } from './calendar'
import { CalendarType, LocaleType, TimeZoneType } from './types'

export class PlainDateTime {
  readonly calendar

  constructor(
    private isoYear: number,
    private isoMonth: number,
    private isoDay: number,
    private isoHour: number = 0,
    private isoMinute: number = 0,
    private isoSecond: number = 0,
    private isoMillisecond: number = 0,
    calendar: Calendar | CalendarType = new Calendar()
  ) {
    this.calendar =
      typeof calendar === 'string' ? new Calendar(calendar) : calendar
  }

  static from() {}

  static compare(a: PlainDateTime, b: PlainDateTime) {}

  get year() {
    return this.calendar.year(this)
  }
  get month() {
    return this.calendar.month(this)
  }
  get day() {
    return this.calendar.day(this)
  }
  get hour() {
    return this.isoHour
  }
  get minute() {
    return this.isoMinute
  }
  get second() {
    return this.isoSecond
  }
  get millisecond() {
    return this.isoMillisecond
  }
  get dayOfWeek() {
    return this.calendar.dayOfWeek(this)
  }
  get weekOfYear() {
    return this.calendar.weekOfYear(this)
  }

  with() {}
  add() {}
  subtract() {}
  since() {}
  round() {}

  toString() {}
  toLocaleString(locale: LocaleType, options: unknown) {}
  toZonedDateTime(timeZone: TimeZoneType) {}
}
