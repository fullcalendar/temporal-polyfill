import { extractCalendar } from '../argParse/calendar'
import { parseCalendarDisplayOption } from '../argParse/calendarDisplay'
import { parseDiffOptions } from '../argParse/diffOptions'
import { yearMonthFieldMap } from '../argParse/fieldStr'
import { OVERFLOW_REJECT, parseOverflowOption } from '../argParse/overflowHandling'
import { refineFields, refineOverrideFields } from '../argParse/refine'
import { isoCalendarID } from '../calendarImpl/isoCalendarImpl'
import { AbstractISOObj, ensureObj } from '../dateUtils/abstract'
import { constrainDateISO, diffDates } from '../dateUtils/date'
import { validateYearMonth } from '../dateUtils/isoFieldValidation'
import { formatCalendarID, formatDateISO, formatYearMonthISO } from '../dateUtils/isoFormat'
import {
  YearMonthCalendarFields,
  mixinCalendarFields,
  mixinISOFields,
  yearMonthCalendarFields,
} from '../dateUtils/mixins'
import { parseDateTimeISO, refineDateTimeParse } from '../dateUtils/parse'
import { MONTH, YEAR, YearMonthUnitInt } from '../dateUtils/units'
import {
  comparePlainYearMonths,
  createYearMonth,
  overrideYearMonthFields,
} from '../dateUtils/yearMonth'
import { FormatConfig, buildPlainFormatConfig, formatWithConfig } from '../native/intl'
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
    const calendar = ensureObj(Calendar, calendarArg)

    validateYearMonth(constrained, calendar.id)

    super({
      ...constrained,
      calendar,
    })
  }

  static from(arg: YearMonthArg, options?: OverflowOptions): PlainYearMonth {
    parseOverflowOption(options) // unused, but need to validate, regardless of input type

    if (arg instanceof PlainYearMonth) {
      return createYearMonth(arg.getISOFields()) // optimization
    }

    if (typeof arg === 'object') {
      const refinedFields = refineFields(arg, yearMonthFieldMap) as YearMonthLikeFields
      return extractCalendar(arg).yearMonthFromFields(refinedFields, options)
    }

    // a string...
    const parsed = parseDateTimeISO(String(arg))

    // don't allow day-numbers in ISO strings
    if (parsed.calendar === undefined) {
      parsed.isoDay = 1
    }

    return createYearMonth(refineDateTimeParse(parsed))
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
    return addDuration(this, ensureObj(Duration, durationArg), options)
  }

  subtract(durationArg: DurationArg, options?: OverflowOptions): PlainYearMonth {
    return addDuration(this, ensureObj(Duration, durationArg).negated(), options)
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
    const calendarID = fields.calendar.id
    const calendarDisplay = parseCalendarDisplayOption(options)

    return (
      calendarID === isoCalendarID
        ? formatYearMonthISO(fields)
        : formatDateISO(fields)
    ) + formatCalendarID(calendarID, calendarDisplay)
  }

  toLocaleString(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions): string {
    return formatWithConfig(this, buildPlainYearMonthFormatConfig(locales, options))
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

// toLocaleString
function buildPlainYearMonthFormatConfig(
  locales: LocalesArg | undefined,
  options: Intl.DateTimeFormatOptions | undefined,
): FormatConfig<PlainYearMonth> {
  return buildPlainFormatConfig(locales, {
    year: 'numeric',
    month: 'numeric',
    ...options,
    weekday: undefined,
    day: undefined,
    hour: undefined,
    minute: undefined,
    second: undefined,
  }, true) // strictCalendar
}

// utils
function addDuration(
  yearMonth: PlainYearMonth,
  duration: Duration,
  options?: OverflowOptions,
): PlainYearMonth {
  return yearMonth.toPlainDate({
    day: duration.sign < 0
      ? yearMonth.daysInMonth
      : 1,
  })
    .add(duration, options)
    .toPlainYearMonth()
}
