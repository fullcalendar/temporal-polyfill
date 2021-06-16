import { msToIsoDate } from './convert'
import { Calendar, CalendarId } from './calendar'
import { PlainDateTime } from './plainDateTime'
import {
  dateValue,
  Instant,
  MS_FOR,
  reduceFormat,
  unitIncrement,
} from './utils'
import { padZeros } from './format'

export type TimeZoneId = 'utc' | 'local' | string

const localOffset = (ms?: number): number => {
  // Native date returns value with flipped sign :(
  return -new Date(ms).getTimezoneOffset() * MS_FOR.MINUTE
}

export class TimeZone {
  private formatter: Intl.DateTimeFormat

  constructor(readonly id: TimeZoneId = 'local') {
    // Creating formatter in constructor is same as caching it for our purposes
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
      return localOffset(
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
    } else if (this.id === 'utc') {
      return 0
    }
    // Arbitrary timezone using Intl API
    const formatResult = reduceFormat(
      epochMilliseconds,
      this.formatter
    ) as Record<string, number>

    // Convert to epochMs
    const adjusted = dateValue({
      isoYear: formatResult.year,
      isoMonth: formatResult.month,
      isoDay: formatResult.day,
      isoHour: formatResult.hour,
      isoMinute: formatResult.minute,
      isoSecond: formatResult.second,
    })

    // Account for overflow milliseconds
    const over = epochMilliseconds % MS_FOR.SECOND
    return adjusted - epochMilliseconds + over
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
    // Leverage overflow handling in from function
    return PlainDateTime.from({
      epochMilliseconds:
        epochMilliseconds - this.getOffsetMillisecondsFor(epochMilliseconds),
      calendar,
    })
  }

  getInstantFor(
    date: PlainDateTime,
    options?: {
      disambiguation: 'compatible' | 'earlier' | 'later' | 'reject'
    }
  ): Instant {
    const { disambiguation } = { disambiguation: 'compatible', ...options }

    let utcMs = date.epochMilliseconds
    // Get offset of timezone
    const tzOffset = this.getOffsetMillisecondsFor(utcMs)

    // Check if we can just return UTC
    if (tzOffset === 0) {
      return date.epochMilliseconds
    }

    // Move epochMs by timeZone offset and check if offset is different at that point in time (e.g DST)
    utcMs -= tzOffset
    const tzOffset2 = this.getOffsetMillisecondsFor(utcMs)

    // If the offset is same we guessed correctly
    if (tzOffset === tzOffset2) {
      return utcMs + tzOffset
    }

    // Otherwise we are in a hole time
    return date.epochMilliseconds + Math.min(tzOffset, tzOffset2)
  }
}
