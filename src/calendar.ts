import { Duration } from './duration'
import { PlainDateTime } from './plainDateTime'
import { asRoundOptions } from './round'
import {
  CalendarType,
  AssignmentOptionsLikeType,
  AssignmentOptionsType,
  PlainDate,
  RoundOptionsLikeType,
  RoundOptionsType,
} from './types'
import { comparePlainDate } from './utils'
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

  dateAdd(
    { isoYear, isoMonth, isoDay }: PlainDate,
    duration: Duration,
    options?: AssignmentOptionsLikeType
  ): PlainDate {
    // TODO: Make overflow do something
    const { overflow }: AssignmentOptionsType = {
      overflow: 'constrain',
      ...options,
    }
    const jsDate = new Date(isoYear, isoMonth, isoDay)
    jsDate.setFullYear(
      jsDate.getFullYear() + duration.years,
      jsDate.getMonth() + duration.months,
      jsDate.getDate() + duration.days + duration.weeks * 7
    )
    return {
      isoYear: jsDate.getFullYear(),
      isoMonth: jsDate.getMonth(),
      isoDay: jsDate.getDate(),
    }
  }

  dateUntil(
    one: PlainDate,
    two: PlainDate,
    options?: RoundOptionsLikeType
  ): Duration {
    const { largestUnit, smallestUnit, roundingMode } = asRoundOptions(options)

    return new Duration()
  }
}
