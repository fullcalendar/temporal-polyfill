import { addDays, addMonths, addYears } from './add'
import { diffDays, diffMonths, diffYears } from './diff'
import { Duration } from './duration'
import { PlainDate } from './plainDateTime'
import { asRoundOptions, RoundOptionsLike } from './round'
import {
  AssignmentOptions,
  AssignmentOptionsLike,
  comparePlainDate,
  CompareReturn,
  dateValue,
  msFor,
  reduceFormat,
  unitIncrement,
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
  return comparePlainDate(
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
      dateValue({ isoYear, isoMonth: 1, isoDay: 1 }),
      this.formatter
    )['year'] as number
  }

  month({ isoYear, isoMonth }: PlainDate): number {
    return reduceFormat(
      dateValue({ isoYear, isoMonth, isoDay: 1 }),
      this.formatter
    )['month'] as number
  }

  day(dt: PlainDate): number {
    return reduceFormat(dateValue(dt), this.formatter)['day'] as number
  }

  // IN methods
  daysInWeek(): number {
    return unitIncrement.weeks
  }

  daysInMonth({ isoYear, isoMonth }: PlainDate): number {
    return new Date(dateValue({ isoYear, isoMonth: isoMonth + 1 })).getUTCDate()
  }

  daysInYear({ isoYear }: PlainDate): number {
    return diffDays(
      { isoYear, isoMonth: 1, isoDay: 1 },
      { isoYear: isoYear + 1, isoMonth: 1, isoDay: 1 }
    )
  }

  monthsInYear({ isoYear }: PlainDate): number {
    // NOTE: `isoDay: 0` is used to move back 1 day since isoDay is 1-based
    return (
      new Date(dateValue({ isoYear: isoYear + 1, isoDay: 0 })).getUTCMonth() + 1
    )
  }

  // OF methods
  dayOfWeek(dt: PlainDate): string {
    return reduceFormat(dateValue(dt), this.formatter)['weekday'] as string
  }

  dayOfYear(dt: PlainDate): number {
    return this.dateUntil(
      { isoYear: dt.isoYear, isoMonth: 0, isoDay: 1 },
      dt
    ).total({ unit: 'days' })
  }

  weekOfYear(dt: PlainDate): number {
    return Math.ceil(
      ((dateValue(dt) - dateValue({ isoYear: dt.isoYear, isoMonth: 1 })) /
        msFor.days +
        1) /
        this.daysInWeek()
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
    fields = addYears(fields, years, this, rejectOverflow)
    fields = addMonths(fields, months, this, rejectOverflow)
    const { isoYear, isoMonth, isoDay } = addDays(
      this.dateFromFields(fields),
      days + weeks * unitIncrement.weeks
    )
    return { isoYear, isoMonth, isoDay }
  }

  dateUntil(
    one: PlainDate,
    two: PlainDate,
    options?: RoundOptionsLike
  ): Duration {
    const { largestUnit } = asRoundOptions(options)

    const negative =
      compareCalendarDates(isoToCal(one, this), isoToCal(two, this), this) > 0
    let current = isoToCal(negative ? two : one, this)
    const end = isoToCal(negative ? one : two, this)
    let years = 0,
      months = 0,
      weeks = 0,
      days = 0

    switch (largestUnit) {
      case 'years':
        ;[years, current] = diffYears(current, end, this, false)
      case 'months':
        ;[months, current] = diffMonths(current, end, this, false)
      case 'weeks':
      case 'days':
      default:
        days = diffDays(this.dateFromFields(current), negative ? one : two)
    }

    if (largestUnit === 'weeks') {
      weeks = Math.trunc(days / unitIncrement.weeks)
      days = days % unitIncrement.weeks
    }

    const dur = new Duration(years, months, weeks, days)
    return negative ? dur.negated() : dur
  }
}
