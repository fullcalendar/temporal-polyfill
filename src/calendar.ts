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
  CompareReturnType,
} from './types'
import { comparePlainDate, toUnitMs } from './utils'

type CalendarDateType = {
  year: number
  month: number
  day: number
}

// Diff Utils
const diffYears = (
  one: Part<CalendarDateType, 'year'>,
  two: Part<CalendarDateType, 'year'>,
  calendar: Calendar
): [number, CalendarDateType] => {
  let current = { month: 1, day: 1, ...one }
  const end = { month: 1, day: 1, ...two }

  let years = end.year - current.year
  current = addYears(current, years)
  if (compareCalendarDates(current, end, calendar) > 0) {
    current.year--
    years--
  }
  return [years, current]
}
const diffMonths = (
  one: Part<CalendarDateType, 'year' | 'month'>,
  two: Part<CalendarDateType, 'year' | 'month'>,
  calendar: Calendar
): [number, CalendarDateType] => {
  let current = { day: 1, ...one }
  const end = { day: 1, ...two }

  let months = 0
  while (current.year < end.year) {
    current.year++
    months += calendar.monthsInYear(calendar.dateFromFields(current))
  }
  if (compareCalendarDates(current, end, calendar) > 0) {
    current.year--
    months--
  }
  months += end.month - current.month

  current = addMonths(current, months)
  if (compareCalendarDates(current, end, calendar) > 0) {
    current.month--
    months--
  }

  return [months, current]
}
const diffDays = (one: PlainDateType, two: PlainDateType): number => {
  const start = Date.UTC(one.isoYear, one.isoMonth - 1, one.isoDay)
  const end = Date.UTC(two.isoYear, two.isoMonth - 1, two.isoDay)
  return Math.trunc((end - start) / toUnitMs('days'))
}

// Add Utils
const addYears = (
  date: Part<CalendarDateType, 'year'>,
  years: number,
  rejectOverflow: boolean = false
): CalendarDateType => {
  return { year: date.year + years, month: date.month || 1, day: date.day || 1 }
}
const addMonths = (
  date: CalendarDateType,
  months: number,
  rejectOverflow: boolean = false
): CalendarDateType => {
  return { year: date.year, month: date.month + months, day: date.day || 1 }
}
const addDays = (date: PlainDateType, days: number): PlainDateType => {
  return balanceFromMs(
    Date.UTC(date.isoYear, date.isoMonth - 1, date.isoDay) +
      days * toUnitMs('days')
  )
}

// Conversion Utils
const isoToCal = (
  date: PlainDateType,
  calendar: Calendar
): CalendarDateType => {
  return {
    year: calendar.year(date),
    month: calendar.month(date),
    day: calendar.day(date),
  }
}
const compareCalendarDates = (
  one: CalendarDateType,
  two: CalendarDateType,
  calendar: Calendar
): CompareReturnType =>
  comparePlainDate(calendar.dateFromFields(one), calendar.dateFromFields(two))

// Overflow Utils
// TODO: Use this
const handleMonthOverflow = (
  calendar: Calendar,
  fields: CalendarDateType | PlainDateType,
  rejectOverflow: boolean
): [number, number] => {
  const { isoYear, isoMonth } =
    'year' in fields ? calendar.dateFromFields(fields) : fields
  const totalMonths = calendar.monthsInYear({ isoYear }) + 1
  if (rejectOverflow && isoMonth > totalMonths)
    throw new Error('Month overflow is disabled')
  return [isoMonth % totalMonths, Math.trunc(isoMonth / totalMonths)]
}
// TODO: Use this
const handleDayOverflow = (
  calendar: Calendar,
  fields: CalendarDateType | PlainDateType,
  rejectOverflow: boolean
): [number, number] => {
  const { isoYear, isoMonth, isoDay } =
    'year' in fields ? calendar.dateFromFields(fields) : fields
  const totalDays = calendar.daysInMonth({ isoYear, isoMonth }) + 1
  if (rejectOverflow && isoDay > totalDays)
    throw new Error('Day overflow is disabled')
  return [isoDay % totalDays, Math.trunc(isoDay / totalDays)]
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
      .formatToParts(new Date(Date.UTC(dt.isoYear, dt.isoMonth - 1, dt.isoDay)))
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
      this.formattedPropertyValue({ isoYear, isoMonth: 1, isoDay: 1 }, 'year')
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
      ((Date.UTC(dt.isoYear, dt.isoMonth - 1, dt.isoDay) -
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

  dateFromFields(
    fields: Part<CalendarDateType, 'year' | 'month'>,
    options?: AssignmentOptionsType
  ): PlainDateType {
    // FIXME: Overflow does nothing
    const overflow = options?.overflow || 'constrain'
    return {
      isoYear: fields.year,
      isoMonth: fields.month,
      isoDay: fields.day || 1,
    }
  }

  // Calendar Math
  dateAdd(
    date: PlainDateType,
    duration: Duration,
    options?: AssignmentOptionsLikeType
  ): PlainDateType {
    let { years, months, weeks, days } = duration
    let fields: CalendarDateType = {
      year: this.year(date),
      month: this.month(date),
      day: this.day(date),
    }
    const rejectOverflow = options?.overflow === 'reject'
    fields = addYears(fields, years, rejectOverflow)
    fields = addMonths(fields, months, rejectOverflow)
    const { isoYear, isoMonth, isoDay } = addDays(
      this.dateFromFields(fields),
      days + weeks * UNIT_INCREMENT.WEEK
    )
    return { isoYear, isoMonth, isoDay }
  }
  dateUntil(
    one: PlainDateType,
    two: PlainDateType,
    options?: RoundOptionsLikeType
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
        ;[years, current] = diffYears(current, end, this)
      case 'months':
        ;[months, current] = diffMonths(current, end, this)
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
