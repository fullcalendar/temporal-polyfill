import { balanceDateTime } from './balance'
import { Duration } from './duration'
import { PlainDateTime } from './plainDateTime'
import { asRoundOptions } from './round'
import {
  CalendarType,
  AssignmentOptionsLikeType,
  AssignmentOptionsType,
  PlainDateType,
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

  year(dt: PlainDateTime | ZonedDateTime): number {
    return parseInt(this.formattedPropertyValue(dt, 'year'))
  }
  month(dt: PlainDateTime | ZonedDateTime): number {
    return parseInt(this.formattedPropertyValue(dt, 'month'))
  }
  day(dt: PlainDateTime | ZonedDateTime): number {
    return parseInt(this.formattedPropertyValue(dt, 'day'))
  }
  dayOfWeek(dt: PlainDateTime | ZonedDateTime): string {
    return this.formattedPropertyValue(dt, 'weekday')
  }
  weekOfYear(dt: PlainDateTime | ZonedDateTime): number {
    const yearStart = Date.UTC(dt.year, 0, 1)
    const weekNum = Math.ceil(
      ((dt.epochMilliseconds - yearStart) / 86400000 + 1) / 7
    )
    return weekNum
  }
  // TODO: Implement this
  daysInMonth(dt: PlainDateType): number {
    return 30
  }
  // TODO: Implement this
  dayOfYear(dt: PlainDateType): number {
    return 1
  }
  // TODO: Implement this
  inLeapYear(dt: PlainDateType): boolean {
    return false
  }

  dateAdd(
    { isoYear, isoMonth, isoDay }: PlainDateType,
    duration: Duration,
    options?: AssignmentOptionsLikeType
  ): PlainDateType {
    // TODO: Make overflow do something
    const { overflow }: AssignmentOptionsType = {
      overflow: 'constrain',
      ...options,
    }
    const jsDate = new Date(0)
    jsDate.setUTCFullYear(
      isoYear + duration.years,
      isoMonth + duration.months,
      isoDay + duration.days + duration.weeks * 7
    )
    return {
      isoYear: jsDate.getUTCFullYear(),
      isoMonth: jsDate.getUTCMonth(),
      isoDay: jsDate.getUTCDate(),
    }
  }

  dateUntil(
    one: PlainDateType,
    two: PlainDateType,
    options?: RoundOptionsLikeType
  ): Duration {
    const { largestUnit } = asRoundOptions(options)

    switch (largestUnit) {
      case 'years':
      case 'months': {
        const sign = -comparePlainDate(one, two)
        if (sign === 0) return new Duration()

        const start: PlainDateType = { ...one }
        const end: PlainDateType = { ...two }

        let years = end.isoYear - start.isoYear
        let mid: PlainDateType = balanceDateTime({
          ...one,
          isoYear: one.isoYear + years,
        })
        let midSign = -comparePlainDate(mid, two)
        if (midSign === 0) {
          return largestUnit === 'years'
            ? new Duration(years)
            : new Duration(0, years * 12)
        }
        let months = end.isoMonth - start.isoMonth
        if (midSign !== sign) {
          years -= sign
          months += sign * 12
        }
        mid = balanceDateTime({
          ...one,
          isoYear: one.isoYear + years,
          isoMonth: one.isoMonth + months,
        })
        midSign = -comparePlainDate(mid, two)
        if (midSign === 0) {
          return largestUnit === 'years'
            ? new Duration(years, months)
            : new Duration(0, months + years * 12)
        }
        if (midSign !== sign) {
          // The end date is later in the month than mid date (or earlier for negative durations). Back up one month.
          months -= sign
          if (months === -sign) {
            years -= sign
            months = 11 * sign
          }
          mid = balanceDateTime({
            ...one,
            isoYear: one.isoYear + years,
            isoMonth: one.isoMonth + months,
          })
          midSign = -comparePlainDate(one, mid)
        }

        let days = 0
        // If we get here, months and years are correct (no overflow), and `mid` is within the range from `start` to `end`. To count the days between `mid` and `end`, there are 3 cases:
        if (mid.isoMonth === end.isoMonth && mid.isoYear === end.isoYear) {
          // 1) same month: use simple subtraction
          days = end.isoDay - mid.isoDay
        } else if (sign < 0) {
          // 2) end is previous month from intermediate (negative duration)
          // Example: intermediate: Feb 1, end: Jan 30, DaysInMonth = 31, days = -2
          days = -mid.isoDay - (this.daysInMonth(end) - end.isoDay)
        } else {
          // 3) end is next month from intermediate (positive duration)
          // Example: intermediate: Jan 29, end: Feb 1, DaysInMonth = 31, days = 3
          days = end.isoDay + (this.daysInMonth(mid) - mid.isoDay)
        }

        if (largestUnit === 'months') {
          months += years * 12
          years = 0
        }
        return new Duration(years, months, 0, days)
      }
      case 'weeks':
      case 'days': {
        let larger: PlainDateType, smaller: PlainDateType, sign: 1 | -1
        if (comparePlainDate(one, two) < 0) {
          smaller = { ...one }
          larger = { ...two }
          sign = 1
        } else {
          smaller = { ...two }
          larger = { ...one }
          sign = -1
        }
        let years = larger.isoYear - smaller.isoYear
        let days = this.dayOfYear(larger) - this.dayOfYear(smaller)
        while (years > 0) {
          days += this.inLeapYear({
            isoYear: smaller.isoYear + years - 1,
            isoMonth: 0,
            isoDay: 1,
          })
            ? 366
            : 365
          years -= 1
        }
        let weeks = 0
        if (largestUnit === 'weeks') {
          weeks = Math.floor(days / 7)
          days %= 7
        }
        weeks *= sign
        days *= sign
        return new Duration(0, 0, weeks, days)
      }
      default:
        throw new Error('Invalid units')
    }
  }
}
