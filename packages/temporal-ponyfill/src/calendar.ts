import { addDays, addMonths, addYears } from './add'
import { isoDateToMs, MS_FOR, reduceFormat, UNIT_INCREMENT } from './convert'
import { diffDays, diffMonths, diffYears } from './diff'
import { Duration } from './duration'
import { PlainDate } from './plainDate'
import { asRoundOptions, RoundOptionsLike } from './round'
import {
  AssignmentOptions,
  AssignmentOptionsLike,
  CompareReturn,
} from './utils'

export type CalendarId =
  | 'buddhist'
  | 'chinese'
  | 'coptic'
  | 'ethiopia'
  | 'ethiopic'
  | 'gregory'
  | 'hebrew'
  | 'indian'
  | 'islamic'
  | 'iso8601'
  | 'japanese'
  | 'persian'
  | 'roc'

export type CalendarDate = {
  year: number
  month: number
  day: number
}

const isoToCal = (date: PlainDate, calendar: Calendar): CalendarDate => {
  return {
    year: calendar.year(date),
    month: calendar.month(date),
    day: calendar.day(date),
  }
}

export const compareCalendarDates = (
  one: CalendarDate,
  two: CalendarDate,
  calendar: Calendar
): CompareReturn => {
  return PlainDate.compare(
    calendar.dateFromFields(one),
    calendar.dateFromFields(two)
  )
}

export class Calendar {
  private formatter: Intl.DateTimeFormat

  constructor(readonly id: CalendarId = 'iso8601') {
    this.formatter = Intl.DateTimeFormat('en-us', {
      calendar: this.id,
      weekday: 'long',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      timeZone: 'UTC',
    })
  }

  year({ isoYear }: PlainDate): number {
    return reduceFormat(
      isoDateToMs({ isoYear, isoMonth: 1, isoDay: 1 }),
      this.formatter
    )['year'] as number
  }

  month({ isoYear, isoMonth }: PlainDate): number {
    return reduceFormat(
      isoDateToMs({ isoYear, isoMonth, isoDay: 1 }),
      this.formatter
    )['month'] as number
  }

  day(dt: PlainDate): number {
    return reduceFormat(isoDateToMs(dt), this.formatter)['day'] as number
  }

  // IN methods
  daysInWeek(): number {
    return UNIT_INCREMENT.WEEK
  }

  daysInMonth({ isoYear, isoMonth }: PlainDate): number {
    // `isoDay: 0` is used to move back 1 day since isoDay is 1-based
    return new Date(
      isoDateToMs({ isoYear, isoMonth: isoMonth + 1, isoDay: 0 })
    ).getUTCDate()
  }

  daysInYear({ isoYear }: PlainDate): number {
    return diffDays(
      { isoYear, isoMonth: 1, isoDay: 1 },
      { isoYear: isoYear + 1, isoMonth: 1, isoDay: 1 }
    )
  }

  monthsInYear({ isoYear }: PlainDate): number {
    // `isoDay: 0` is used to move back 1 day since isoDay is 1-based
    return (
      new Date(isoDateToMs({ isoYear: isoYear + 1, isoDay: 0 })).getUTCMonth() +
      1
    )
  }

  // OF methods
  dayOfWeek(dt: PlainDate): number {
    return new Date(isoDateToMs(dt)).getUTCDay()
  }

  dayOfYear(dt: PlainDate): number {
    return this.dateUntil(
      { isoYear: dt.isoYear, isoMonth: 0, isoDay: 1 },
      dt
    ).total({ unit: 'days' })
  }

  weekOfYear(dt: PlainDate): number {
    const date = {
      isoYear: dt.isoYear,
      isoMonth: dt.isoMonth,
      // Set to a thursday
      isoDay: dt.isoDay + 3 - ((this.dayOfWeek(dt) + 6) % UNIT_INCREMENT.WEEK),
    }
    // Week 1 is always January 4th
    const week1 = { isoYear: dt.isoYear, isoMonth: 1, isoDay: 4 }

    // Adjusts week1 to a Thursday and calculates the week difference
    return (
      1 +
      Math.round(
        ((isoDateToMs(date) - isoDateToMs(week1)) / MS_FOR.DAY -
          3 +
          ((this.dayOfWeek(week1) + 6) % UNIT_INCREMENT.WEEK)) /
          7
      )
    )
  }

  // Boolean methods
  inLeapYear({ isoYear }: PlainDate): boolean {
    return isoYear % 400 === 0 || (isoYear % 4 === 0 && isoYear % 100 !== 0)
  }

  dateFromFields(fields: CalendarDate, options?: AssignmentOptions): PlainDate {
    // FIXME: Overflow does nothing
    const overflow = options?.overflow || 'constrain'
    return {
      isoYear: fields.year,
      isoMonth: fields.month,
      isoDay: fields.day,
    }
  }

  // Calendar Math
  dateAdd(
    date: PlainDate,
    duration: Duration,
    options?: AssignmentOptionsLike
  ): PlainDate {
    const { years, months, weeks, days } = duration
    let fields: CalendarDate = {
      year: this.year(date),
      month: this.month(date),
      day: this.day(date),
    }
    const rejectOverflow = options?.overflow === 'reject'

    // Simply defer to add functions, which return a mutated fields object
    fields = addYears(fields, years, this, rejectOverflow)
    fields = addMonths(fields, months, this, rejectOverflow)
    const { isoYear, isoMonth, isoDay } = addDays(
      this.dateFromFields(fields),
      days + weeks * UNIT_INCREMENT.WEEK
    )
    return { isoYear, isoMonth, isoDay }
  }

  dateUntil(
    one: PlainDate,
    two: PlainDate,
    options?: RoundOptionsLike
  ): Duration {
    const { largestUnit } = asRoundOptions(options)

    const oneCal = isoToCal(one, this)
    const twoCal = isoToCal(two, this)

    const negative = compareCalendarDates(oneCal, twoCal, this) > 0
    let current = negative ? twoCal : oneCal
    const end = negative ? oneCal : twoCal
    let years = 0,
      months = 0,
      weeks = 0,
      days = 0

    switch (largestUnit) {
      case 'years':
        // eslint-disable-next-line @typescript-eslint/no-extra-semi
        ;[years, current] = diffYears(current, end, this, false)
      case 'months':
        // eslint-disable-next-line @typescript-eslint/no-extra-semi
        ;[months, current] = diffMonths(current, end, this, false)
      case 'weeks':
      case 'days':
      default:
        days = diffDays(this.dateFromFields(current), negative ? one : two)
    }

    if (largestUnit === 'weeks') {
      weeks = Math.trunc(days / UNIT_INCREMENT.WEEK)
      days = days % UNIT_INCREMENT.WEEK
    }

    const dur = new Duration(years, months, weeks, days)
    return negative ? dur.negated() : dur
  }
}
