import { msToIsoDate } from './convert'
import { Calendar, CalendarId } from './calendar'
import { PlainDateTime } from './plainDateTime'
import { dateValue, reduceFormat, toUnitMs, UNIT_INCREMENT } from './utils'

export type TimeZoneId = 'utc' | 'local' | string

export class TimeZone {
  private formatter: Intl.DateTimeFormat

  constructor(readonly id: TimeZoneId = 'local') {
    this.formatter = new Intl.DateTimeFormat('en-us', {
      hour12: false,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZone: this.id === 'local' ? undefined : this.id,
      timeZoneName: 'short',
    })
  }

  getOffsetMillisecondsFor(epochMilliseconds: number): number {
    if (this.id === 'local') {
      const utcDate = new Date(epochMilliseconds)
      const localDate = new Date(
        dateValue({
          isoYear: utcDate.getUTCFullYear(),
          isoMonth: utcDate.getUTCMonth(),
          isoDay: utcDate.getUTCDate(),
          isoHour: utcDate.getUTCHours(),
          isoMinute: utcDate.getUTCMinutes(),
          isoSecond: utcDate.getUTCSeconds(),
          isoMillisecond: utcDate.getUTCMilliseconds(),
        })
      )
      // Native date returns value with flipped sign :(
      return -localDate.getTimezoneOffset() * toUnitMs('minutes')
    } else if (this.id === 'utc') {
      return 0
    }
    // Arbitrary timezone
    const formatResult = reduceFormat(
      epochMilliseconds,
      this.formatter
    ) as Record<string, number>
    const adjusted = dateValue({
      isoYear: formatResult.year,
      isoMonth: formatResult.month,
      isoDay: formatResult.day,
      isoHour: formatResult.hour,
      isoMinute: formatResult.minute,
      isoSecond: formatResult.second,
    })
    return adjusted - epochMilliseconds
  }
  getOffsetStringFor(epochMilliseconds: number): string {
    const offset = this.getOffsetMillisecondsFor(epochMilliseconds)

    const sign = offset < 0 ? '-' : '+'
    const mins = Math.abs(
      (offset / toUnitMs('minutes')) % UNIT_INCREMENT.MINUTE
    )
    const hours = Math.abs(offset / toUnitMs('hours'))

    const minStr = `0${mins}`.slice(-2)
    const hourStr = `0${hours}`.slice(-2)

    return `${sign}${hourStr}:${minStr}`
  }
  getPlainDateTimeFor(
    epochMilliseconds: number,
    calendar?: Calendar | CalendarId
  ): PlainDateTime {
    const {
      isoYear,
      isoMonth,
      isoDay,
      isoHour,
      isoMinute,
      isoSecond,
      isoMillisecond,
    } = msToIsoDate(
      epochMilliseconds - this.getOffsetMillisecondsFor(epochMilliseconds)
    )
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
}
