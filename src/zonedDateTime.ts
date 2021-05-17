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
  withTimeZone(timeZone: TimeZone | TimeZoneType) {
    return new ZonedDateTime(this.epochMilliseconds, timeZone, this.calendar)
  }
  withCalendar(calendar: Calendar | CalendarType) {
    return new ZonedDateTime(this.epochMilliseconds, this.timeZone, calendar)
  }

  toString() {
    const {
      year,
      month,
      day,
      hour,
      minute,
      second,
      millisecond,
      timeZone,
      epochMilliseconds,
    } = this
    const yearStr = `000${year}`.slice(-4)
    const monthStr = `0${month}`.slice(-2)
    const dayStr = `0${day}`.slice(-2)
    const hourStr = `0${hour}`.slice(-2)
    const minStr = `0${minute}`.slice(-2)
    const secStr = `0${second}`.slice(-2)
    const msStr = `00${millisecond}`.slice(-3)
    return `${yearStr}-${monthStr}-${dayStr}T${hourStr}:${minStr}:${secStr}.${msStr}${timeZone.getOffsetStringFor(
      epochMilliseconds
    )}`
  }
  toLocaleString(locale: LocaleType, options?: Intl.DateTimeFormatOptions) {
    return Intl.DateTimeFormat(locale, options).format(this.epochMilliseconds)
  }
}
