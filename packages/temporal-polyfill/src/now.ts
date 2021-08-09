import { msToIsoDate } from './utils/convert'
import { Calendar, CalendarId } from './calendar'
import { PlainDateTime } from './plainDateTime'
import { TimeZone, TimeZoneId } from './timeZone'
import { ZonedDateTime } from './zonedDateTime'
import { Instant } from './utils/types'

export class Now {
  static instant(): Instant {
    return Date.now()
  }

  static epochMilliseconds(): Instant {
    return this.instant()
  }

  static timeZone(): TimeZone {
    return new TimeZone(
      Intl.DateTimeFormat().resolvedOptions().timeZone as TimeZoneId
    )
  }

  static zonedDateTime(calendar?: CalendarId | Calendar): ZonedDateTime {
    return new ZonedDateTime(this.instant(), undefined, calendar)
  }

  static zonedDateTimeISO(): ZonedDateTime {
    return this.zonedDateTime()
  }

  static plainDateTime(calendar?: CalendarId | Calendar): PlainDateTime {
    const {
      isoYear,
      isoMonth,
      isoDay,
      isoHour,
      isoMinute,
      isoSecond,
      isoMillisecond,
    } = msToIsoDate(this.instant())
    return new PlainDateTime(
      isoYear,
      isoMonth,
      isoDay,
      isoHour,
      isoMinute,
      isoSecond,
      isoMillisecond,
      calendar
    )
  }

  static plainDateTimeISO(): PlainDateTime {
    return this.plainDateTime()
  }
}
