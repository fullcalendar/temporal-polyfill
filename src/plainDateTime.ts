import { balanceFromMs, balanceTime, balanceTimeFromMs } from './balance'
import { Calendar } from './calendar'
import { Duration, DurationLikeType } from './duration'
import { asRoundOptions, roundModeMap, roundMs, roundPriorities } from './round'
import { separateDateTime, separateDuration } from './separate'
import {
  CalendarType,
  CompareReturnType,
  AssignmentOptionsType,
  DurationUnitType,
  LocaleType,
  RoundOptionsLikeType,
  RoundOptionsType,
  TimeZoneType,
  UNIT_INCREMENT,
} from './types'
import { asDate } from './utils'
import { ZonedDateTime } from './zonedDateTime'

export type PlainDateTimeLikeType = {
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
      const regex = /^([1-9]\d{3})-(0[1-9]|1[0-2])-([0-2]\d)(?:T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:[.:](\d{3}))?)?(?:\[u-ca=(\w+)\])?$/
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
          calendar,
        ] = matches.slice(1).reduce(
          (acc, val, index) => {
            if (index === 7) {
              acc[index] = val
            } else {
              acc[index] = Number(val)
            }
            return acc
          },
          [0, 0, 0, 0, 0, 0, 0, '']
        )
        return new PlainDateTime(
          year,
          month,
          day,
          hour,
          minute,
          second,
          millisecond,
          calendar as CalendarType
        )
      }
      throw new Error('Invalid String')
    } else if (typeof thing === 'number') {
      const date = new Date(thing)
      return new PlainDateTime(
        date.getUTCFullYear(),
        date.getUTCMonth() + 1,
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds(),
        date.getUTCMilliseconds()
      )
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

  add(
    amount: Duration | DurationLikeType | string,
    options?: AssignmentOptionsType
  ): PlainDateTime {
    const duration = amount instanceof Duration ? amount : Duration.from(amount)
    const [macro, ms] = separateDuration(duration)

    const constrained = balanceFromMs(this.epochMilliseconds + ms)

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
      isoMonth + 1,
      isoDay,
      constrained.isoHour,
      constrained.isoMinute,
      constrained.isoSecond,
      constrained.isoMillisecond,
      this.calendar
    )
  }
  subtract(
    amount: Duration | DurationLikeType | string,
    options?: AssignmentOptionsType
  ): PlainDateTime {
    const duration = amount instanceof Duration ? amount : Duration.from(amount)
    return this.add(duration.negated(), options)
  }
  since(other: PlainDateTime, options?: RoundOptionsLikeType): Duration {
    const positiveSign = this.epochMilliseconds >= other.epochMilliseconds
    const larger = positiveSign ? this : other
    const smaller = positiveSign ? other : this

    const [smallerDate, smallerMs] = separateDateTime(smaller)
    const [largerDate, largerMs] = separateDateTime(larger, smallerMs)

    const { isoHour, isoMinute, isoSecond, isoMillisecond } = balanceTimeFromMs(
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
  round(options?: RoundOptionsLikeType): PlainDateTime {
    const {
      smallestUnit,
      largestUnit,
      roundingMode,
    }: RoundOptionsType = asRoundOptions(options)

    const smallestIndex = roundPriorities.indexOf(smallestUnit)
    const largestIndex = roundPriorities.indexOf(largestUnit)

    const arr: Array<{
      value: number
      field: DurationUnitType
      increment: number
    }> = [
      {
        value: this.millisecond,
        field: 'milliseconds',
        increment: UNIT_INCREMENT.MILLISECOND,
      },
      {
        value: this.second,
        field: 'seconds',
        increment: UNIT_INCREMENT.SECOND,
      },
      {
        value: this.minute,
        field: 'minutes',
        increment: UNIT_INCREMENT.MINUTE,
      },
      { value: this.hour, field: 'hours', increment: UNIT_INCREMENT.HOUR },
      { value: this.day, field: 'days', increment: UNIT_INCREMENT.DAY },
      {
        value: this.month,
        field: 'months',
        increment: UNIT_INCREMENT.MONTH * UNIT_INCREMENT.WEEK,
      },
      { value: this.year, field: 'years', increment: UNIT_INCREMENT.YEAR },
    ]

    const [
      milliseconds,
      seconds,
      minutes,
      hours,
      days,
      months,
      years,
    ] = arr.reduce(
      (acc, { value, field, increment }, idx) => {
        const roundIndex = roundPriorities.indexOf(field)

        // Round Smallest
        if (smallestIndex < roundIndex) {
          acc[idx] = 0
          // TODO: Implement usage of roundingIncrement
          acc[idx + 1] += roundModeMap[roundingMode](value / increment)
        }
        // Round Largest
        else if (largestIndex > roundIndex) {
          acc[idx] = 0
          acc[idx - 1] += value * arr[idx - 1].increment
        } else {
          acc[idx] += value
        }
        return acc
      },
      [0, 0, 0, 0, 0, 0, 0]
    )

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
