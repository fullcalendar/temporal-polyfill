import {
  ensureCalendarsEqual,
  extractCalendar,
  getCommonCalendar,
  isCalendarArgBag,
} from './argParse/calendar'
import { parseOverflowHandling } from './argParse/overflowHandling'
import { parseUnit } from './argParse/units'
import { CalendarImpl } from './calendarImpl/calendarImpl'
import { calendarImplClasses } from './calendarImpl/config'
import { IntlCalendarImpl } from './calendarImpl/intlCalendarImpl'
import { AbstractObj, ensureObj } from './dateUtils/abstract'
import { addToDateFields } from './dateUtils/add'
import {
  computeDayOfYear,
  computeDaysInYear,
  getExistingDateISOFields,
  isoCalendarID,
  isoCalendarImpl,
  queryDateFields,
  queryDateISOFields,
} from './dateUtils/calendar'
import { diffDateFields } from './dateUtils/diff'
import { computeISODayOfWeek } from './dateUtils/isoMath'
import { MonthDayFields } from './dateUtils/monthDay'
import { DAY, DateUnitInt, YEAR } from './dateUtils/units'
import { computeWeekOfISOYear } from './dateUtils/week'
import { createWeakMap } from './utils/obj'
import {
  CalendarArg,
  CalendarProtocol,
  DateArg,
  DateLikeFields,
  DateUnit,
  DurationArg,
  MonthDayLikeFields,
  OverflowOptions,
  YearMonthLikeFields,
} from './args'
import { Duration } from './duration'
import { PlainDate } from './plainDate'
import { PlainDateTime } from './plainDateTime'
import { PlainMonthDay } from './plainMonthDay'
import { PlainYearMonth } from './plainYearMonth'
import { ZonedDateTime } from './zonedDateTime'

const [getImpl, setImpl] = createWeakMap<Calendar, CalendarImpl>()
const [getID, setID] = createWeakMap<Calendar, string>()
const implCache: { [calendarID: string]: CalendarImpl } = {
  [isoCalendarID]: isoCalendarImpl,
}

export class Calendar extends AbstractObj implements CalendarProtocol {
  constructor(id: string) {
    super()

    // lowercase matches keys in calendarImplClasses
    id = String(id).toLocaleLowerCase()

    const impl = implCache[id] ||
      (implCache[id] = new (calendarImplClasses[id] || IntlCalendarImpl)(id))

    setImpl(this, impl)
    setID(this, impl.id) // record the normalized ID
  }

  static from(arg: CalendarArg): Calendar {
    if (typeof arg === 'object') {
      if (isCalendarArgBag(arg)) {
        return extractCalendar(arg)
      } else {
        return arg as Calendar // treat CalendarProtocols as Calendars internally
      }
    }
    return new Calendar(arg) // arg is a string
  }

  get id(): string { return getID(this) }

  era(arg: PlainYearMonth | DateArg | PlainDateTime | ZonedDateTime): string | undefined {
    const isoFields = getExistingDateISOFields(arg)
    return getImpl(this).era(
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
    )
  }

  eraYear(arg: PlainYearMonth | DateArg | PlainDateTime | ZonedDateTime): number | undefined {
    const isoFields = getExistingDateISOFields(arg)
    return getImpl(this).eraYear(
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
    )
  }

  year(arg: PlainYearMonth | DateArg | PlainDateTime | ZonedDateTime): number {
    const isoFields = getExistingDateISOFields(arg)
    return getImpl(this).year(
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
    )
  }

  month(arg: PlainYearMonth | DateArg | PlainDateTime | ZonedDateTime): number {
    const isoFields = getExistingDateISOFields(arg)
    return getImpl(this).month(
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
    )
  }

  monthCode(arg: PlainYearMonth | PlainMonthDay | DateArg | PlainDateTime | ZonedDateTime): string {
    const fields = queryDateFields(arg, this)
    return getImpl(this).monthCode(fields.month, fields.year)
  }

  day(arg: PlainMonthDay | DateArg | PlainDateTime | ZonedDateTime): number {
    const isoFields = getExistingDateISOFields(arg)
    return getImpl(this).day(
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
    )
  }

  dayOfWeek(arg: DateArg | PlainDateTime | ZonedDateTime): number {
    const isoFields = getExistingDateISOFields(arg)
    return computeISODayOfWeek(isoFields.isoYear, isoFields.isoMonth, isoFields.isoDay)
  }

  dayOfYear(arg: DateArg | PlainDateTime | ZonedDateTime): number {
    const fields = queryDateFields(arg, this)
    return computeDayOfYear(getImpl(this), fields.year, fields.month, fields.day)
  }

  weekOfYear(arg: DateArg | PlainDateTime | ZonedDateTime): number {
    const isoFields = getExistingDateISOFields(arg)
    return computeWeekOfISOYear(
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
      1, // TODO: document what this means
      4, // "
    )
  }

  daysInWeek(_arg: DateArg | PlainDateTime | ZonedDateTime): number {
    // All calendars seem to have 7-day weeks
    return 7
  }

  daysInMonth(arg: PlainYearMonth | DateArg | PlainDateTime | ZonedDateTime): number {
    const fields = queryDateFields(arg, this)
    return getImpl(this).daysInMonth(fields.year, fields.month)
  }

  daysInYear(arg: PlainYearMonth | DateArg | PlainDateTime | ZonedDateTime): number {
    const fields = queryDateFields(arg, this)
    return computeDaysInYear(getImpl(this), fields.year)
  }

  monthsInYear(arg: PlainYearMonth | DateArg | PlainDateTime | ZonedDateTime): number {
    const calFields = queryDateFields(arg, this)
    return getImpl(this).monthsInYear(calFields.year)
  }

  inLeapYear(arg: PlainYearMonth | DateArg | PlainDateTime | ZonedDateTime): boolean {
    return getImpl(this).inLeapYear(this.year(arg))
  }

  dateFromFields(arg: DateLikeFields, options?: OverflowOptions): PlainDate {
    const isoFields = queryDateISOFields(arg, getImpl(this), options)
    return new PlainDate(
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
      this,
    )
  }

  yearMonthFromFields(arg: YearMonthLikeFields, options?: OverflowOptions): PlainYearMonth {
    const isoFields = queryDateISOFields({ ...arg, day: 1 }, getImpl(this), options)
    return new PlainYearMonth(
      isoFields.isoYear,
      isoFields.isoMonth,
      this,
      isoFields.isoDay,
    )
  }

  monthDayFromFields(fields: MonthDayLikeFields, options?: OverflowOptions): PlainMonthDay {
    const impl = getImpl(this)
    let { year, monthCode, day } = fields as Partial<MonthDayFields>

    if (year == null || monthCode != null) { // if monthCode specified, recalc the referenceYear
      year = impl.monthYear(monthCode, day)
    }

    const isoFields = queryDateISOFields(
      { ...fields, year },
      impl,
      options,
    )
    return new PlainMonthDay(
      isoFields.isoMonth,
      isoFields.isoDay,
      this,
      isoFields.isoYear,
    )
  }

  dateAdd(dateArg: DateArg, durationArg: DurationArg, options?: OverflowOptions): PlainDate {
    const impl = getImpl(this)
    const date = ensureObj(PlainDate, dateArg, options)
    const duration = ensureObj(Duration, durationArg)
    const overflowHandling = parseOverflowHandling(options?.overflow)
    const isoFields = addToDateFields(date, duration, impl, overflowHandling)

    return new PlainDate(
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
      this,
    )
  }

  dateUntil(dateArg0: DateArg, dateArg1: DateArg, options?: { largestUnit?: DateUnit }): Duration {
    const impl = getImpl(this)
    const d0 = ensureObj(PlainDate, dateArg0)
    const d1 = ensureObj(PlainDate, dateArg1)
    const largestUnit = parseUnit<DateUnitInt>(options?.largestUnit, DAY, DAY, YEAR)

    ensureCalendarsEqual(getCommonCalendar(d0, d1), this)
    return diffDateFields(d0, d1, impl, largestUnit)
  }

  toString(): string { return this.id }
}
