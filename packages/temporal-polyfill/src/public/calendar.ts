import {
  ensureCalendarsEqual,
  getCommonCalendar,
  isCalendarArgBag,
  parseCalendarArgFromBag,
} from '../argParse/calendar'
import { dateFieldMap, monthDayFieldMap, yearMonthFieldMap } from '../argParse/fieldStr'
import { parseOverflowOption } from '../argParse/overflowHandling'
import { ensureOptionsObj, refineFields } from '../argParse/refine'
import { parseUnit } from '../argParse/unitStr'
import { checkEpochMilliBuggy } from '../calendarImpl/bugs'
import { CalendarImpl, CalendarImplFields, convertEraYear } from '../calendarImpl/calendarImpl'
import { queryCalendarImpl } from '../calendarImpl/calendarImplQuery'
import { isoCalendarID } from '../calendarImpl/isoCalendarImpl'
import { AbstractObj, ensureObj } from '../dateUtils/abstract'
import {
  computeDayOfYear,
  computeDaysInYear,
  getExistingDateISOFields,
  queryDateFields,
  queryDateISOFields,
} from '../dateUtils/calendar'
import { diffDateFields } from '../dateUtils/diff'
import { computeISODayOfWeek, isoEpochLeapYear, isoToEpochMilli } from '../dateUtils/epoch'
import { tryParseDateTime } from '../dateUtils/parse'
import { translateDate } from '../dateUtils/translate'
import { InputDateFields } from '../dateUtils/typesPrivate'
import { DAY, DateUnitInt, YEAR } from '../dateUtils/units'
import { computeWeekOfISOYear } from '../dateUtils/week'
import { createWeakMap } from '../utils/obj'
import { Duration, createDuration } from './duration'
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
    const parsed = tryParseDateTime(String(arg), false, true) // allowZ=true
    return new Calendar(
      parsed // a date-time string?
        ? parsed.calendar || isoCalendarID
        : arg, // any other type of string
    )
  }

  get id(): string {
    return this.toString()
  }

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

  dateFromFields(fields: DateLikeFields, options?: OverflowOptions): PlainDate {
    const refinedFields = refineFields(fields, dateFieldMap) as DateLikeFields
    const isoFields = queryDateISOFields(refinedFields, getImpl(this), options)

    return new PlainDate(
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
      this,
    )
  }

  yearMonthFromFields(fields: YearMonthLikeFields, options?: OverflowOptions): PlainYearMonth {
    const refinedFields = refineFields(fields, yearMonthFieldMap) as YearMonthLikeFields
    const isoFields = queryDateISOFields({ ...refinedFields, day: 1 }, getImpl(this), options)

    return new PlainYearMonth(
      isoFields.isoYear,
      isoFields.isoMonth,
      this,
      isoFields.isoDay,
    )
  }

  monthDayFromFields(fields: MonthDayLikeFields, options?: OverflowOptions): PlainMonthDay {
    const impl = getImpl(this)

    const refinedFields = refineFields(fields, monthDayFieldMap) as MonthDayLikeFields
    let { era, eraYear, year, month, monthCode, day } = refinedFields as Partial<InputDateFields>

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
    const isoFields = translateDate(date, duration, impl, overflowHandling)

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

    ensureCalendarsEqual(this, getCommonCalendar(d0, d1))

    return createDuration(
      diffDateFields(d0, d1, impl, largestUnit),
    )
  }

  /*
  Given a date-type's core field names, returns the field names that should be
  given to Calendar::yearMonthFromFields/monthDayFromFields/dateFromFields
  */
  fields(inFields: string[]): string[] {
    return inFields.slice() // copy
  }

  /*
  Given a date-instance, and fields to override, returns the fields that should be
  given to Calendar::yearMonthFromFields/monthDayFromFields/dateFromFields
  */
  mergeFields(baseFields: any, additionalFields: any): any {
    return mergeCalFields(baseFields, additionalFields)
  }

  toString(): string {
    return getImpl(this).id
  }
}

export function createDefaultCalendar(): Calendar {
  return new Calendar(isoCalendarID)
}

// TODO: better types?
export function mergeCalFields(baseFields: any, additionalFields: any): any {
  const merged = { ...baseFields, ...additionalFields } as any

  if (baseFields.year !== undefined) {
    delete merged.era
    delete merged.eraYear
    delete merged.year

    let anyAdditionalYear = false

    if (additionalFields.era !== undefined || additionalFields.eraYear !== undefined) {
      merged.era = additionalFields.era
      merged.eraYear = additionalFields.eraYear
      anyAdditionalYear = true
    }
    if (additionalFields.year !== undefined) {
      merged.year = additionalFields.year
      anyAdditionalYear = true
    }
    if (!anyAdditionalYear) {
      merged.year = baseFields.year
    }
  }

  if (baseFields.monthCode !== undefined) {
    delete merged.monthCode
    delete merged.month

    let anyAdditionalMonth = false

    if (additionalFields.month !== undefined) {
      merged.month = additionalFields.month
      anyAdditionalMonth = true
    }
    if (additionalFields.monthCode !== undefined) {
      merged.monthCode = additionalFields.monthCode
      anyAdditionalMonth = true
    }
    if (!anyAdditionalMonth) {
      merged.monthCode = baseFields.monthCode
    }
  }

  if (baseFields.day !== undefined) {
    merged.day = additionalFields.day ?? baseFields.day
  }

  return merged
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
