import { Temporal } from 'temporal-spec'
import { ensureCalendarsEqual } from '../argParse/calendar'
import { OVERFLOW_REJECT, parseOverflowOption } from '../argParse/overflowHandling'
import { CalendarImpl, convertEraYear } from '../calendarImpl/calendarImpl'
import { PlainDate, PlainDateArg, createDate } from '../public/plainDate'
import { PlainDateTime } from '../public/plainDateTime'
import { PlainMonthDay } from '../public/plainMonthDay'
import { PlainYearMonth } from '../public/plainYearMonth'
import { ZonedDateTime } from '../public/zonedDateTime'
import { constrainDateFields } from './constrain'
import { diffDaysMilli, epochMilliToISOFields } from './epoch'
import { ISODateFields } from './isoFields'
import { LocalDateFields } from './localFields'

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
  arg: DateISOInstance | PlainDateArg,
  calendar: Temporal.CalendarProtocol,
  disallowMonthDay?: boolean,
): LocalDateFields {
  let date: PlainDate

  if (arg instanceof PlainDate) {
    date = arg
  } else if (isDateISOInstance(arg)) {
    if (disallowMonthDay && arg instanceof PlainMonthDay) {
      throw new TypeError('PlainMonthDay not allowed')
    }
    date = createDate(arg.getISOFields())
  } else {
    date = PlainDate.from(arg)
  }

  ensureCalendarsEqual(date.calendar, calendar)
  return date
}

// ISO Field Querying

export function queryDateISOFields(
  dateLike: DateISOInstance | Temporal.PlainDateLike,
  calendarImpl: CalendarImpl,
  options: Temporal.AssignmentOptions | undefined,
): ISODateFields {
  if (isDateISOInstance(dateLike)) {
    return dateLike.getISOFields() // hard work has already been done
  }

  let { era, eraYear, year, month, monthCode, day } = dateLike
  const yearFromEra = (eraYear !== undefined && era !== undefined)
    ? convertEraYear(calendarImpl.id, eraYear, era)
    : undefined

  if (year === undefined) {
    if (yearFromEra !== undefined) {
      year = yearFromEra
    } else {
      throw new TypeError('Must specify either a year or an era & eraYear')
    }
  } else {
    if (yearFromEra !== undefined) {
      if (yearFromEra !== year) {
        throw new RangeError('year and era/eraYear must match')
      }
    }
  }

  if (day === undefined) {
    throw new TypeError('Must specify day')
  }

  const overflow = parseOverflowOption(options)

  if (monthCode !== undefined) {
    const [tryMonth, unusedLeap] = calendarImpl.convertMonthCode(monthCode, year)

    if (month !== undefined && month !== tryMonth) {
      throw new RangeError('Month doesnt match with monthCode')
    }

    month = tryMonth

    if (unusedLeap) {
      if (overflow === OVERFLOW_REJECT) {
        throw new RangeError('Month code out of range')
      }
      // constrain to last day of month
      day = calendarImpl.daysInMonth(year, month)
    }
  } else if (month === undefined) {
    throw new TypeError('Must specify either a month or monthCode')
  }

  [year, month, day] = constrainDateFields(
    year, month, day,
    calendarImpl,
    overflow,
  )

  return epochMilliToISOFields(calendarImpl.epochMilliseconds(year, month, day))
}

export function getExistingDateISOFields(
  dateArg: DateISOInstance | PlainDateArg,
  disallowMonthDay?: boolean,
): ISODateFields {
  if (isDateISOInstance(dateArg)) {
    if (disallowMonthDay && dateArg instanceof PlainMonthDay) {
      throw new TypeError('PlainMonthDay not allowed')
    }
    return dateArg.getISOFields()
  } else {
    return PlainDate.from(dateArg).getISOFields()
  }
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
