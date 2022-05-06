import { Temporal } from 'temporal-spec'
import { calendarFromObj, ensureCalendarsEqual, getCommonCalendar } from '../argParse/calendar'
import { dateFieldMap, monthDayFieldMap, yearMonthFieldMap } from '../argParse/fieldStr'
import { parseOverflowOption } from '../argParse/overflowHandling'
import { ensureOptionsObj, isObjectLike, refineFields } from '../argParse/refine'
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
import { attachStringTag } from '../dateUtils/mixins'
import { tryParseDateTime } from '../dateUtils/parse'
import { translateDate } from '../dateUtils/translate'
import { DAY, DateUnitInt, YEAR } from '../dateUtils/units'
import { computeWeekOfISOYear } from '../dateUtils/week'
import { createWeakMap } from '../utils/obj'
import { Duration, DurationArg, createDuration } from './duration'
import { PlainDate, PlainDateArg } from './plainDate'
import { PlainMonthDay } from './plainMonthDay'
import { PlainYearMonth } from './plainYearMonth'

// FYI: the Temporal.CalendarLike type includes `string`,
// unlike many other object types

const [getImpl, setImpl] = createWeakMap<Calendar, CalendarImpl>()

export class Calendar extends AbstractObj implements Temporal.Calendar {
  constructor(id: string) {
    super()

    if (id === 'islamicc') { // deprecated... TODO: use conversion map
      id = 'islamic-civil'
    }

    setImpl(this, queryCalendarImpl(id))
  }

  static from(arg: Temporal.CalendarLike): Temporal.CalendarProtocol {
    if (isObjectLike(arg)) {
      return calendarFromObj(arg)
    }

    const parsed = tryParseDateTime(String(arg), false, true) // allowZ=true
    return new Calendar(
      parsed // a date-time string?
        ? parsed.calendar || isoCalendarID
        : String(arg), // any other type of string
    )
  }

  get id(): string {
    return this.toString()
  }

  era(
    arg: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.PlainDateLike | string,
  ): string | undefined {
    const isoFields = getExistingDateISOFields(arg, true) // disallowMonthDay=true
    return isoToEpochNanoSafe(
      getImpl(this),
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
    ).era
  }

  eraYear(
    arg: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.PlainDateLike | string,
  ): number | undefined {
    const isoFields = getExistingDateISOFields(arg, true) // disallowMonthDay=true
    return isoToEpochNanoSafe(
      getImpl(this),
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
    ).eraYear
  }

  year(
    arg:
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.PlainYearMonth
    | Temporal.PlainDateLike
    | string,
  ): number {
    const isoFields = getExistingDateISOFields(arg, true) // disallowMonthDay=true
    return isoToEpochNanoSafe(
      getImpl(this),
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
    ).year
  }

  month(
    arg:
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.PlainYearMonth
    | Temporal.PlainMonthDay
    | Temporal.PlainDateLike
    | string,
  ): number {
    const isoFields = getExistingDateISOFields(arg, true) // disallowMonthDay=true
    return isoToEpochNanoSafe(
      getImpl(this),
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
    ).month
  }

  monthCode(
    arg:
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.PlainYearMonth
    | Temporal.PlainMonthDay
    | Temporal.PlainDateLike
    | string,
  ): string {
    const fields = queryDateFields(arg, this)
    return getImpl(this).monthCode(fields.month, fields.year)
  }

  day(
    arg:
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.PlainMonthDay
    | Temporal.PlainDateLike
    | string,
  ): number {
    const isoFields = getExistingDateISOFields(arg)
    return isoToEpochNanoSafe(
      getImpl(this),
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
    ).day
  }

  dayOfWeek(
    arg: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.PlainDateLike | string,
  ): number {
    const isoFields = getExistingDateISOFields(arg, true) // disallowMonthDay=true
    return computeISODayOfWeek(isoFields.isoYear, isoFields.isoMonth, isoFields.isoDay)
  }

  dayOfYear(
    arg: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.PlainDateLike | string,
  ): number {
    const fields = queryDateFields(arg, this, true) // disallowMonthDay=true
    return computeDayOfYear(getImpl(this), fields.year, fields.month, fields.day)
  }

  weekOfYear(
    arg: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.PlainDateLike | string,
  ): number {
    const isoFields = getExistingDateISOFields(arg, true) // disallowMonthDay=true
    return computeWeekOfISOYear(
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
      1, // TODO: document what this means
      4, // "
    )
  }

  daysInWeek(
    arg: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.PlainDateLike | string,
  ): number {
    // will throw error if invalid type
    getExistingDateISOFields(arg, true) // disallowMonthDay=true

    // All calendars seem to have 7-day weeks
    return 7
  }

  daysInMonth(
    arg:
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.PlainYearMonth
    | Temporal.PlainDateLike
    | string,
  ): number {
    const fields = queryDateFields(arg, this, true) // disallowMonthDay=true
    return getImpl(this).daysInMonth(fields.year, fields.month)
  }

  daysInYear(
    arg:
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.PlainYearMonth
    | Temporal.PlainDateLike
    | string,
  ): number {
    const fields = queryDateFields(arg, this, true) // disallowMonthDay=true
    return computeDaysInYear(getImpl(this), fields.year)
  }

  monthsInYear(
    arg:
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.PlainYearMonth
    | Temporal.PlainDateLike
    | string,
  ): number {
    const calFields = queryDateFields(arg, this, true) // disallowMonthDay=true
    return getImpl(this).monthsInYear(calFields.year)
  }

  inLeapYear(
    arg:
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.PlainYearMonth
    | Temporal.PlainDateLike
    | string,
  ): boolean {
    return getImpl(this).inLeapYear(this.year(arg))
  }

  dateFromFields(
    fields: Temporal.YearOrEraAndEraYear & Temporal.MonthOrMonthCode & { day: number },
    options?: Temporal.AssignmentOptions,
  ): Temporal.PlainDate {
    const refinedFields = refineFields(fields, dateFieldMap)
    const isoFields = queryDateISOFields(refinedFields, getImpl(this), options)

    return new PlainDate(
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
      this,
    )
  }

  yearMonthFromFields(
    fields: Temporal.YearOrEraAndEraYear & Temporal.MonthOrMonthCode,
    options?: Temporal.AssignmentOptions,
  ): Temporal.PlainYearMonth {
    const refinedFields = refineFields(fields, yearMonthFieldMap)
    const isoFields = queryDateISOFields({ ...refinedFields, day: 1 }, getImpl(this), options)

    return new PlainYearMonth(
      isoFields.isoYear,
      isoFields.isoMonth,
      this,
      isoFields.isoDay,
    )
  }

  monthDayFromFields(
    fields: Temporal.MonthCodeOrMonthAndYear & { day: number },
    options?: Temporal.AssignmentOptions,
  ): Temporal.PlainMonthDay {
    const impl = getImpl(this)
    let { era, eraYear, year, month, monthCode, day } = refineFields(fields, monthDayFieldMap)

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

  dateAdd(
    dateArg: PlainDateArg,
    durationArg: DurationArg,
    options?: Temporal.ArithmeticOptions,
  ): Temporal.PlainDate {
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

  dateUntil(
    dateArg0: PlainDateArg,
    dateArg1: PlainDateArg,
    options?: Temporal.DifferenceOptions<'year' | 'month' | 'week' | 'day'>,
  ): Temporal.Duration {
    const impl = getImpl(this)
    const d0 = ensureObj(PlainDate, dateArg0)
    const d1 = ensureObj(PlainDate, dateArg1)
    const largestUnitStr = ensureOptionsObj(options).largestUnit
    const largestUnit = largestUnitStr === 'auto'
      ? DAY // TODO: util for this?
      : parseUnit<DateUnitInt>(largestUnitStr, DAY, DAY, YEAR)

    ensureCalendarsEqual(this, getCommonCalendar(d0, d1))

    return createDuration(
      diffDateFields(d0, d1, impl, largestUnit),
    )
  }

  /*
  Given a date-type's core field names, returns the field names that should be
  given to Calendar::yearMonthFromFields/monthDayFromFields/dateFromFields
  */
  // TODO: for inFields, use Iterable<string>
  fields(inFields: string[]): string[] {
    return inFields.slice() // copy
  }

  /*
  Given a date-instance, and fields to override, returns the fields that should be
  given to Calendar::yearMonthFromFields/monthDayFromFields/dateFromFields
  */
  // TODO: use Record<string, unknown>
  mergeFields(baseFields: any, additionalFields: any): any {
    return mergeCalFields(baseFields, additionalFields)
  }

  toString(): string {
    return getImpl(this).id
  }
}

// mixins
export interface Calendar { [Symbol.toStringTag]: 'Temporal.Calendar' }
attachStringTag(Calendar, 'Calendar')

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
