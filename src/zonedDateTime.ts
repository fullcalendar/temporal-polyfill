import { balanceFromMs } from './balance'
import { Calendar } from './calendar'
import { dateFormat } from './format'
import { dateParse } from './parse'
import { TimeZone } from './timeZone'
import {
  CalendarType,
  CompareReturnType,
  LocaleType,
  TimeZoneType,
} from './types'
import { asDate } from './utils'

type ZonedDateTimeLikeType = {
  epochMilliseconds?: number
  timeZone?: TimeZone | TimeZoneType
  calendar?: Calendar | CalendarType
}

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

  static from(thing: any) {
    if (typeof thing === 'string') {
      const { epochMilliseconds, timeZone, calendar } = dateParse(thing)
      return new ZonedDateTime(epochMilliseconds, timeZone, calendar)
    } else if (thing.epochMilliseconds) {
      return new ZonedDateTime(
        thing.epochMilliseconds,
        thing.timeZone,
        thing.calendar
      )
    }
    throw new Error('Invalid Object')
  }

  static compare(one: ZonedDateTime, two: ZonedDateTime): CompareReturnType {
    if (one.epochMilliseconds < two.epochMilliseconds) return -1
    else if (one.epochMilliseconds > two.epochMilliseconds) return 1
    else return 0
  }

  get year() {
    return this.calendar.year(balanceFromMs(this.epochMilliseconds))
  }
  get month() {
    return this.calendar.month(balanceFromMs(this.epochMilliseconds))
  }
  get day() {
    return this.calendar.day(balanceFromMs(this.epochMilliseconds))
  }
  get hour() {
    // FIXME: Needs to be reworked for arbitrary timezones
    const date = asDate(this.epochMilliseconds)
    return this.timeZone.id === 'utc' ? date.getUTCHours() : date.getHours()
  }
  get minute() {
    // FIXME: Needs to be reworked for arbitrary timezones
    const date = asDate(this.epochMilliseconds)
    return this.timeZone.id === 'utc' ? date.getUTCMinutes() : date.getMinutes()
  }
  get second() {
    // FIXME: Needs to be reworked for arbitrary timezones
    const date = asDate(this.epochMilliseconds)
    return this.timeZone.id === 'utc' ? date.getUTCSeconds() : date.getSeconds()
  }
  get millisecond() {
    // FIXME: Needs to be reworked for arbitrary timezones
    const date = asDate(this.epochMilliseconds)
    return this.timeZone.id === 'utc'
      ? date.getUTCMilliseconds()
      : date.getMilliseconds()
  }
  get dayOfWeek() {
    return this.calendar.dayOfWeek(balanceFromMs(this.epochMilliseconds))
  }
  get weekOfYear() {
    return this.calendar.weekOfYear(balanceFromMs(this.epochMilliseconds))
  }

  with(dateTimeLike: ZonedDateTimeLikeType | string) {
    if (typeof dateTimeLike === 'string') throw new Error('Unimplemented')
    return new ZonedDateTime(
      dateTimeLike.epochMilliseconds || this.epochMilliseconds,
      dateTimeLike.timeZone || this.timeZone,
      dateTimeLike.calendar || this.calendar
    )
  }
  withTimeZone(timeZone: TimeZone | TimeZoneType) {
    return this.with({ timeZone })
  }
  withCalendar(calendar: Calendar | CalendarType) {
    return this.with({ calendar })
  }

  toString() {
    const {
      year: isoYear,
      month: isoMonth,
      day: isoDay,
      hour: isoHour,
      minute: isoMinute,
      second: isoSecond,
      millisecond: isoMillisecond,
      epochMilliseconds,
      timeZone,
    } = this
    return dateFormat(
      {
        isoYear,
        isoMonth,
        isoDay,
        isoHour,
        isoMinute,
        isoSecond,
        isoMillisecond,
      },
      timeZone.getOffsetStringFor(epochMilliseconds)
    )
  }
  toLocaleString(locale: LocaleType, options?: Intl.DateTimeFormatOptions) {
    return new Intl.DateTimeFormat(locale, options).format(
      this.epochMilliseconds
    )
  }
}
