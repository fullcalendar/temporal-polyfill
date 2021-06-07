import { mstoIsoDate, toIsoTime } from './convert'
import { Calendar } from './calendar'
import { Duration } from './duration'
import { dateFormat } from './format'
import { dateParse } from './parse'
import { roundMs } from './round'
import { separateDateTime, separateDuration } from './separate'
import {
  CalendarId,
  CompareReturn,
  AssignmentOptions,
  LocaleId,
  RoundOptionsLike,
  TimeZoneId,
  PlainDateTimeLike,
  DurationLike,
} from './types'
import { asDate, dateValue } from './utils'
import { ZonedDateTime } from './zonedDateTime'

export class PlainDateTime {
  readonly epochMilliseconds
  readonly calendar

  constructor(
    isoYear: number,
    isoMonth: number,
    isoDay: number,
    isoHour = 0,
    isoMinute = 0,
    isoSecond = 0,
    isoMillisecond = 0,
    calendar: Calendar | CalendarId = new Calendar()
  ) {
    this.epochMilliseconds = dateValue({
      isoYear,
      isoMonth,
      isoDay,
      isoHour,
      isoMinute,
      isoSecond,
      isoMillisecond,
    })

    this.calendar =
      typeof calendar === 'string' ? new Calendar(calendar) : calendar
  }

  static from(thing: any): PlainDateTime {
    if (typeof thing === 'string') {
      const { epochMilliseconds, calendar } = dateParse(thing)
      const {
        isoYear,
        isoMonth,
        isoDay,
        isoHour,
        isoMinute,
        isoSecond,
        isoMillisecond,
      } = mstoIsoDate(epochMilliseconds)
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
    } else if (typeof thing === 'number') {
      const {
        isoYear,
        isoMonth,
        isoDay,
        isoHour,
        isoMinute,
        isoSecond,
        isoMillisecond,
      } = mstoIsoDate(thing)
      return new PlainDateTime(
        isoYear,
        isoMonth,
        isoDay,
        isoHour,
        isoMinute,
        isoSecond,
        isoMillisecond
      )
    } else if (thing.epochMilliseconds) {
      const {
        isoYear,
        isoMonth,
        isoDay,
        isoHour,
        isoMinute,
        isoSecond,
        isoMillisecond,
      } = mstoIsoDate(thing)
      return new PlainDateTime(
        isoYear,
        isoMonth,
        isoDay,
        isoHour,
        isoMinute,
        isoSecond,
        isoMillisecond,
        thing.calendar
      )
    } else if (thing.isoYear && thing.isoMonth && thing.isoDay) {
      return new PlainDateTime(
        thing.isoYear,
        thing.isoMonth,
        thing.isoDay,
        thing.isoHour,
        thing.isoMinute,
        thing.isoSecond,
        thing.isoMillisecond,
        thing.calendar
      )
    }
    throw new Error('Invalid Object')
  }

  static compare(one: PlainDateTime, two: PlainDateTime): CompareReturn {
    if (one.epochMilliseconds < two.epochMilliseconds) {
      return -1
    } else if (one.epochMilliseconds > two.epochMilliseconds) {
      return 1
    } else {
      return 0
    }
  }

  get year(): number {
    return this.calendar.year(mstoIsoDate(this.epochMilliseconds))
  }
  get month(): number {
    return this.calendar.month(mstoIsoDate(this.epochMilliseconds))
  }
  get day(): number {
    return this.calendar.day(mstoIsoDate(this.epochMilliseconds))
  }
  get hour(): number {
    return mstoIsoDate(this.epochMilliseconds).isoHour
  }
  get minute(): number {
    return mstoIsoDate(this.epochMilliseconds).isoMinute
  }
  get second(): number {
    return mstoIsoDate(this.epochMilliseconds).isoSecond
  }
  get millisecond(): number {
    return mstoIsoDate(this.epochMilliseconds).isoMillisecond
  }
  get dayOfWeek(): string {
    return this.calendar.dayOfWeek(mstoIsoDate(this.epochMilliseconds))
  }
  get weekOfYear(): number {
    return this.calendar.weekOfYear(mstoIsoDate(this.epochMilliseconds))
  }

  with(dateTimeLike: PlainDateTimeLike | string): PlainDateTime {
    if (typeof dateTimeLike === 'string') {
      throw new Error('Unimplemented')
    }
    return new PlainDateTime(
      dateTimeLike.isoYear || this.year,
      dateTimeLike.isoMonth || this.month,
      dateTimeLike.isoDay || this.day,
      dateTimeLike.isoHour || this.hour,
      dateTimeLike.isoMinute || this.minute,
      dateTimeLike.isoSecond || this.second,
      dateTimeLike.isoMillisecond || this.millisecond,
      dateTimeLike.calendar || this.calendar
    )
  }
  withCalendar(calendar: Calendar | CalendarId): PlainDateTime {
    const date = asDate(this.epochMilliseconds)
    return new PlainDateTime(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds(),
      calendar
    )
  }

  add(
    amount: Duration | DurationLike | string,
    options?: AssignmentOptions
  ): PlainDateTime {
    const duration = amount instanceof Duration ? amount : Duration.from(amount)
    const [macro, ms] = separateDuration(duration)

    const constrained = mstoIsoDate(this.epochMilliseconds + ms)

    const { isoYear, isoMonth, isoDay } = this.calendar.dateAdd(
      {
        isoYear: constrained.isoYear,
        isoMonth: constrained.isoMonth,
        isoDay: constrained.isoDay,
      },
      macro,
      options
    )

    return new PlainDateTime(
      isoYear,
      isoMonth,
      isoDay,
      constrained.isoHour,
      constrained.isoMinute,
      constrained.isoSecond,
      constrained.isoMillisecond,
      this.calendar
    )
  }
  subtract(
    amount: Duration | DurationLike | string,
    options?: AssignmentOptions
  ): PlainDateTime {
    const duration = amount instanceof Duration ? amount : Duration.from(amount)
    return this.add(duration.negated(), options)
  }
  since(other: PlainDateTime, options?: RoundOptionsLike): Duration {
    const positiveSign = this.epochMilliseconds >= other.epochMilliseconds
    const larger = positiveSign ? this : other
    const smaller = positiveSign ? other : this

    const [smallerDate, smallerMs] = separateDateTime(smaller)
    const [largerDate, largerMs] = separateDateTime(larger, smallerMs)

    const { isoHour, isoMinute, isoSecond, isoMillisecond } = toIsoTime(
      roundMs(largerMs - smallerMs, options),
      options
    )
    const combined = this.calendar
      .dateUntil(smallerDate, largerDate, options)
      .with({
        hours: isoHour,
        minutes: isoMinute,
        seconds: isoSecond,
        milliseconds: isoMillisecond,
      })
    return positiveSign ? combined : combined.negated()
  }
  round(options?: RoundOptionsLike): PlainDateTime {
    const [date, ms] = separateDateTime(this)
    const {
      deltaDays,
      isoHour,
      isoMinute,
      isoSecond,
      isoMillisecond,
    } = toIsoTime(roundMs(ms, options), options)
    return new PlainDateTime(
      date.isoYear,
      date.isoMonth,
      date.isoDay + deltaDays,
      isoHour,
      isoMinute,
      isoSecond,
      isoMillisecond
    )
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
    } = this
    return dateFormat({
      isoYear,
      isoMonth,
      isoDay,
      isoHour,
      isoMinute,
      isoSecond,
      isoMillisecond,
    })
  }
  toLocaleString(
    locale: LocaleId,
    options?: Intl.DateTimeFormatOptions
  ): string {
    return new Intl.DateTimeFormat(locale, options).format(
      this.epochMilliseconds
    )
  }
  toZonedDateTime(timeZone: TimeZoneId): ZonedDateTime {
    return new ZonedDateTime(this.epochMilliseconds, timeZone)
  }
}
