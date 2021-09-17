import { extractCalendar, isoCalendar } from '../argParse/calendar'
import { parseCalendarDisplay } from '../argParse/calendarDisplay'
import { OVERFLOW_REJECT } from '../argParse/overflowHandling'
import { refineFields, refineOverrideFields } from '../argParse/refine'
import { AbstractISOObj, ensureObj } from '../dateUtils/abstract'
import { isoCalendarID } from '../dateUtils/calendar'
import { constrainDateISO } from '../dateUtils/date'
import { formatCalendarID, formatMonthDayISO } from '../dateUtils/isoFormat'
import { isoEpochLeapYear, isoFieldsToEpochMilli } from '../dateUtils/isoMath'
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
import { parseDateTimeISO } from '../dateUtils/parse'
import { throwNew } from '../utils/obj'
import {
  CalendarProtocol,
  DateISOFields,
  DateToStringOptions,
  LocalesArg,
  MonthDayArg,
  MonthDayLikeFields,
  MonthDayOverrides,
  OverflowOptions,
} from './args'
import { Calendar } from './calendar'
import { PlainDate } from './plainDate'

export class PlainMonthDay extends AbstractISOObj<DateISOFields> {
  constructor(
    isoMonth: number,
    isoDay: number,
    calendar: CalendarProtocol = isoCalendar,
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
    if (arg instanceof PlainMonthDay) {
      return createMonthDay(arg.getISOFields()) // optimization
    }
    if (typeof arg === 'object') {
      const refinedFields = refineFields(arg, monthDayFieldMap) as Partial<MonthDayFields>
      if (refinedFields.year == null && refinedFields.monthCode == null && arg.calendar != null) {
        throw new Error('If omitting year/monthCode, cant specify calendar')
      }
      return extractCalendar(arg).monthDayFromFields(refinedFields as MonthDayLikeFields, options)
    }
    return createMonthDay(parseDateTimeISO(String(arg)))
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
    const calendarDisplay = parseCalendarDisplay(options?.calendarName)

    return formatMonthDayISO(fields) +
      formatCalendarID(fields.calendar.id, calendarDisplay)
  }

  toLocaleString(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions): string {
    const fields = this.getISOFields()

    return new Intl.DateTimeFormat(locales, {
      calendar: fields.calendar.id,
      ...options,
      timeZone: 'UTC', // options can't override
      // TODO: inject more options to ensure only month+day are displayed by default
    }).format(
      isoFieldsToEpochMilli(fields),
    )
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
