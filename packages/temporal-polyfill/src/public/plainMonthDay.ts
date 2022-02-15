import { extractCalendar } from '../argParse/calendar'
import { parseCalendarDisplayOption } from '../argParse/calendarDisplay'
import { OVERFLOW_REJECT, parseOverflowOption } from '../argParse/overflowHandling'
import { refineFields, refineOverrideFields } from '../argParse/refine'
import { isoCalendarID } from '../calendarImpl/isoCalendarImpl'
import { AbstractISOObj, ensureObj } from '../dateUtils/abstract'
import { constrainDateISO } from '../dateUtils/date'
import { formatCalendarID, formatDateISO, formatMonthDayISO } from '../dateUtils/isoFormat'
import { isoEpochLeapYear } from '../dateUtils/isoMath'
import {
  MonthDayCalendarFields,
  mixinCalendarFields,
  mixinISOFields,
  monthDayCalendarFields,
} from '../dateUtils/mixins'
import {
  MonthDayFields,
  createMonthDay,
  monthDayFieldMap,
  monthDaysEqual,
  overrideMonthDayFields,
} from '../dateUtils/monthDay'
import { parseMonthDayISO, refineDateTimeParse } from '../dateUtils/parse'
import { formatUnzoned } from '../native/intl'
import { throwNew } from '../utils/obj'
import { Calendar, createDefaultCalendar } from './calendar'
import { PlainDate } from './plainDate'
import {
  CalendarProtocol,
  DateISOFields,
  DateToStringOptions,
  LocalesArg,
  MonthDayArg,
  MonthDayLikeFields,
  MonthDayOverrides,
  OverflowOptions,
} from './types'

export class PlainMonthDay extends AbstractISOObj<DateISOFields> {
  constructor(
    isoMonth: number,
    isoDay: number,
    calendar: CalendarProtocol = createDefaultCalendar(),
    referenceISOYear?: number,
  ) {
    const isoYear: number = referenceISOYear ??
      (calendar.id === isoCalendarID
        ? isoEpochLeapYear
        : throwNew(Error, 'Must specify referenceYear')
      )

    super({
      ...constrainDateISO({ isoYear, isoMonth, isoDay }, OVERFLOW_REJECT),
      calendar,
    })
  }

  static from(arg: MonthDayArg, options?: OverflowOptions): PlainMonthDay {
    parseOverflowOption(options) // unused, but need to validate, regardless of input type

    if (arg instanceof PlainMonthDay) {
      return createMonthDay(arg.getISOFields()) // optimization
    }

    if (typeof arg === 'object') {
      const calendar = extractCalendar(arg)
      let refinedFields = refineFields(arg, monthDayFieldMap) as Partial<MonthDayFields>

      // be nice and guess year if no calendar specified
      if (refinedFields.year === undefined && arg.calendar === undefined) {
        refinedFields = { ...refinedFields, year: isoEpochLeapYear }
      }

      return calendar.monthDayFromFields(refinedFields as MonthDayLikeFields, options)
    }

    // a string...
    const parsed = parseMonthDayISO(String(arg))

    // for strings, force ISO year if no calendar specified
    if (parsed.calendar === undefined) {
      parsed.isoYear = isoEpochLeapYear
    }

    return createMonthDay(refineDateTimeParse(parsed))
  }

  with(fields: MonthDayOverrides, options?: OverflowOptions): PlainMonthDay {
    const refinedFields = refineOverrideFields(fields, monthDayFieldMap)
    const mergedFields = overrideMonthDayFields(refinedFields, this)
    return this.calendar.monthDayFromFields(mergedFields, options)
  }

  equals(other: MonthDayArg): boolean {
    return monthDaysEqual(this, ensureObj(PlainMonthDay, other))
  }

  toString(options?: DateToStringOptions): string {
    const fields = this.getISOFields()
    const calendarID = fields.calendar.id
    const calendarDisplay = parseCalendarDisplayOption(options)

    return (
      calendarID === isoCalendarID
        ? formatMonthDayISO(fields)
        : formatDateISO(fields)
    ) + formatCalendarID(calendarID, calendarDisplay)
  }

  toLocaleString(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions): string {
    return formatUnzoned(this, locales, {
      month: 'numeric',
      day: 'numeric',
      ...options,
      weekday: undefined,
      year: undefined,
      hour: undefined,
      minute: undefined,
      second: undefined,
    }, true) // strictCalendar
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
mixinISOFields(PlainMonthDay)
mixinCalendarFields(PlainMonthDay, monthDayCalendarFields)
