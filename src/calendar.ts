import { PlainDateTime } from './plainDateTime'
import { CalendarType } from './types'
import { ZonedDateTime } from './zonedDateTime'

export class Calendar {
  constructor(readonly id: CalendarType = 'iso8601') {}

  private getFormat(timeZone: string) {
    return Intl.DateTimeFormat('en-us', {
      calendar: this.id,
      timeZone,
    })
  }

  private formattedPropertyValue(
    dt: PlainDateTime | ZonedDateTime,
    property: string
  ) {
    const format = this.getFormat(
      dt instanceof ZonedDateTime ? dt.timeZone.id : 'UTC'
    )
    return format.formatToParts(dt.epochMilliseconds).reduce(
      (acc: { [type: string]: string }, { type, value }) => ({
        ...acc,
        [type]: value,
      }),
      {}
    )[property]
  }

  year(dt: PlainDateTime | ZonedDateTime) {
    return parseInt(this.formattedPropertyValue(dt, 'year'))
  }
  month(dt: PlainDateTime | ZonedDateTime) {
    return parseInt(this.formattedPropertyValue(dt, 'month'))
  }
  day(dt: PlainDateTime | ZonedDateTime) {
    return parseInt(this.formattedPropertyValue(dt, 'day'))
  }
  dayOfWeek(dt: PlainDateTime | ZonedDateTime) {
    return this.formattedPropertyValue(dt, 'weekday')
  }
  weekOfYear(dt: PlainDateTime | ZonedDateTime) {
    const yearStart = Date.UTC(dt.year, 0, 1)
    const weekNum = Math.ceil(
      ((dt.epochMilliseconds - yearStart) / 86400000 + 1) / 7
    )
    return weekNum
  }
}
