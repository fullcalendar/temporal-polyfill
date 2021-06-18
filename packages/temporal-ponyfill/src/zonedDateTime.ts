import { msToIsoDate } from './convert'
import { Calendar, CalendarId } from './calendar'
import { dateFormat } from './format'
import { parseDate } from './parse'
import { TimeZone, TimeZoneId } from './timeZone'
import { CompareReturn, LocaleId } from './utils'

type ZonedDateTimeLike = {
  epochMilliseconds?: number
  timeZone?: TimeZone | TimeZoneId
  calendar?: Calendar | CalendarId
}

export class ZonedDateTime {
  readonly timeZone: TimeZone
  readonly calendar: Calendar

  constructor(
    readonly epochMilliseconds: number,
    timeZone: TimeZone | TimeZoneId = new TimeZone(),
    calendar: Calendar | CalendarId = new Calendar()
  ) {
    this.timeZone =
      timeZone instanceof TimeZone ? timeZone : new TimeZone(timeZone)

    this.calendar =
      calendar instanceof Calendar ? calendar : new Calendar(calendar)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  static from(thing: any): ZonedDateTime {
    if (typeof thing === 'string') {
      const { epochMilliseconds, timeZone, calendar } = parseDate(thing)
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

  static compare(one: ZonedDateTime, two: ZonedDateTime): CompareReturn {
    if (one.epochMilliseconds < two.epochMilliseconds) {
      return -1
    } else if (one.epochMilliseconds > two.epochMilliseconds) {
      return 1
    } else {
      return 0
    }
  }

  private offsetIso() {
    return msToIsoDate(
      this.epochMilliseconds +
        this.timeZone.getOffsetMillisecondsFor(this.epochMilliseconds)
    )
  }

  get year(): number {
    return this.calendar.year(this.offsetIso())
  }

  get month(): number {
    return this.calendar.month(this.offsetIso())
  }

  get day(): number {
    return this.calendar.day(this.offsetIso())
  }

  get hour(): number {
    return this.offsetIso().isoHour
  }

  get minute(): number {
    return this.offsetIso().isoMinute
  }

  get second(): number {
    return this.offsetIso().isoSecond
  }

  get millisecond(): number {
    return this.offsetIso().isoMillisecond
  }

  get dayOfWeek(): number {
    return this.calendar.dayOfWeek(this.offsetIso())
  }

  get weekOfYear(): number {
    return this.calendar.weekOfYear(this.offsetIso())
  }

  with(dateTimeLike: ZonedDateTimeLike | string): ZonedDateTime {
    if (typeof dateTimeLike === 'string') {
      throw new Error('Unimplemented')
    }
    return new ZonedDateTime(
      dateTimeLike.epochMilliseconds || this.epochMilliseconds,
      dateTimeLike.timeZone || this.timeZone,
      dateTimeLike.calendar || this.calendar
    )
  }

  withTimeZone(timeZone: TimeZone | TimeZoneId): ZonedDateTime {
    return this.with({ timeZone })
  }

  withCalendar(calendar: Calendar | CalendarId): ZonedDateTime {
    return this.with({ calendar })
  }

  toString(): string {
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

  toLocaleString(
    locale: LocaleId,
    options?: Intl.DateTimeFormatOptions
  ): string {
    return new Intl.DateTimeFormat(locale, options).format(
      this.epochMilliseconds
    )
  }
}
