import { Calendar } from './calendar'
import { PlainDateTime } from './plainDateTime'
import { TimeZone } from './timezone'
import { CalendarType, TimeZoneType } from './types'
import { ZonedDateTime } from './zonedDateTime'

export class Now {
  static instant() {
    return Date.now()
  }
  static epochMilliseconds() {
    return this.instant()
  }

  static timeZone() {
    return new TimeZone(
      Intl.DateTimeFormat().resolvedOptions().timeZone as TimeZoneType
    )
  }

  static zonedDateTime(calendar?: CalendarType | Calendar) {
    return new ZonedDateTime(this.instant(), undefined, calendar)
  }

  static zonedDateTimeISO() {
    return this.zonedDateTime(new Calendar())
  }

  static plainDateTime(calendar?: CalendarType | Calendar) {
    const date = new Date(this.instant())
    return new PlainDateTime(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds(),
      calendar
    )
  }

  static plainDateTimeISO() {
    return this.plainDateTime(new Calendar())
  }
}
