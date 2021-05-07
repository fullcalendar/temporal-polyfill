import { PlainDateTime } from './plainDateTime'
import { CalendarType } from './types'
import { ZonedDateTime } from './zonedDateTime'

export class Calendar {
  readonly id: CalendarType
  constructor(id: string = 'iso8601') {
    this.id = id as CalendarType
  }

  year(dt: PlainDateTime | ZonedDateTime) {}
  month(dt: PlainDateTime | ZonedDateTime) {}
  day(dt: PlainDateTime | ZonedDateTime) {}
  dayOfWeek(dt: PlainDateTime | ZonedDateTime) {}
  weekOfYear(dt: PlainDateTime | ZonedDateTime) {}
}
