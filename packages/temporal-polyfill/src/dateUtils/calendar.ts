import { ensureCalendarsEqual } from '../argParse/calendar'
import { parseOverflowOption } from '../argParse/overflowHandling'
import { CalendarImpl } from '../calendarImpl/calendarImpl'
import { Calendar } from '../public/calendar'
import { PlainDate } from '../public/plainDate'
import { PlainDateTime } from '../public/plainDateTime'
import { PlainMonthDay } from '../public/plainMonthDay'
import { PlainYearMonth } from '../public/plainYearMonth'
import { DateArg, DateLikeFields, OverflowOptions } from '../public/types'
import { ZonedDateTime } from '../public/zonedDateTime'
import { DateFields, DateISOEssentials, constrainDateFields, createDate } from './date'
import { diffDaysMilli, epochMilliToISOFields } from './isoMath'

// Date-type Testing (TODO: move this?)

export type DateLikeInstance = // has year/month/day
  PlainDate |
  PlainDateTime |
  ZonedDateTime

export type DateISOInstance = // has isoYear/isoMonth/isoDay
  DateLikeInstance |
  PlainYearMonth |
  PlainMonthDay

function isDateISOInstance(arg: unknown): arg is DateISOInstance {
  return (
    arg instanceof PlainDate ||
    arg instanceof PlainDateTime ||
    arg instanceof ZonedDateTime ||
    arg instanceof PlainYearMonth ||
    arg instanceof PlainMonthDay
  )
}

// Calendar-dependent Field Querying

export function queryDateFields(
  arg: DateISOInstance | DateArg,
  calendar: Calendar,
): DateFields {
  let date: PlainDate

  if (arg instanceof PlainDate) {
    date = arg
  } else if (isDateISOInstance(arg)) {
    date = createDate(arg.getISOFields())
  } else {
    date = PlainDate.from(arg)
  }

  ensureCalendarsEqual(date.calendar, calendar)
  return date
}

// ISO Field Querying

export function queryDateISOFields(
  dateLike: DateISOInstance | DateLikeFields,
  calendarImpl: CalendarImpl,
  options: OverflowOptions | undefined,
): DateISOEssentials {
  if (isDateISOInstance(dateLike)) {
    return dateLike.getISOFields() // hard work has already been done
  }

  let { era, eraYear, year, month, monthCode, day } = dateLike as Partial<DateFields>

  if (year === undefined) {
    if (eraYear === undefined || era === undefined) {
      throw new TypeError('Must specify either a year or an era & eraYear')
    } else {
      year = calendarImpl.convertEraYear(eraYear, era, true) // errorUnknownEra=true
    }
  }

  if (monthCode !== undefined) {
    const m = calendarImpl.convertMonthCode(monthCode, year)
    if (month !== undefined && month !== m) {
      throw new RangeError('Month doesnt match with monthCode')
    }
    month = m
  } else if (month === undefined) {
    throw new TypeError('Must specify either a month or monthCode')
  }

  if (day === undefined) {
    throw new TypeError('Must specify day')
  }

  [year, month, day] = constrainDateFields(
    year, month, day,
    calendarImpl,
    parseOverflowOption(options),
  )

  return epochMilliToISOFields(calendarImpl.epochMilliseconds(year, month, day))
}

export function getExistingDateISOFields(
  dateArg: DateISOInstance | DateArg,
): DateISOEssentials {
  return (
    isDateISOInstance(dateArg) ? dateArg : PlainDate.from(dateArg)
  ).getISOFields()
}

// Calendar-dependent Math

export function computeDaysInYear(calendarImpl: CalendarImpl, year: number): number {
  return diffDaysMilli(
    calendarImpl.epochMilliseconds(year, 1, 1),
    calendarImpl.epochMilliseconds(year + 1, 1, 1),
  )
}

export function computeDayOfYear(
  calendarImpl: CalendarImpl,
  year: number,
  month: number,
  day: number,
): number {
  return diffDaysMilli(
    calendarImpl.epochMilliseconds(year, 1, 1),
    calendarImpl.epochMilliseconds(year, month, day),
  ) + 1 // 1-based
}
