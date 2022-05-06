import { Temporal } from 'temporal-spec'
import { getCommonCalendar } from '../argParse/calendar'
import { parseCalendarDisplayOption } from '../argParse/calendarDisplay'
import { parseDiffOptions } from '../argParse/diffOptions'
import { OVERFLOW_REJECT, parseOverflowOption } from '../argParse/overflowHandling'
import { isoCalendarID } from '../calendarImpl/isoCalendarImpl'
import { AbstractISOObj, ensureObj } from '../dateUtils/abstract'
import { compareDateTimes } from '../dateUtils/compare'
import { constrainDateISO } from '../dateUtils/constrain'
import { diffDates } from '../dateUtils/diff'
import { DurationFields, negateDuration } from '../dateUtils/durationFields'
import { processYearMonthFromFields, processYearMonthWithFields } from '../dateUtils/fromAndWith'
import { validateYearMonth } from '../dateUtils/isoFieldValidation'
import { formatCalendarID, formatDateISO, formatYearMonthISO } from '../dateUtils/isoFormat'
import {
  YearMonthCalendarFields,
  attachStringTag,
  mixinCalendarFields,
  mixinISOFields,
  yearMonthCalendarFields,
} from '../dateUtils/mixins'
import { parseYearMonth } from '../dateUtils/parse'
import { refineBaseObj } from '../dateUtils/parseRefine'
import { MONTH, YEAR, YearMonthUnitInt } from '../dateUtils/units'
import { createPlainFormatFactoryFactory } from '../native/intlFactory'
import { ToLocaleStringMethods, mixinLocaleStringMethods } from '../native/intlMixins'
import { Calendar, createDefaultCalendar } from './calendar'
import { Duration, DurationArg, createDuration } from './duration'

export type PlainYearMonthArg = Temporal.PlainYearMonth | Temporal.PlainYearMonthLike | string

type YearMonthUnit = 'year' | 'month'
type DiffOptions = Temporal.DifferenceOptions<YearMonthUnit>

const day1 = { day: 1 }

export class PlainYearMonth extends AbstractISOObj<Temporal.PlainDateISOFields>
  implements Temporal.PlainYearMonth {
  constructor(
    isoYear: number,
    isoMonth: number,
    calendarArg: Temporal.CalendarLike = createDefaultCalendar(),
    referenceISODay = 1,
  ) {
    const constrained = constrainDateISO({
      isoYear,
      isoMonth,
      isoDay: referenceISODay,
    }, OVERFLOW_REJECT)
    const calendar = ensureObj(Calendar, calendarArg)

    validateYearMonth(constrained, calendar.toString())

    super({
      ...constrained,
      calendar,
    })
  }

  static from(
    arg: PlainYearMonthArg,
    options?: Temporal.AssignmentOptions,
  ): Temporal.PlainYearMonth {
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

  static compare(a: PlainYearMonthArg, b: PlainYearMonthArg): Temporal.ComparisonResult {
    return compareDateTimes(
      ensureObj(PlainYearMonth, a),
      ensureObj(PlainYearMonth, b),
    )
  }

  with(
    fields: Temporal.PlainYearMonthLike,
    options?: Temporal.AssignmentOptions,
  ): Temporal.PlainYearMonth {
    return processYearMonthWithFields(this, fields, options)
  }

  add(
    durationArg: DurationArg,
    options?: Temporal.ArithmeticOptions,
  ): Temporal.PlainYearMonth {
    return translatePlainYearMonth(this, ensureObj(Duration, durationArg), options)
  }

  subtract(
    durationArg: DurationArg,
    options?: Temporal.ArithmeticOptions,
  ): Temporal.PlainYearMonth {
    return translatePlainYearMonth(this, negateDuration(ensureObj(Duration, durationArg)), options)
  }

  until(other: PlainYearMonthArg, options?: DiffOptions): Temporal.Duration {
    return diffPlainYearMonths(this, ensureObj(PlainYearMonth, other), false, options)
  }

  since(other: PlainYearMonthArg, options?: DiffOptions): Temporal.Duration {
    return diffPlainYearMonths(this, ensureObj(PlainYearMonth, other), true, options)
  }

  equals(other: PlainYearMonthArg): boolean {
    return !compareDateTimes(this, ensureObj(PlainYearMonth, other))
  }

  toString(options?: Temporal.ShowCalendarOption): string {
    const fields = this.getISOFields()
    const calendarID = fields.calendar.toString() // see note in formatCalendarID
    const calendarDisplay = parseCalendarDisplayOption(options)

    return (
      calendarID === isoCalendarID
        ? formatYearMonthISO(fields)
        : formatDateISO(fields)
    ) + formatCalendarID(calendarID, calendarDisplay)
  }

  toPlainDate(fields: { day: number }): Temporal.PlainDate {
    return this.calendar.dateFromFields({
      year: this.year,
      month: this.month,
      day: fields.day,
    })
  }
}

// mixin
export interface PlainYearMonth { [Symbol.toStringTag]: 'Temporal.PlainYearMonth' }
export interface PlainYearMonth extends YearMonthCalendarFields {
  calendar: Temporal.CalendarProtocol
}
export interface PlainYearMonth extends ToLocaleStringMethods {}
attachStringTag(PlainYearMonth, 'PlainYearMonth')
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

export function createYearMonth(isoFields: Temporal.PlainDateISOFields): PlainYearMonth {
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
  options?: Temporal.ArithmeticOptions,
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
  options: DiffOptions | undefined,
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
