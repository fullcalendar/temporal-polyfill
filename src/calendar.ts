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
  UNIT_INCREMENT,
} from './types'
import { comparePlainDate, toUnitMs } from './utils'
import { ZonedDateTime } from './zonedDateTime'

export class Calendar {
  private format: Intl.DateTimeFormat

  constructor(readonly id: CalendarType = 'iso8601') {
    this.format = Intl.DateTimeFormat('en-us', {
      calendar: this.id,
    })
  }

  private formattedPropertyValue(dt: PlainDateType, property: string): string {
    return this.format
      .formatToParts(new Date(dt.isoYear, dt.isoMonth, dt.isoDay))
      .reduce(
        (acc: { [type: string]: string }, { type, value }) => ({
          ...acc,
          [type]: value,
        }),
        {}
      )[property]
  }

  year(dt: PlainDateType): number {
    return parseInt(this.formattedPropertyValue(dt, 'year'))
  }
  month(dt: PlainDateType): number {
    return parseInt(this.formattedPropertyValue(dt, 'month'))
  }
  day(dt: PlainDateType): number {
    return parseInt(this.formattedPropertyValue(dt, 'day'))
  }

  // IN methods
  daysInWeek(dt: PlainDateType): number {
    return 7
  }
  daysInMonth({ isoYear, isoMonth }: PlainDateType): number {
    return new Date(isoYear, isoMonth + 1, 0).getDate()
  }
  daysInYear({ isoYear }: PlainDateType): number {
    return new Date(isoYear + 1, 0, 0).getDate()
  }
  monthsInYear({ isoYear }: PlainDateType): number {
    return new Date(isoYear + 1, 0, 0).getMonth() + 1
  }

  // OF methods
  dayOfWeek(dt: PlainDateType): string {
    return this.formattedPropertyValue(dt, 'weekday')
  }
  dayOfYear(dt: PlainDateType): number {
    return this.dateUntil(
      { isoYear: dt.isoYear, isoMonth: 0, isoDay: 1 },
      dt
    ).total({ unit: 'days' })
  }
  weekOfYear(dt: PlainDateType): number {
    return Math.ceil(
      ((Date.UTC(dt.isoYear, dt.isoMonth, dt.isoDay) -
        Date.UTC(dt.isoYear, 0)) /
        toUnitMs('days') +
        1) /
        UNIT_INCREMENT.WEEK
    )
  }

  // Boolean methods
  inLeapYear({ isoYear }: PlainDateType): boolean {
    return isoYear % 400 === 0 || (isoYear % 4 === 0 && isoYear % 100 !== 0)
  }

  // TODO: Implement this
  dateFromFields(
    fields: {
      year: number
      month: number
      day: number
    },
    options: AssignmentOptionsType
  ): PlainDateType {
    return { isoYear: fields.year, isoMonth: fields.month, isoDay: fields.day }
  }

  // Calendar Math
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

    if (largestUnit === 'years' || largestUnit === 'months') {
      const sign = -comparePlainDate(one, two)
      if (sign === 0) return new Duration()

      const start = one
      const end = two

      let years = end.isoYear - start.isoYear
      let months = end.isoMonth - start.isoMonth
      let days = 0

      let mid: PlainDateType = {
        ...one,
        isoYear: one.isoYear + years,
      }
      let midSign = -comparePlainDate(mid, two)
      if (midSign === 0) {
        return largestUnit === 'years'
          ? new Duration(years)
          : new Duration(0, years * UNIT_INCREMENT.YEAR)
      }

      if (midSign !== sign) {
        years -= sign
        months += sign * UNIT_INCREMENT.YEAR
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
          : new Duration(0, months + years * UNIT_INCREMENT.YEAR)
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
        months += years * UNIT_INCREMENT.YEAR
        years = 0
      }
      return new Duration(years, months, 0, days)
    } else if (largestUnit === 'weeks' || largestUnit === 'days') {
      const sign = comparePlainDate(one, two) < 0 ? 1 : -1
      const smaller = sign === 1 ? one : two
      const larger = sign === 1 ? two : one

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
        years--
      }
      let weeks = 0
      if (largestUnit === 'weeks') {
        weeks = Math.floor(days / UNIT_INCREMENT.WEEK)
        days %= UNIT_INCREMENT.WEEK
      }
      return new Duration(0, 0, weeks * sign, days * sign)
    }
    throw new Error('Invalid units')
  }
}
