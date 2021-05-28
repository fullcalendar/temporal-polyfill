import { Calendar } from './calendar'
import { TimeZone } from './timezone'
import {
  CalendarType,
  CompareReturnType,
  LocaleType,
  TimeZoneType,
} from './types'
import { asDate, toUnitMs } from './utils'

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
      const regex = /^([1-9]\d{3})-(0[1-9]|1[0-2])-([0-2]\d)(?:T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:[.:](\d{3}))?)?(?:(Z|[+-][01]\d:[0-5]\d))?(?:\[(\w+\/\w+)\])?(?:\[u-ca=(\w+)\])?$/
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
          offset,
          timezone,
          calendar,
        ] = matches.slice(1).reduce(
          (acc, val, index) => {
            if (index === 7) {
              // TimeZone Offset
              const offsetRegex = /([+-])(\d{2}):(\d{2})/
              const offsetMatches = val.match(offsetRegex)
              if (offsetMatches) {
                const [plusminus, hrs, mins] = offsetMatches.slice(1)
                acc[index] =
                  (plusminus ? 1 : -1) *
                  (Number(hrs) * toUnitMs('hours') +
                    Number(mins) * toUnitMs('minutes'))
              }
              acc[index] = 0
            } else if (index === 8 || index === 9) {
              // Timezone and Calendar
              acc[index] = val
            } else {
              acc[index] = Number(val)
            }
            return acc
          },
          [0, 0, 0, 0, 0, 0, 0, 0, '', '']
        )
        const epochMilliseconds =
          Date.UTC(
            year,
            month - 1,
            day,
            hour,
            minute,
            second,
            millisecond || 0
          ) + offset
        return new ZonedDateTime(
          epochMilliseconds,
          timezone,
          calendar as CalendarType
        )
      }
      throw new Error('Invalid String')
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
    return this.calendar.year(this)
  }
  get month() {
    return this.calendar.month(this)
  }
  get day() {
    return this.calendar.day(this)
  }
  get hour() {
    const date = asDate(this.epochMilliseconds)
    return this.timeZone.id === 'utc' ? date.getUTCHours() : date.getHours()
  }
  get minute() {
    const date = asDate(this.epochMilliseconds)
    return this.timeZone.id === 'utc' ? date.getUTCMinutes() : date.getMinutes()
  }
  get second() {
    const date = asDate(this.epochMilliseconds)
    return this.timeZone.id === 'utc' ? date.getUTCSeconds() : date.getSeconds()
  }
  get millisecond() {
    const date = asDate(this.epochMilliseconds)
    return this.timeZone.id === 'utc'
      ? date.getUTCMilliseconds()
      : date.getMilliseconds()
  }
  get dayOfWeek() {
    return this.calendar.dayOfWeek(this)
  }
  get weekOfYear() {
    return this.calendar.weekOfYear(this)
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
    return new ZonedDateTime(this.epochMilliseconds, timeZone, this.calendar)
  }
  withCalendar(calendar: Calendar | CalendarType) {
    return new ZonedDateTime(this.epochMilliseconds, this.timeZone, calendar)
  }

  toString() {
    const {
      year,
      month,
      day,
      hour,
      minute,
      second,
      millisecond,
      timeZone,
      epochMilliseconds,
    } = this
    const yearStr = `000${year}`.slice(-4)
    const monthStr = `0${month}`.slice(-2)
    const dayStr = `0${day}`.slice(-2)
    const hourStr = `0${hour}`.slice(-2)
    const minStr = `0${minute}`.slice(-2)
    const secStr = `0${second}`.slice(-2)
    const msStr = `00${millisecond}`.slice(-3)
    return `${yearStr}-${monthStr}-${dayStr}T${hourStr}:${minStr}:${secStr}.${msStr}${timeZone.getOffsetStringFor(
      epochMilliseconds
    )}`
  }
  toLocaleString(locale: LocaleType, options?: Intl.DateTimeFormatOptions) {
    return Intl.DateTimeFormat(locale, options).format(this.epochMilliseconds)
  }
}
