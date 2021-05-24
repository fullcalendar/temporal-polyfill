import { Calendar } from './calendar'
import { Duration, DurationLikeType } from './duration'
import {
  CalendarType,
  CompareReturnType,
  DurationUnitType,
  LocaleType,
  RoundLikeType,
  RoundType,
  TimeZoneType,
  UNIT_INCREMENT,
} from './types'
import { asDate, roundDefaults, roundModeMap, roundPriorities } from './utils'
import { ZonedDateTime } from './zonedDateTime'

type PlainDateTimeLikeType = {
  isoYear?: number
  isoMonth?: number
  isoDay?: number
  isoHour?: number
  isoMinute?: number
  isoSecond?: number
  isoMillisecond?: number
  calendar?: Calendar | CalendarType
}
export class PlainDateTime {
  readonly epochMilliseconds
  readonly calendar

  constructor(
    isoYear: number,
    isoMonth: number,
    isoDay: number,
    isoHour: number = 0,
    isoMinute: number = 0,
    isoSecond: number = 0,
    isoMillisecond: number = 0,
    calendar: Calendar | CalendarType = new Calendar()
  ) {
    this.epochMilliseconds = Date.UTC(
      isoYear,
      isoMonth - 1,
      isoDay,
      isoHour,
      isoMinute,
      isoSecond,
      isoMillisecond
    )

    this.calendar =
      typeof calendar === 'string' ? new Calendar(calendar) : calendar
  }

  static from(thing: any): PlainDateTime {
    if (typeof thing === 'string') {
      const regex = /^([1-9]\d{3})-(0[1-9]|1[0-2])-([0-2]\d)(?:T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:[.:](\d{3}))?)?$/
      const matches = thing.match(regex)
      if (matches) {
        const [
          year,
          month,
          day,
          hour,
          minute,
          second,
          millisecond,
        ] = matches.slice(1).map((val) => Number(val))
        return new PlainDateTime(
          year,
          month,
          day,
          hour,
          minute,
          second,
          millisecond
        )
      }
      throw new Error('Invalid String')
    } else if (thing.epochMilliseconds) {
      const date = new Date(thing.epochMilliseconds)
      return new PlainDateTime(
        date.getUTCFullYear(),
        date.getUTCMonth() + 1,
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds(),
        date.getUTCMilliseconds(),
        thing.calendar
      )
    } else if (thing.isoYear && thing.isoMonth && thing.isoDay)
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
    throw new Error('Invalid Object')
  }

  static compare(one: PlainDateTime, two: PlainDateTime): CompareReturnType {
    if (one.epochMilliseconds < two.epochMilliseconds) return -1
    else if (one.epochMilliseconds > two.epochMilliseconds) return 1
    else return 0
  }

  get year() {
    return this.calendar.year(this)
  }
  get month() {
    return this.calendar.month(this)
  }
  get day() {
    return this.calendar.day(this)
  }
  get hour() {
    return asDate(this.epochMilliseconds).getUTCHours()
  }
  get minute() {
    return asDate(this.epochMilliseconds).getUTCMinutes()
  }
  get second() {
    return asDate(this.epochMilliseconds).getUTCSeconds()
  }
  get millisecond() {
    return asDate(this.epochMilliseconds).getUTCMilliseconds()
  }
  get dayOfWeek() {
    return this.calendar.dayOfWeek(this)
  }
  get weekOfYear() {
    return this.calendar.weekOfYear(this)
  }

  with(dateTimeLike: PlainDateTimeLikeType | string): PlainDateTime {
    if (typeof dateTimeLike === 'string') throw new Error('Unimplemented')
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
  withCalendar(calendar: Calendar | CalendarType): PlainDateTime {
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

  add(amount: Duration | DurationLikeType | string): PlainDateTime {
    const {
      years,
      months,
      weeks,
      days,
      hours,
      minutes,
      seconds,
      milliseconds,
    } = amount instanceof Duration ? amount : Duration.from(amount)
    return new PlainDateTime(
      this.year + years,
      this.month + months,
      this.day + days + weeks * 7,
      this.hour + hours,
      this.minute + minutes,
      this.second + seconds,
      this.millisecond + milliseconds
    )
  }
  subtract(amount: Duration | DurationLikeType | string): PlainDateTime {
    const {
      years,
      months,
      weeks,
      days,
      hours,
      minutes,
      seconds,
      milliseconds,
    } = amount instanceof Duration ? amount : Duration.from(amount)
    return new PlainDateTime(
      this.year - years,
      this.month - months,
      this.day - days - weeks * 7,
      this.hour - hours,
      this.minute - minutes,
      this.second - seconds,
      this.millisecond - milliseconds
    )
  }
  since(other: PlainDateTime, options?: RoundLikeType): Duration {
    return Duration.from(
      this.epochMilliseconds - other.epochMilliseconds
    ).round(options)
  }
  round(options?: RoundLikeType): PlainDateTime {
    const { smallestUnit, largestUnit, roundingMode }: RoundType = {
      ...roundDefaults,
      ...options,
    }
    const roundingMethod = roundModeMap[roundingMode]

    const smallestIndex = roundPriorities.indexOf(smallestUnit)
    const largestIndex = roundPriorities.indexOf(largestUnit)
    let [years, months, days, hours, minutes, seconds, milliseconds] = [
      this.year,
      this.month,
      this.day,
      this.hour,
      this.minute,
      this.second,
      this.millisecond,
    ]

    // Round Time

    // Balance???

    return new PlainDateTime(
      years,
      months,
      days,
      hours,
      minutes,
      seconds,
      milliseconds
    )
  }

  toString(): string {
    const { year, month, day, hour, minute, second, millisecond } = this
    const yearStr = `000${year}`.slice(-4)
    const monthStr = `0${month}`.slice(-2)
    const dayStr = `0${day}`.slice(-2)
    const hourStr = `0${hour}`.slice(-2)
    const minStr = `0${minute}`.slice(-2)
    const secStr = `0${second}`.slice(-2)
    const msStr = `00${millisecond}`.slice(-3)
    return `${yearStr}-${monthStr}-${dayStr}T${hourStr}:${minStr}:${secStr}.${msStr}`
  }
  toLocaleString(
    locale: LocaleType,
    options?: Intl.DateTimeFormatOptions
  ): string {
    return Intl.DateTimeFormat(locale, options).format(this.epochMilliseconds)
  }
  toZonedDateTime(timeZone: TimeZoneType): ZonedDateTime {
    return new ZonedDateTime(this.epochMilliseconds, timeZone)
  }
}
