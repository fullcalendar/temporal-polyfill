import {
  ensureCalendarsEqual,
  getCommonCalendar,
  isCalendarArgBag,
  parseCalendarArgFromBag,
} from '../argParse/calendar'
import { parseOverflowOption } from '../argParse/overflowHandling'
import { ensureOptionsObj } from '../argParse/refine'
import { parseUnit } from '../argParse/unitStr'
import { checkEpochMilliBuggy } from '../calendarImpl/bugs'
import { CalendarImpl, CalendarImplFields, convertEraYear } from '../calendarImpl/calendarImpl'
import { queryCalendarImpl } from '../calendarImpl/calendarImplQuery'
import { isoCalendarID } from '../calendarImpl/isoCalendarImpl'
import { AbstractObj, ensureObj } from '../dateUtils/abstract'
import { addToDateFields } from '../dateUtils/add'
import {
  computeDayOfYear,
  computeDaysInYear,
  getExistingDateISOFields,
  queryDateFields,
  queryDateISOFields,
} from '../dateUtils/calendar'
import { diffDateFields } from '../dateUtils/diff'
import { computeISODayOfWeek, isoEpochLeapYear, isoToEpochMilli } from '../dateUtils/isoMath'
import { MonthDayFields } from '../dateUtils/monthDay'
import { tryParseDateTime } from '../dateUtils/parse'
import { DAY, DateUnitInt, YEAR } from '../dateUtils/units'
import { computeWeekOfISOYear } from '../dateUtils/week'
import { createWeakMap } from '../utils/obj'
import { Duration } from './duration'
import { PlainDate } from './plainDate'
import { PlainDateTime } from './plainDateTime'
import { PlainMonthDay } from './plainMonthDay'
import { PlainYearMonth } from './plainYearMonth'
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
} from './types'
import { ZonedDateTime } from './zonedDateTime'

const [getImpl, setImpl] = createWeakMap<Calendar, CalendarImpl>()

export class Calendar extends AbstractObj implements CalendarProtocol {
  constructor(id: string) {
    super()

    if (id === 'islamicc') { // deprecated... TODO: use conversion map
      id = 'islamic-civil'
    }

    setImpl(this, queryCalendarImpl(id))
  }

  static from(arg: CalendarArg): Calendar {
    if (typeof arg === 'object' && arg) { // TODO: isObjectLike
      if (isCalendarArgBag(arg)) {
        return parseCalendarArgFromBag(arg.calendar)
      } else {
        return arg as Calendar // treat CalendarProtocols as Calendars internally
      }
    }
    const parsed = tryParseDateTime(String(arg))
    return new Calendar(
      parsed // a date-time string?
        ? parsed.calendar || isoCalendarID
        : arg, // any other type of string
    )
  }

  get id(): string { return getImpl(this).id }

  era(arg: PlainYearMonth | DateArg | PlainDateTime | ZonedDateTime): string | undefined {
    const isoFields = getExistingDateISOFields(arg, true) // disallowMonthDay=true
    return isoToEpochNanoSafe(
      getImpl(this),
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
    ).era
  }

  eraYear(arg: PlainYearMonth | DateArg | PlainDateTime | ZonedDateTime): number | undefined {
    const isoFields = getExistingDateISOFields(arg, true) // disallowMonthDay=true
    return isoToEpochNanoSafe(
      getImpl(this),
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
    ).eraYear
  }

  year(arg: PlainYearMonth | DateArg | PlainDateTime | ZonedDateTime): number {
    const isoFields = getExistingDateISOFields(arg, true) // disallowMonthDay=true
    return isoToEpochNanoSafe(
      getImpl(this),
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
    ).year
  }

  month(arg: PlainYearMonth | DateArg | PlainDateTime | ZonedDateTime): number {
    const isoFields = getExistingDateISOFields(arg, true) // disallowMonthDay=true
    return isoToEpochNanoSafe(
      getImpl(this),
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
    ).month
  }

  monthCode(arg: PlainYearMonth | PlainMonthDay | DateArg | PlainDateTime | ZonedDateTime): string {
    const fields = queryDateFields(arg, this)
    return getImpl(this).monthCode(fields.month, fields.year)
  }

  day(arg: PlainMonthDay | DateArg | PlainDateTime | ZonedDateTime): number {
    const isoFields = getExistingDateISOFields(arg)
    return isoToEpochNanoSafe(
      getImpl(this),
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
    ).day
  }

  dayOfWeek(arg: DateArg | PlainDateTime | ZonedDateTime): number {
    const isoFields = getExistingDateISOFields(arg, true) // disallowMonthDay=true
    return computeISODayOfWeek(isoFields.isoYear, isoFields.isoMonth, isoFields.isoDay)
  }

  dayOfYear(arg: DateArg | PlainDateTime | ZonedDateTime): number {
    const fields = queryDateFields(arg, this, true) // disallowMonthDay=true
    return computeDayOfYear(getImpl(this), fields.year, fields.month, fields.day)
  }

  weekOfYear(arg: DateArg | PlainDateTime | ZonedDateTime): number {
    const isoFields = getExistingDateISOFields(arg, true) // disallowMonthDay=true
    return computeWeekOfISOYear(
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
      1, // TODO: document what this means
      4, // "
    )
  }

  daysInWeek(arg: DateArg | PlainDateTime | ZonedDateTime): number {
    // will throw error if invalid type
    getExistingDateISOFields(arg, true) // disallowMonthDay=true

    // All calendars seem to have 7-day weeks
    return 7
  }

  daysInMonth(arg: PlainYearMonth | DateArg | PlainDateTime | ZonedDateTime): number {
    const fields = queryDateFields(arg, this, true) // disallowMonthDay=true
    return getImpl(this).daysInMonth(fields.year, fields.month)
  }

  daysInYear(arg: PlainYearMonth | DateArg | PlainDateTime | ZonedDateTime): number {
    const fields = queryDateFields(arg, this, true) // disallowMonthDay=true
    return computeDaysInYear(getImpl(this), fields.year)
  }

  monthsInYear(arg: PlainYearMonth | DateArg | PlainDateTime | ZonedDateTime): number {
    const calFields = queryDateFields(arg, this, true) // disallowMonthDay=true
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
    let { era, eraYear, year, month, monthCode, day } = fields as Partial<MonthDayFields>

    if (day === undefined) {
      throw new TypeError('required property \'day\' missing or undefined')
    }

    if (monthCode !== undefined) {
      year = isoEpochLeapYear
    } else if (era !== undefined && eraYear !== undefined) {
      year = convertEraYear(impl.id, eraYear, era)
    }

    if (year === undefined) {
      if (monthCode !== undefined) {
        year = impl.guessYearForMonthDay(monthCode, day)
      } else {
        throw new TypeError('either year or monthCode required with month')
      }
    }

    const isoFields = queryDateISOFields(
      { year, month: month!, monthCode: monthCode!, day }, // HACKs!
      impl,
      options,
    )

    return new PlainMonthDay(
      isoFields.isoMonth,
      isoFields.isoDay,
      this,
      impl.normalizeISOYearForMonthDay(isoFields.isoYear),
    )
  }

  dateAdd(dateArg: DateArg, durationArg: DurationArg, options?: OverflowOptions): PlainDate {
    const impl = getImpl(this)
    const date = ensureObj(PlainDate, dateArg, options)
    const duration = ensureObj(Duration, durationArg)
    const overflowHandling = parseOverflowOption(options)
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
    const largestUnit = parseUnit<DateUnitInt>(
      ensureOptionsObj(options).largestUnit, DAY, DAY, YEAR,
    )

    ensureCalendarsEqual(getCommonCalendar(d0, d1), this)
    return diffDateFields(d0, d1, impl, largestUnit)
  }

  toString(): string { return this.id }
}

export function createDefaultCalendar(): Calendar {
  return new Calendar(isoCalendarID)
}

// utils

// TODO: can we eliminate this now that it's checked in public date classes?
function isoToEpochNanoSafe(
  calendarImpl: CalendarImpl,
  isoYear: number,
  isoMonth: number,
  isoDay: number,
): CalendarImplFields {
  const epochMilli = isoToEpochMilli(isoYear, isoMonth, isoDay)
  checkEpochMilliBuggy(epochMilli, calendarImpl.id)
  return calendarImpl.computeFields(epochMilli)
}
