import { PlainDateTime } from './plainDateTime'
import { CalendarType } from './types'
import { ZonedDateTime } from './zonedDateTime'

export class Calendar {
  private format

  constructor(readonly id: CalendarType = 'iso8601') {
    this.format = Intl.DateTimeFormat('en-us', { calendar: id })
  }

  private formattedPropertyValue(
    dt: PlainDateTime | ZonedDateTime,
    property: string
  ) {
    return this.format.formatToParts(dt.epochMilliseconds).reduce(
      (acc: { [type: string]: string }, { type, value }) => ({
        ...acc,
        [type]: value,
      }),
      {}
    )[property]
  }

  year(dt: PlainDateTime | ZonedDateTime) {
    return parseInt(this.formattedPropertyValue(dt, 'year') || '1970')
  }
  month(dt: PlainDateTime | ZonedDateTime) {
    return parseInt(this.formattedPropertyValue(dt, 'month') || '1')
  }
  day(dt: PlainDateTime | ZonedDateTime) {
    return parseInt(this.formattedPropertyValue(dt, 'day') || '1')
  }
  dayOfWeek(dt: PlainDateTime | ZonedDateTime) {
    return this.formattedPropertyValue(dt, 'weekday')
  }
  weekOfYear(dt: PlainDateTime | ZonedDateTime) {}
}
