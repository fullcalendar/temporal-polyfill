import { msToIsoDate } from './convert'
import { Calendar, CalendarId } from './calendar'
import { PlainDate, PlainDateTime } from './plainDateTime'
import { dateValue, MS_FOR, reduceFormat, unitIncrement } from './utils'
import { padZeros } from './format'

export type TimeZoneId = 'utc' | 'local' | string

const removeOffset = (ms: number): number => {
  return ms - new Date(ms).getTimezoneOffset()
}

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
      return -localDate.getTimezoneOffset() * MS_FOR.MINUTE
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
    const mins = Math.abs((offset / MS_FOR.MINUTE) % unitIncrement.minutes)
    const hours = Math.abs(offset / MS_FOR.HOUR)

    const minStr = padZeros(mins, 2)
    const hourStr = padZeros(hours, 2)

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

  getInstantFor(
    date: PlainDate,
    options?: {
      disambiguation: 'compatible' | 'earlier' | 'later' | 'reject'
    }
  ): number {
    const { disambiguation } = { disambiguation: 'compatible', ...options }
    const utcMs = removeOffset(dateValue(date))
    const timeZoneOffset = this.getOffsetMillisecondsFor(utcMs)
    return utcMs + timeZoneOffset
  }
}
