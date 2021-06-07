import { mstoIsoDate } from './convert'
import { Calendar } from './calendar'
import { PlainDateTime } from './plainDateTime'
import { CalendarId, TimeZoneId, UNIT_INCREMENT } from './types'
import { asDate, toUnitMs } from './utils'

export class TimeZone {
  constructor(readonly id: TimeZoneId = 'local') {}

  getOffsetMillisecondsFor(epochMilliseconds: number): number {
    if (this.id === 'local') {
      const utcDate = asDate(epochMilliseconds)
      const localDate = asDate({
        isoYear: utcDate.getUTCFullYear(),
        isoMonth: utcDate.getUTCMonth(),
        isoDay: utcDate.getUTCDate(),
        isoHour: utcDate.getUTCHours(),
        isoMinute: utcDate.getUTCMinutes(),
        isoSecond: utcDate.getUTCSeconds(),
        isoMillisecond: utcDate.getUTCMilliseconds(),
      })
      // Native date returns value with flipped sign :(
      return (
        -localDate.getTimezoneOffset() *
        UNIT_INCREMENT.MINUTE *
        UNIT_INCREMENT.SECOND
      )
    } else if (this.id === 'utc') {
      return 0
    }
    throw new Error('Unimplemented')
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
    calendar: Calendar | CalendarId
  ): PlainDateTime {
    const {
      isoYear,
      isoMonth,
      isoDay,
      isoHour,
      isoMinute,
      isoSecond,
      isoMillisecond,
    } = mstoIsoDate(
      epochMilliseconds - this.getOffsetMillisecondsFor(epochMilliseconds)
    )
    return new PlainDateTime(
      isoYear,
      isoMonth + 1,
      isoDay,
      isoHour,
      isoMinute,
      isoSecond,
      isoMillisecond,
      calendar
    )
  }
}
