import { Calendar } from './calendar'
import { PlainDateTime } from './plainDateTime'
import { CalendarType, TimeZoneType } from './types'

export class TimeZone {
  constructor(readonly id: TimeZoneType = 'local') {}

  getOffsetMillisecondsFor(epochMilliseconds: number) {
    if (this.id === 'local') {
      const utcDate = new Date(epochMilliseconds)
      const localDate = new Date(
        utcDate.getUTCFullYear(),
        utcDate.getUTCMonth(),
        utcDate.getUTCDate(),
        utcDate.getUTCHours(),
        utcDate.getUTCMinutes(),
        utcDate.getUTCSeconds(),
        utcDate.getUTCMilliseconds()
      )
      // Native date returns value with flipped sign :(
      return -localDate.getTimezoneOffset() * 60 * 1000
    } else if (this.id === 'utc') {
      // Case of UTC is always 0
      return 0
    }
    throw new Error('Unimplemented')
  }
  getOffsetStringFor(epochMilliseconds: number) {
    const offset = this.getOffsetMillisecondsFor(epochMilliseconds)

    const sign = offset < 0 ? '-' : '+'
    // const ms = offset % 1000
    // const secs = (offset / 1000) % 60
    const mins = Math.abs((offset / 1000 / 60) % 60)
    const hours = Math.abs(offset / 1000 / 60 / 60)

    const minStr = `0${mins}`.slice(-2)
    const hourStr = `0${hours}`.slice(-2)

    return `${sign}${hourStr}:${minStr}`
  }
  getPlainDateTimeFor(
    epochMilliseconds: number,
    calendar: Calendar | CalendarType
  ) {
    return PlainDateTime.from({
      epochMilliseconds:
        epochMilliseconds - this.getOffsetMillisecondsFor(epochMilliseconds),
      calendar,
    })
  }
}
