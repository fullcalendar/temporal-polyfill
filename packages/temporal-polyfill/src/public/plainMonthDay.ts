import { parseCalendarDisplayOption } from '../argParse/calendarDisplay'
import { OVERFLOW_REJECT, parseOverflowOption } from '../argParse/overflowHandling'
import { isoCalendarID } from '../calendarImpl/isoCalendarImpl'
import { AbstractISOObj, ensureObj } from '../dateUtils/abstract'
import { constrainDateISO } from '../dateUtils/date'
import { processMonthDayFromFields, processMonthDayWithFields } from '../dateUtils/fromAndWith'
import { formatCalendarID, formatDateISO, formatMonthDayISO } from '../dateUtils/isoFormat'
import { isoEpochLeapYear } from '../dateUtils/isoMath'
import {
  MonthDayCalendarFields,
  mixinCalendarFields,
  mixinISOFields,
  monthDayCalendarFields,
} from '../dateUtils/mixins'
import { createMonthDay, monthDaysEqual } from '../dateUtils/monthDay'
import { parseMonthDay } from '../dateUtils/parse'
import { refineBaseObj } from '../dateUtils/parseRefine'
import { createPlainFormatFactoryFactory } from '../native/intlFactory'
import { ToLocaleStringMethods, mixinLocaleStringMethods } from '../native/intlMixins'
import {
} from '../native/intlUtils'
import { Calendar, createDefaultCalendar } from './calendar'
import { PlainDate } from './plainDate'
import {
  CalendarProtocol,
  DateISOFields,
  DateToStringOptions,
  MonthDayArg,
  MonthDayOverrides,
  OverflowOptions,
} from './types'

export class PlainMonthDay extends AbstractISOObj<DateISOFields> {
  constructor(
    isoMonth: number,
    isoDay: number,
    calendar: CalendarProtocol = createDefaultCalendar(),
    referenceISOYear: number = isoEpochLeapYear,
  ) {
    super({
      ...constrainDateISO({ isoYear: referenceISOYear, isoMonth, isoDay }, OVERFLOW_REJECT),
      calendar,
    })
  }

  static from(arg: MonthDayArg, options?: OverflowOptions): PlainMonthDay {
    parseOverflowOption(options) // unused, but need to validate, regardless of input type

    if (arg instanceof PlainMonthDay) {
      return createMonthDay(arg.getISOFields()) // optimization
    }

    if (typeof arg === 'object') {
      return processMonthDayFromFields(arg, options)
    }

    // a string...
    const parsed = parseMonthDay(String(arg))

    // for strings, force ISO year if no calendar specified
    // TODO: more DRY with processMonthDayLike?
    if (parsed.calendar === undefined) {
      parsed.isoYear = isoEpochLeapYear
    }

    return createMonthDay(refineBaseObj(parsed))
  }

  with(fields: MonthDayOverrides, options?: OverflowOptions): PlainMonthDay {
    return processMonthDayWithFields(this, fields, options)
  }

  equals(other: MonthDayArg): boolean {
    return monthDaysEqual(this, ensureObj(PlainMonthDay, other))
  }

  toString(options?: DateToStringOptions): string {
    const fields = this.getISOFields()
    const calendarID = fields.calendar.toString() // see note in formatCalendarID
    const calendarDisplay = parseCalendarDisplayOption(options)

    return (
      calendarID === isoCalendarID
        ? formatMonthDayISO(fields)
        : formatDateISO(fields)
    ) + formatCalendarID(calendarID, calendarDisplay)
  }

  toPlainDate(fields: { year: number }, options?: OverflowOptions): PlainDate {
    return this.calendar.dateFromFields({
      year: fields.year,
      monthCode: this.monthCode,
      day: this.day,
    }, options)
  }
}

// mixin
export interface PlainMonthDay extends MonthDayCalendarFields { calendar: Calendar }
export interface PlainMonthDay extends ToLocaleStringMethods {}
mixinISOFields(PlainMonthDay)
mixinCalendarFields(PlainMonthDay, monthDayCalendarFields)
mixinLocaleStringMethods(PlainMonthDay, createPlainFormatFactoryFactory({
  month: 'numeric',
  day: 'numeric',
}, {
  weekday: undefined,
  year: undefined,
  hour: undefined,
  minute: undefined,
  second: undefined,
}, true)) // strictCalendar
