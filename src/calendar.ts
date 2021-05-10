import { PlainDateTime } from './plainDateTime'
import { CalendarType } from './types'
import { ZonedDateTime } from './zonedDateTime'

export class Calendar {
  constructor(readonly id: CalendarType = 'iso8601') {}

  year(dt: PlainDateTime | ZonedDateTime) {}
  month(dt: PlainDateTime | ZonedDateTime) {}
  day(dt: PlainDateTime | ZonedDateTime) {}
  dayOfWeek(dt: PlainDateTime | ZonedDateTime) {}
  weekOfYear(dt: PlainDateTime | ZonedDateTime) {}
}
