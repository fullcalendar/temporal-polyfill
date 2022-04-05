import { getCommonCalendar } from '../argParse/calendar'
import { parseCalendarDisplayOption } from '../argParse/calendarDisplay'
import { parseDiffOptions } from '../argParse/diffOptions'
import { OVERFLOW_REJECT, parseOverflowOption } from '../argParse/overflowHandling'
import { isoCalendarID } from '../calendarImpl/isoCalendarImpl'
import { AbstractISOObj, ensureObj } from '../dateUtils/abstract'
import { compareDateTimes } from '../dateUtils/compare'
import { constrainDateISO } from '../dateUtils/constrain'
import { diffDates } from '../dateUtils/diff'
import { negateDuration } from '../dateUtils/durationFields'
import { processYearMonthFromFields, processYearMonthWithFields } from '../dateUtils/fromAndWith'
import { validateYearMonth } from '../dateUtils/isoFieldValidation'
import { formatCalendarID, formatDateISO, formatYearMonthISO } from '../dateUtils/isoFormat'
import {
  YearMonthCalendarFields,
  mixinCalendarFields,
  mixinISOFields,
  yearMonthCalendarFields,
} from '../dateUtils/mixins'
import { parseYearMonth } from '../dateUtils/parse'
import { refineBaseObj } from '../dateUtils/parseRefine'
import { DurationFields } from '../dateUtils/typesPrivate'
import { MONTH, YEAR, YearMonthUnitInt } from '../dateUtils/units'
import { createPlainFormatFactoryFactory } from '../native/intlFactory'
import { ToLocaleStringMethods, mixinLocaleStringMethods } from '../native/intlMixins'
import { Calendar, createDefaultCalendar } from './calendar'
import { Duration, createDuration } from './duration'
import { PlainDate } from './plainDate'
import {
  CalendarArg,
  CompareResult,
  DateISOFields,
  DateToStringOptions,
  DurationArg,
  OverflowOptions,
  YearMonthArg,
  YearMonthDiffOptions,
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
      return processYearMonthFromFields(arg, options)
    }

    // a string...
    const parsed = parseYearMonth(String(arg))

    // don't allow day-numbers in ISO strings
    if (parsed.calendar === undefined) {
      parsed.isoDay = 1
    }

    return createYearMonth(refineBaseObj(parsed))
  }

  static compare(a: YearMonthArg, b: YearMonthArg): CompareResult {
    return compareDateTimes(
      ensureObj(PlainYearMonth, a),
      ensureObj(PlainYearMonth, b),
    )
  }

  with(fields: YearMonthOverrides, options?: OverflowOptions): PlainYearMonth {
    return processYearMonthWithFields(this, fields, options)
  }

  add(durationArg: DurationArg, options?: OverflowOptions): PlainYearMonth {
    return translatePlainYearMonth(this, ensureObj(Duration, durationArg), options)
  }

  subtract(durationArg: DurationArg, options?: OverflowOptions): PlainYearMonth {
    return translatePlainYearMonth(this, negateDuration(ensureObj(Duration, durationArg)), options)
  }

  until(other: YearMonthArg, options?: YearMonthDiffOptions): Duration {
    return diffPlainYearMonths(this, ensureObj(PlainYearMonth, other), false, options)
  }

  since(other: YearMonthArg, options?: YearMonthDiffOptions): Duration {
    return diffPlainYearMonths(this, ensureObj(PlainYearMonth, other), true, options)
  }

  equals(other: YearMonthArg): boolean {
    return !compareDateTimes(this, ensureObj(PlainYearMonth, other))
  }

  toString(options?: DateToStringOptions): string {
    const fields = this.getISOFields()
    const calendarID = fields.calendar.toString() // see note in formatCalendarID
    const calendarDisplay = parseCalendarDisplayOption(options)

    return (
      calendarID === isoCalendarID
        ? formatYearMonthISO(fields)
        : formatDateISO(fields)
    ) + formatCalendarID(calendarID, calendarDisplay)
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
export interface PlainYearMonth extends ToLocaleStringMethods {}
mixinISOFields(PlainYearMonth)
mixinCalendarFields(PlainYearMonth, yearMonthCalendarFields)
mixinLocaleStringMethods(PlainYearMonth, createPlainFormatFactoryFactory({
  year: 'numeric',
  month: 'numeric',
}, {
  weekday: undefined,
  day: undefined,
  hour: undefined,
  minute: undefined,
  second: undefined,
}, true)) // strictCalendar

export function createYearMonth(isoFields: DateISOFields): PlainYearMonth {
  return new PlainYearMonth(
    isoFields.isoYear,
    isoFields.isoMonth,
    isoFields.calendar,
    isoFields.isoDay,
  )
}

function translatePlainYearMonth(
  yearMonth: PlainYearMonth,
  duration: DurationFields,
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

function diffPlainYearMonths(
  pym0: PlainYearMonth,
  pym1: PlainYearMonth,
  flip: boolean,
  options: YearMonthDiffOptions | undefined,
): Duration {
  return createDuration(
    diffDates(
      pym0.toPlainDate(day1),
      pym1.toPlainDate(day1),
      getCommonCalendar(pym0, pym1),
      flip,
      parseDiffOptions<YearMonthUnit, YearMonthUnitInt>(options, YEAR, MONTH, MONTH, YEAR),
    ),
  )
}
