import { Temporal } from 'temporal-spec'
import { getCommonCalendar } from '../argParse/calendar'
import { parseCalendarDisplayOption } from '../argParse/calendarDisplay'
import { parseDiffOptions } from '../argParse/diffOptions'
import { toString } from '../argParse/fieldStr'
import { OVERFLOW_REJECT, parseOverflowOption } from '../argParse/overflowHandling'
import { isObjectLike } from '../argParse/refine'
import { isoCalendarID } from '../calendarImpl/isoCalendarImpl'
import {
  IsoMasterMethods,
  ensureObj,
  initIsoMaster,
  mixinIsoMasterMethods,
  needReceiver,
} from '../dateUtils/abstract'
import { compareDateTimes } from '../dateUtils/compare'
import { constrainDateISO } from '../dateUtils/constrain'
import { diffDates } from '../dateUtils/diff'
import { DurationFields, negateDuration } from '../dateUtils/durationFields'
import { processYearMonthFromFields, processYearMonthWithFields } from '../dateUtils/fromAndWith'
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

export class PlainYearMonth implements Temporal.PlainYearMonth {
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

    initIsoMaster(this, {
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
    if (isObjectLike(arg)) {
      return processYearMonthFromFields(arg, options)
    }

    // parse as  string...
    const parsed = parseYearMonth(toString(arg))

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
    needReceiver(PlainYearMonth, this)
    return processYearMonthWithFields(this, fields, options)
  }

  add(
    durationArg: DurationArg,
    options?: Temporal.ArithmeticOptions,
  ): Temporal.PlainYearMonth {
    needReceiver(PlainYearMonth, this)
    return translatePlainYearMonth(this, ensureObj(Duration, durationArg), options)
  }

  subtract(
    durationArg: DurationArg,
    options?: Temporal.ArithmeticOptions,
  ): Temporal.PlainYearMonth {
    needReceiver(PlainYearMonth, this)
    return translatePlainYearMonth(this, negateDuration(ensureObj(Duration, durationArg)), options)
  }

  until(other: PlainYearMonthArg, options?: DiffOptions): Temporal.Duration {
    needReceiver(PlainYearMonth, this)
    return diffPlainYearMonths(this, ensureObj(PlainYearMonth, other), false, options)
  }

  since(other: PlainYearMonthArg, options?: DiffOptions): Temporal.Duration {
    needReceiver(PlainYearMonth, this)
    return diffPlainYearMonths(this, ensureObj(PlainYearMonth, other), true, options)
  }

  equals(other: PlainYearMonthArg): boolean {
    needReceiver(PlainYearMonth, this)
    return !compareDateTimes(this, ensureObj(PlainYearMonth, other))
  }

  toString(options?: Temporal.ShowCalendarOption): string {
    needReceiver(PlainYearMonth, this)

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
    needReceiver(PlainYearMonth, this)
    return this.calendar.dateFromFields({
      year: this.year,
      month: this.month,
      day: fields.day,
    })
  }
}

// mixins
export interface PlainYearMonth extends IsoMasterMethods<Temporal.PlainDateISOFields> {}
mixinIsoMasterMethods(PlainYearMonth)
//
export interface PlainYearMonth { [Symbol.toStringTag]: 'Temporal.PlainYearMonth' }
attachStringTag(PlainYearMonth, 'PlainYearMonth')
//
export interface PlainYearMonth extends YearMonthCalendarFields {
  calendar: Temporal.CalendarProtocol
}
mixinISOFields(PlainYearMonth)
mixinCalendarFields(PlainYearMonth, yearMonthCalendarFields)
//
export interface PlainYearMonth extends ToLocaleStringMethods {}
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
