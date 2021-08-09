import { isoDateToMs, msToIsoDate, msToIsoTime } from './utils/convert'
import { Calendar, CalendarId } from './calendar'
import { Duration, DurationLike } from './duration'
import { dateFormat } from './utils/format'
import { parseDate } from './utils/parse'
import { roundMs, RoundOptionsLike } from './utils/round'
import { separateDateTime, separateDuration } from './utils/separate'
import { AssignmentOptions, CompareReturn, LocaleId } from './utils/types'
import { ZonedDateTime } from './zonedDateTime'
import { TimeZoneId } from './timeZone'
import { PlainDate, PlainDateFields } from './plainDate'
import { PlainTimeFields } from './plainTime'

export type PlainDateTimeFields = PlainDateFields &
  PlainTimeFields & { calendar?: Calendar | CalendarId }
export type PlainDateTimeLike = Partial<PlainDateTimeFields>

export class PlainDateTime {
  readonly epochMilliseconds: number
  readonly calendar: Calendar

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
    // TODO Move overflow to from method, only accept valid values in constructor
    this.epochMilliseconds = isoDateToMs({
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  static from(thing: any): PlainDateTime {
    if (typeof thing === 'string') {
      const { epochMilliseconds, calendar } = parseDate(thing)
      const {
        isoYear,
        isoMonth,
        isoDay,
        isoHour,
        isoMinute,
        isoSecond,
        isoMillisecond,
      } = msToIsoDate(epochMilliseconds)
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
      } = msToIsoDate(thing)
      return new PlainDateTime(
        isoYear,
        isoMonth,
        isoDay,
        isoHour,
        isoMinute,
        isoSecond,
        isoMillisecond
      )
    } else if (typeof thing.epochMilliseconds === 'number') {
      const {
        isoYear,
        isoMonth,
        isoDay,
        isoHour,
        isoMinute,
        isoSecond,
        isoMillisecond,
      } = msToIsoDate(thing.epochMilliseconds)
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
    const diff = one.epochMilliseconds - two.epochMilliseconds
    return diff !== 0 ? (diff < 0 ? -1 : 1) : 0
  }

  get year(): number {
    const { isoYear, isoMonth, isoDay } = msToIsoDate(this.epochMilliseconds)
    return this.calendar.year(new PlainDate(isoYear, isoMonth, isoDay))
  }

  get month(): number {
    const { isoYear, isoMonth, isoDay } = msToIsoDate(this.epochMilliseconds)
    return this.calendar.month(new PlainDate(isoYear, isoMonth, isoDay))
  }

  get day(): number {
    const { isoYear, isoMonth, isoDay } = msToIsoDate(this.epochMilliseconds)
    return this.calendar.day(new PlainDate(isoYear, isoMonth, isoDay))
  }

  get hour(): number {
    return msToIsoDate(this.epochMilliseconds).isoHour
  }

  get minute(): number {
    return msToIsoDate(this.epochMilliseconds).isoMinute
  }

  get second(): number {
    return msToIsoDate(this.epochMilliseconds).isoSecond
  }

  get millisecond(): number {
    return msToIsoDate(this.epochMilliseconds).isoMillisecond
  }

  get dayOfWeek(): number {
    const { isoYear, isoMonth, isoDay } = msToIsoDate(this.epochMilliseconds)
    return this.calendar.dayOfWeek(new PlainDate(isoYear, isoMonth, isoDay))
  }

  get weekOfYear(): number {
    const { isoYear, isoMonth, isoDay } = msToIsoDate(this.epochMilliseconds)
    return this.calendar.weekOfYear(new PlainDate(isoYear, isoMonth, isoDay))
  }

  with(dateTimeLike: PlainDateTimeLike | string): PlainDateTime {
    if (typeof dateTimeLike === 'string') {
      // TODO Implement this
      throw new Error('Unimplemented')
    }
    const {
      isoYear,
      isoMonth,
      isoDay,
      isoHour,
      isoMinute,
      isoSecond,
      isoMillisecond,
      calendar,
    } = dateTimeLike
    return new PlainDateTime(
      isoYear ?? this.year,
      isoMonth ?? this.month,
      isoDay ?? this.day,
      isoHour ?? this.hour,
      isoMinute ?? this.minute,
      isoSecond ?? this.second,
      isoMillisecond ?? this.millisecond,
      calendar ?? this.calendar
    )
  }

  withCalendar(calendar: Calendar | CalendarId): PlainDateTime {
    const {
      isoYear,
      isoMonth,
      isoDay,
      isoHour,
      isoMinute,
      isoSecond,
      isoMillisecond,
    } = msToIsoDate(this.epochMilliseconds)
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

  add(
    amount: Duration | DurationLike | string,
    options?: AssignmentOptions
  ): PlainDateTime {
    const duration = amount instanceof Duration ? amount : Duration.from(amount)
    const [macro, ms] = separateDuration(duration)

    // Add time increment into epochMilliseconds and format back into ISO Date
    const constrained = msToIsoDate(this.epochMilliseconds + ms)

    const { isoYear, isoMonth, isoDay } = this.calendar.dateAdd(
      new PlainDate(
        constrained.isoYear,
        constrained.isoMonth,
        constrained.isoDay
      ),
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
    // Defer to add function with a negative duration
    return this.add(duration.negated(), options)
  }

  since(other: PlainDateTime, options?: RoundOptionsLike): Duration {
    const positiveSign = this.epochMilliseconds >= other.epochMilliseconds
    const larger = positiveSign ? this : other
    const smaller = positiveSign ? other : this

    // Separate into [date, time]
    const [smallerDate, smallerMs] = separateDateTime(smaller)
    const [largerDate, largerMs] = separateDateTime(larger, smallerMs)

    // Round time portion and convert to ISO with overflow accounted for
    const { isoHour, isoMinute, isoSecond, isoMillisecond } = msToIsoTime(
      roundMs(largerMs - smallerMs, options),
      options
    )

    // Calculate date using Calendar function, attach time afterwards
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
    const { deltaDays, isoHour, isoMinute, isoSecond, isoMillisecond } =
      msToIsoTime(roundMs(ms, options), options)
    return new PlainDateTime(
      date.isoYear,
      date.isoMonth,
      // Might cause overflow, but that overflow is dealt with by PlainDateTime's constructor
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
