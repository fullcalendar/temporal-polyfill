import { balanceFromMs } from './balance'
import { Duration } from './duration'
import { asRoundOptions } from './round'
import {
  CalendarType,
  AssignmentOptionsLikeType,
  AssignmentOptionsType,
  PlainDateType,
  RoundOptionsLikeType,
  UNIT_INCREMENT,
  Part,
} from './types'
import { comparePlainDate, toUnitMs } from './utils'

type DateFieldsType = {
  year: number
  month: number
  day: number
}

// const handleMonthOverflow = (
//   calendar: Calendar,
//   { isoYear, isoMonth }: PlainDateType,
//   rejectOverflow: boolean
// ): [number, number] => {
//   const totalMonths = calendar.monthsInYear({ isoYear })
//   if (rejectOverflow && isoMonth > totalMonths)
//     throw new Error('Month overflow is disabled')
//   return [isoMonth % totalMonths, Math.trunc(isoMonth / totalMonths)]
// }
// const handleDayOverflow = (
//   calendar: Calendar,
//   { isoYear, isoMonth, isoDay }: PlainDateType,
//   rejectOverflow: boolean
// ): [number, number] => {
//   const totalDays = calendar.daysInMonth({ isoYear, isoMonth })
//   if (rejectOverflow && isoDay > totalDays)
//     throw new Error('Day overflow is disabled')
//   return [isoDay % totalDays, Math.trunc(isoDay / totalDays)]
// }
const handleMonthOverflow = (
  calendar: Calendar,
  fields: DateFieldsType,
  rejectOverflow: boolean
): number => {
  const { isoYear, isoMonth } = calendar.dateFromFields(fields)
  const totalMonths = calendar.monthsInYear({ isoYear })
  if (rejectOverflow && isoMonth > totalMonths)
    throw new Error('Month overflow is disabled')
  return isoMonth % totalMonths
}
const handleDayOverflow = (
  calendar: Calendar,
  fields: DateFieldsType,
  rejectOverflow: boolean
): number => {
  const { isoYear, isoMonth, isoDay } = calendar.dateFromFields(fields)
  const totalDays = calendar.daysInMonth({ isoYear, isoMonth })
  if (rejectOverflow && isoDay > totalDays)
    throw new Error('Day overflow is disabled')
  return isoDay % totalDays
}

export class Calendar {
  private formatter: Intl.DateTimeFormat

  constructor(readonly id: CalendarType = 'iso8601') {
    this.formatter = Intl.DateTimeFormat('en-us', {
      calendar: this.id,
      weekday: 'long',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      timeZone: 'UTC',
    })
  }

  private formattedPropertyValue(dt: PlainDateType, property: string): string {
    return this.formatter
      .formatToParts(new Date(Date.UTC(dt.isoYear, dt.isoMonth, dt.isoDay)))
      .reduce(
        (acc: { [type: string]: string }, { type, value }) => ({
          ...acc,
          [type]: value,
        }),
        {}
      )[property]
  }

  year({ isoYear }: Part<PlainDateType, 'isoYear'>): number {
    return parseInt(
      this.formattedPropertyValue({ isoYear, isoMonth: 0, isoDay: 1 }, 'year')
    )
  }
  month({
    isoYear,
    isoMonth,
  }: Part<PlainDateType, 'isoYear' | 'isoMonth'>): number {
    return parseInt(
      this.formattedPropertyValue({ isoYear, isoMonth, isoDay: 1 }, 'month')
    )
  }
  day(dt: PlainDateType): number {
    return parseInt(this.formattedPropertyValue(dt, 'day'))
  }

  // IN methods
  daysInWeek(): number {
    return UNIT_INCREMENT.WEEK
  }
  daysInMonth({
    isoYear,
    isoMonth,
  }: Part<PlainDateType, 'isoYear' | 'isoMonth'>): number {
    return new Date(Date.UTC(isoYear, isoMonth + 1, 0)).getUTCDate()
  }
  daysInYear({ isoYear }: Part<PlainDateType, 'isoYear'>): number {
    return new Date(Date.UTC(isoYear + 1, 0, 0)).getUTCDate()
  }
  monthsInYear({ isoYear }: Part<PlainDateType, 'isoYear'>): number {
    return new Date(Date.UTC(isoYear + 1, 0, 0)).getUTCMonth() + 1
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
    fields: DateFieldsType,
    options?: AssignmentOptionsType
  ): PlainDateType {
    const overflow = options?.overflow || 'constrain'
    return { isoYear: fields.year, isoMonth: fields.month, isoDay: fields.day }
  }

  // Calendar Math

  // dateAdd(
  //   date: PlainDateType,
  //   duration: Duration,
  //   options?: AssignmentOptionsLikeType
  // ): PlainDateType {
  //   let { years, months, weeks, days } = duration
  //   let { isoYear, isoMonth, isoDay } = this.dateFromFields({
  //     year: this.year(date) + years,
  //     month: this.month(date) - 1 + months,
  //     day: this.day(date) + weeks * UNIT_INCREMENT.WEEK + days,
  //   })
  //   const rejectOverflow = options?.overflow === 'reject'

  //   const [newMonths, deltaYears] = handleMonthOverflow(
  //     this,
  //     { isoYear, isoMonth, isoDay },
  //     rejectOverflow
  //   )
  //   isoYear += deltaYears
  //   isoMonth = newMonths
  //   const [newDays, deltaMonths] = handleDayOverflow(
  //     this,
  //     { isoYear, isoMonth, isoDay },
  //     rejectOverflow
  //   )
  //   isoMonth += deltaMonths
  //   isoDay = newDays

  //   return { isoYear, isoMonth, isoDay }
  // }
  dateAdd(
    date: PlainDateType,
    duration: Duration,
    options?: AssignmentOptionsLikeType
  ): PlainDateType {
    let fields: DateFieldsType = {
      year: this.year(date),
      month: this.month(date),
      day: this.day(date),
    }
    let { years, months, weeks, days } = duration
    const rejectOverflow = options?.overflow === 'reject'

    if (years) {
      fields.year += years
      fields.month = handleMonthOverflow(this, fields, rejectOverflow)
    }

    if (months) {
      while (months > 0) {
        const monthsLeft =
          this.monthsInYear({ isoYear: fields.year }) - fields.month
        if (months <= monthsLeft) {
          fields.month += months
          break
        } else {
          // move to next year
          fields.year += 1
          fields.month = 1
          months -= monthsLeft
        }
      }
      while (months < 0) {
        if (fields.month + months > 0) {
          fields.month += months
          break
        } else {
          // move to prior year
          fields.year -= 1
          fields.month = this.monthsInYear({ isoYear: fields.year })
          months += fields.month + 1 // reduce the remaining travel by the # of months just moved
        }
      }
      fields.day = handleDayOverflow(this, fields, rejectOverflow)
    }

    days += weeks * UNIT_INCREMENT.WEEK

    const { isoYear, isoMonth, isoDay } = this.dateFromFields(fields)
    return balanceFromMs(Date.UTC(isoYear, isoMonth, isoDay))
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
      mid = balanceFromMs(
        Date.UTC(one.isoYear + years, one.isoMonth + months, one.isoDay)
      )
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
        mid = balanceFromMs(
          Date.UTC(one.isoYear + years, one.isoMonth + months, one.isoDay)
        )
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
