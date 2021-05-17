import { Calendar } from './calendar'
import { CalendarType, LocaleType, TimeZoneType } from './types'
import { ZonedDateTime } from './zonedDateTime'

export class PlainDateTime {
  readonly epochMilliseconds
  readonly calendar

  constructor(
    isoYear: number,
    isoMonth: number,
    isoDay: number,
    isoHour: number = 0,
    isoMinute: number = 0,
    isoSecond: number = 0,
    isoMillisecond: number = 0,
    calendar: Calendar | CalendarType = new Calendar()
  ) {
    const temp = new Date(
      isoYear,
      isoMonth - 1,
      isoDay,
      isoHour,
      isoMinute,
      isoSecond,
      isoMillisecond
    )
    temp.setMinutes(temp.getMinutes() - temp.getTimezoneOffset())
    this.epochMilliseconds = temp.valueOf()

    this.calendar =
      typeof calendar === 'string' ? new Calendar(calendar) : calendar
  }

  private asDate() {
    return new Date(this.epochMilliseconds)
  }

  static from() {}

  static compare(one: PlainDateTime, two: PlainDateTime) {}

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
    return this.asDate().getUTCHours()
  }
  get minute() {
    return this.asDate().getUTCMinutes()
  }
  get second() {
    return this.asDate().getUTCSeconds()
  }
  get millisecond() {
    return this.asDate().getUTCMilliseconds()
  }
  get dayOfWeek() {
    return this.calendar.dayOfWeek(this)
  }
  get weekOfYear() {
    return this.calendar.weekOfYear(this)
  }

  with() {}
  withCalendar(calendar: Calendar | CalendarType) {
    const date = this.asDate()
    return new PlainDateTime(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds(),
      calendar
    )
  }
  add() {}
  subtract() {}
  since() {}
  round() {}

  toString() {
    const { year, month, day, hour, minute, second, millisecond } = this
    const yearStr = `000${year}`.slice(-4)
    const monthStr = `0${month}`.slice(-2)
    const dayStr = `0${day}`.slice(-2)
    const hourStr = `0${hour}`.slice(-2)
    const minStr = `0${minute}`.slice(-2)
    const secStr = `0${second}`.slice(-2)
    const msStr = `00${millisecond}`.slice(-3)
    return `${yearStr}-${monthStr}-${dayStr}T${hourStr}:${minStr}:${secStr}.${msStr}`
  }
  toLocaleString(locale: LocaleType, options?: Intl.DateTimeFormatOptions) {
    return Intl.DateTimeFormat(locale, options).format(this.epochMilliseconds)
  }
  toZonedDateTime(timeZone: TimeZoneType) {
    return new ZonedDateTime(this.epochMilliseconds, timeZone)
  }
}
