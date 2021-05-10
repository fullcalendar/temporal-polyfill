import { Calendar } from './calendar'
import { TimeZone } from './timezone'
import { CalendarType, LocaleType, TimeZoneType } from './types'

export class ZonedDateTime {
  readonly timeZone: TimeZone
  readonly calendar: Calendar

  constructor(
    readonly epochMilliseconds: number,
    timeZone: TimeZone | TimeZoneType = new TimeZone(),
    calendar: Calendar | CalendarType = new Calendar()
  ) {
    this.timeZone =
      timeZone instanceof TimeZone ? timeZone : new TimeZone(timeZone)

    this.calendar =
      calendar instanceof Calendar ? calendar : new Calendar(calendar)
  }

  static from() {}

  static compare(a: ZonedDateTime, b: ZonedDateTime) {}

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
    return new Date(this.epochMilliseconds).getHours()
  }
  get minute() {
    return new Date(this.epochMilliseconds).getMinutes()
  }
  get second() {
    return new Date(this.epochMilliseconds).getSeconds()
  }
  get millisecond() {
    return new Date(this.epochMilliseconds).getMilliseconds()
  }
  get dayOfWeek() {
    return this.calendar.dayOfWeek(this)
  }
  get weekOfYear() {
    return this.calendar.weekOfYear(this)
  }

  with() {}
  withTimeZone(timeZone: TimeZone | string) {}
  withCalendar(calendar: Calendar | string) {}

  toString() {
    return `${this.year}-${this.month}-${this.day}T${this.hour}:${
      this.minute
    }:${this.second}.${this.millisecond}${this.timeZone.getOffsetStringFor(
      this.epochMilliseconds
    )}`
  }
  toLocaleString(locale: LocaleType, options: unknown) {}
}
