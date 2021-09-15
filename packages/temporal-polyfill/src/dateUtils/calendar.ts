import { ensureCalendarsEqual } from '../argParse/calendar'
import { parseOverflowHandling } from '../argParse/overflowHandling'
import { DateArg, DateLikeFields, OverflowOptions } from '../args'
import { Calendar } from '../calendar'
import { CalendarImpl } from '../calendarImpl/calendarImpl'
import { ISOCalendarImpl } from '../calendarImpl/isoCalendarImpl'
import { PlainDate } from '../plainDate'
import { PlainDateTime } from '../plainDateTime'
import { PlainMonthDay } from '../plainMonthDay'
import { PlainYearMonth } from '../plainYearMonth'
import { ZonedDateTime } from '../zonedDateTime'
import { DateFields, DateISOEssentials, constrainDateFields, createDate } from './date'
import { diffDaysMilli, epochMilliToISOFields } from './isoMath'

export const isoCalendarID = 'iso8601'
export const isoCalendarImpl = new ISOCalendarImpl(isoCalendarID)

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

  if (year == null) {
    if (eraYear == null || era == null) {
      throw new Error('Must specify either a year or an era & eraYear')
    } else {
      year = calendarImpl.convertEraYear(eraYear, era)
    }
  }

  if (monthCode != null) {
    const m = calendarImpl.convertMonthCode(monthCode, year)
    if (month != null && month !== m) {
      throw new Error('Month doesnt match with monthCode')
    }
    month = m
  } else if (month == null) {
    throw new Error('Must specify either a month or monthCode')
  }

  if (day == null) {
    throw new Error('Must specify day')
  }

  [year, month, day] = constrainDateFields(
    year, month, day,
    calendarImpl,
    parseOverflowHandling(options?.overflow),
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
