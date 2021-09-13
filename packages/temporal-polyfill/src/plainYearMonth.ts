import { extractCalendar, isoCalendar } from './argParse/calendar'
import { parseCalendarDisplay } from './argParse/calendarDisplay'
import { OVERFLOW_REJECT } from './argParse/overflowHandling'
import { refineFields } from './argParse/refine'
import { AbstractISOObj, ensureObj } from './dateUtils/abstract'
import { constrainDateISO, createDate } from './dateUtils/date'
import { formatCalendarID, formatYearMonthISO } from './dateUtils/isoFormat'
import { isoFieldsToEpochMilli } from './dateUtils/isoMath'
import {
  YearMonthCalendarFields,
  mixinCalendarFields,
  mixinISOFields,
  yearMonthCalendarFields,
} from './dateUtils/mixins'
import { parseDateTimeISO } from './dateUtils/parse'
import {
  comparePlainYearMonths,
  createYearMonth,
  overrideYearMonthFields,
  yearMonthFieldMap,
} from './dateUtils/yearMonth'
import {
  CalendarArg,
  CompareResult,
  DateISOFields,
  DateToStringOptions,
  LocalesArg,
  OverflowOptions,
  YearMonthArg,
  YearMonthLikeFields,
  YearMonthOverrides,
} from './args'
import { Calendar } from './calendar'
import { PlainDate } from './plainDate'

export class PlainYearMonth extends AbstractISOObj<DateISOFields> {
  constructor(
    isoYear: number,
    isoMonth: number,
    calendarArg: CalendarArg = isoCalendar,
    referenceISODay = 1,
  ) {
    super({
      ...constrainDateISO({
        isoYear,
        isoMonth,
        isoDay: referenceISODay,
      }, OVERFLOW_REJECT),
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
    const refinedFields = refineFields(fields, yearMonthFieldMap, ['calendar'])
    return this.calendar.yearMonthFromFields(
      overrideYearMonthFields(refinedFields, this),
      options,
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

  toPlainDate(): PlainDate { return createDate(this.getISOFields()) }
}

// mixin
export interface PlainYearMonth extends YearMonthCalendarFields { calendar: Calendar }
mixinISOFields(PlainYearMonth, ['calendar'])
mixinCalendarFields(PlainYearMonth, yearMonthCalendarFields)
