import { extractCalendar } from '../argParse/calendar'
import { parseCalendarDisplay } from '../argParse/calendarDisplay'
import { parseDiffOptions } from '../argParse/diffOptions'
import { yearMonthFieldMap } from '../argParse/fieldStr'
import { OVERFLOW_REJECT } from '../argParse/overflowHandling'
import { refineFields, refineOverrideFields } from '../argParse/refine'
import { AbstractISOObj, ensureObj } from '../dateUtils/abstract'
import { constrainDateISO, diffDates } from '../dateUtils/date'
import { formatCalendarID, formatYearMonthISO } from '../dateUtils/isoFormat'
import { isoFieldsToEpochMilli, validateYearMonth } from '../dateUtils/isoMath'
import {
  YearMonthCalendarFields,
  mixinCalendarFields,
  mixinISOFields,
  yearMonthCalendarFields,
} from '../dateUtils/mixins'
import { parseDateTimeISO } from '../dateUtils/parse'
import { MONTH, YEAR, YearMonthUnitInt } from '../dateUtils/units'
import {
  comparePlainYearMonths,
  createYearMonth,
  overrideYearMonthFields,
} from '../dateUtils/yearMonth'
import { Calendar, createDefaultCalendar } from './calendar'
import { Duration } from './duration'
import { PlainDate } from './plainDate'
import {
  CalendarArg,
  CompareResult,
  DateISOFields,
  DateToStringOptions,
  DurationArg,
  LocalesArg,
  OverflowOptions,
  YearMonthArg,
  YearMonthDiffOptions,
  YearMonthLikeFields,
  YearMonthOverrides,
  YearMonthUnit,
} from './types'

const day1 = { day: 1 }

export class PlainYearMonth extends AbstractISOObj<DateISOFields> {
  constructor(
    isoYear: number,
    isoMonth: number,
    calendarArg: CalendarArg = createDefaultCalendar(),
    referenceISODay = 1,
  ) {
    const constrained = constrainDateISO({
      isoYear,
      isoMonth,
      isoDay: referenceISODay,
    }, OVERFLOW_REJECT)
    validateYearMonth(constrained)
    super({
      ...constrained,
      calendar: ensureObj(Calendar, calendarArg),
    })
  }

  static from(arg: YearMonthArg, options?: OverflowOptions): PlainYearMonth {
    if (arg instanceof PlainYearMonth) {
      return createYearMonth(arg.getISOFields()) // optimization
    }

    if (typeof arg === 'object') {
      const refinedFields = refineFields(arg, yearMonthFieldMap) as YearMonthLikeFields
      return extractCalendar(arg).yearMonthFromFields(refinedFields, options)
    }

    return createYearMonth(parseDateTimeISO(String(arg)))
  }

  static compare(a: YearMonthArg, b: YearMonthArg): CompareResult {
    return comparePlainYearMonths(
      ensureObj(PlainYearMonth, a),
      ensureObj(PlainYearMonth, b),
    )
  }

  with(fields: YearMonthOverrides, options?: OverflowOptions): PlainYearMonth {
    const refinedFields = refineOverrideFields(fields, yearMonthFieldMap)
    return this.calendar.yearMonthFromFields(
      overrideYearMonthFields(refinedFields, this),
      options,
    )
  }

  add(durationArg: DurationArg, options?: OverflowOptions): PlainYearMonth {
    return this.toPlainDate(day1).add(durationArg, options).toPlainYearMonth()
  }

  subtract(durationArg: DurationArg, options?: OverflowOptions): PlainYearMonth {
    return this.toPlainDate(day1).add(durationArg, options).toPlainYearMonth()
  }

  until(other: YearMonthArg, options?: YearMonthDiffOptions): Duration {
    return diffDates(
      this.toPlainDate(day1),
      ensureObj(PlainYearMonth, other).toPlainDate(day1),
      parseDiffOptions<YearMonthUnit, YearMonthUnitInt>(options, YEAR, MONTH, MONTH, YEAR),
    )
  }

  since(other: YearMonthArg, options?: YearMonthDiffOptions): Duration {
    return diffDates(
      this.toPlainDate(day1),
      ensureObj(PlainYearMonth, other).toPlainDate(day1),
      parseDiffOptions<YearMonthUnit, YearMonthUnitInt>(options, YEAR, MONTH, MONTH, YEAR),
      true,
    )
  }

  equals(other: YearMonthArg): boolean {
    return comparePlainYearMonths(this, ensureObj(PlainYearMonth, other)) === 0
  }

  toString(options?: DateToStringOptions): string {
    const fields = this.getISOFields()
    const calendarDisplay = parseCalendarDisplay(options?.calendarName)

    return formatYearMonthISO(fields) +
      formatCalendarID((fields.calendar as Calendar).id, calendarDisplay)
  }

  toLocaleString(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions): string {
    const fields = this.getISOFields()

    return new Intl.DateTimeFormat(locales, {
      calendar: fields.calendar.id,
      ...options,
      timeZone: 'UTC', // options can't override
      // TODO: inject more options to ensure only year+month are displayed by default
    }).format(
      isoFieldsToEpochMilli(fields),
    )
  }

  toPlainDate(fields: { day: number }): PlainDate {
    return this.calendar.dateFromFields({
      year: this.year,
      month: this.month,
      day: fields.day,
    })
  }
}

// mixin
export interface PlainYearMonth extends YearMonthCalendarFields { calendar: Calendar }
mixinISOFields(PlainYearMonth)
mixinCalendarFields(PlainYearMonth, yearMonthCalendarFields)
