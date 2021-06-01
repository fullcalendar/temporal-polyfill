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
    return this.zonedDateTime()
  }

  static plainDateTime(calendar?: CalendarType | Calendar) {
    return PlainDateTime.from({ epochMilliseconds: this.instant(), calendar })
  }

  static plainDateTimeISO() {
    return this.plainDateTime()
  }
}
