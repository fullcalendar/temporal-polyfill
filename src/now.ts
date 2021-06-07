import { mstoIsoDate } from './convert'
import { Calendar } from './calendar'
import { PlainDateTime } from './plainDateTime'
import { TimeZone } from './timeZone'
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
    return this.zonedDateTime()
  }

  static plainDateTime(calendar?: CalendarType | Calendar) {
    const {
      isoYear,
      isoMonth,
      isoDay,
      isoHour,
      isoMinute,
      isoSecond,
      isoMillisecond,
    } = mstoIsoDate(this.instant())
    return new PlainDateTime(
      isoYear,
      isoMonth + 1,
      isoDay,
      isoHour,
      isoMinute,
      isoSecond,
      isoMillisecond,
      calendar
    )
  }

  static plainDateTimeISO() {
    return this.plainDateTime()
  }
}
