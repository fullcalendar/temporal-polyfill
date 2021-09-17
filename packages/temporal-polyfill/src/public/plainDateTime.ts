import { extractCalendar, isoCalendar } from '../argParse/calendar'
import { parseCalendarDisplay } from '../argParse/calendarDisplay'
import { parseTimeToStringOptions } from '../argParse/isoFormatOptions'
import { OVERFLOW_REJECT } from '../argParse/overflowHandling'
import { refineFields, refineOverrideFields } from '../argParse/refine'
import { timeUnitNames } from '../argParse/units'
import { AbstractISOObj, ensureObj } from '../dateUtils/abstract'
import { createDate } from '../dateUtils/date'
import {
  addToDateTime,
  compareDateTimes,
  constrainDateTimeISO,
  createDateTime,
  dateTimeFieldMap,
  dateTimeFieldsToISO,
  diffDateTimes,
  overrideDateTimeFields,
  roundDateTime,
} from '../dateUtils/dateTime'
import { formatCalendarID, formatDateTimeISO } from '../dateUtils/isoFormat'
import { isoFieldsToEpochMilli } from '../dateUtils/isoMath'
import {
  DateCalendarFields,
  dateCalendarFields,
  mixinCalendarFields,
  mixinISOFields,
} from '../dateUtils/mixins'
import { createMonthDay } from '../dateUtils/monthDay'
import { parseDateTimeISO } from '../dateUtils/parse'
import { TimeFields, createTime, ensureLooseTime } from '../dateUtils/time'
import { createYearMonth } from '../dateUtils/yearMonth'
import {
  CalendarArg,
  CompareResult,
  DateArg,
  DateTimeArg,
  DateTimeISOFields,
  DateTimeLikeFields,
  DateTimeOverrides,
  DateTimeRoundOptions,
  DateTimeToStringOptions,
  DiffOptions,
  Disambiguation,
  DurationArg,
  LocalesArg,
  OverflowOptions,
  TimeArg,
  TimeZoneArg,
} from './args'
import { Calendar } from './calendar'
import { Duration } from './duration'
import { PlainDate } from './plainDate'
import { PlainMonthDay } from './plainMonthDay'
import { PlainTime } from './plainTime'
import { PlainYearMonth } from './plainYearMonth'
import { TimeZone } from './timeZone'
import { ZonedDateTime } from './zonedDateTime'

export class PlainDateTime extends AbstractISOObj<DateTimeISOFields> {
  constructor(
    isoYear: number,
    isoMonth: number,
    isoDay: number,
    isoHour = 0,
    isoMinute = 0,
    isoSecond = 0,
    isoMillisecond = 0,
    isoMicrosecond = 0,
    isoNanosecond = 0,
    calendarArg: CalendarArg = isoCalendar,
  ) {
    super({
      ...constrainDateTimeISO({
        isoYear,
        isoMonth,
        isoDay,
        isoHour,
        isoMinute,
        isoSecond,
        isoMillisecond,
        isoMicrosecond,
        isoNanosecond,
      }, OVERFLOW_REJECT),
      calendar: ensureObj(Calendar, calendarArg),
    })
  }

  static from(arg: DateTimeArg, options?: OverflowOptions): PlainDateTime {
    return createDateTime(
      arg instanceof PlainDateTime
        ? arg.getISOFields() // optimization
        : typeof arg === 'object'
          ? dateTimeFieldsToISO(
            refineFields(arg, dateTimeFieldMap) as DateTimeLikeFields,
            options,
            extractCalendar(arg),
          )
          : parseDateTimeISO(String(arg)),
    )
  }

  static compare(a: DateTimeArg, b: DateTimeArg): CompareResult {
    return compareDateTimes(
      ensureObj(PlainDateTime, a),
      ensureObj(PlainDateTime, b),
    )
  }

  with(fields: DateTimeOverrides, options?: OverflowOptions): PlainDateTime {
    const refinedFields = refineOverrideFields(fields, dateTimeFieldMap)
    const mergedFields = overrideDateTimeFields(refinedFields, this)
    return createDateTime(dateTimeFieldsToISO(mergedFields, options, this.calendar))
  }

  withPlainDate(dateArg: DateArg): PlainDateTime {
    return createDateTime({
      ...this.getISOFields(), // provides time fields
      ...ensureObj(PlainDate, dateArg).getISOFields(),
    })
  }

  withPlainTime(timeArg?: TimeArg): PlainDateTime {
    return createDateTime({
      ...this.getISOFields(), // provides date fields
      ...ensureLooseTime(timeArg).getISOFields(),
    })
  }

  withCalendar(calendarArg: CalendarArg): PlainDateTime {
    return createDateTime({
      ...this.getISOFields(),
      calendar: ensureObj(Calendar, calendarArg),
    })
  }

  add(durationArg: DurationArg, options?: OverflowOptions): PlainDateTime {
    return addToDateTime(this, ensureObj(Duration, durationArg), options)
  }

  subtract(durationArg: DurationArg, options?: OverflowOptions): PlainDateTime {
    return addToDateTime(this, ensureObj(Duration, durationArg).negated(), options)
  }

  until(other: DateTimeArg, options?: DiffOptions): Duration {
    return diffDateTimes(this, ensureObj(PlainDateTime, other), options)
  }

  since(other: DateTimeArg, options?: DiffOptions): Duration {
    return diffDateTimes(ensureObj(PlainDateTime, other), this, options)
  }

  round(options: DateTimeRoundOptions): PlainDateTime {
    return roundDateTime(this, options)
  }

  equals(other: DateTimeArg): boolean {
    return compareDateTimes(this, ensureObj(PlainDateTime, other)) === 0
  }

  toString(options?: DateTimeToStringOptions): string {
    const formatConfig = parseTimeToStringOptions(options)
    const calendarDisplay = parseCalendarDisplay(options?.calendarName)
    const fields = this.getISOFields()

    return formatDateTimeISO(fields, formatConfig) +
      formatCalendarID(fields.calendar.id, calendarDisplay)
  }

  toLocaleString(locales?: LocalesArg, options?: Intl.DateTimeFormatOptions): string {
    const fields = this.getISOFields()

    return new Intl.DateTimeFormat(locales, {
      calendar: fields.calendar.id,
      ...options,
      timeZone: 'UTC', // options can't override
      // TODO: inject more options to ensure time is displayed by default
    }).format(
      isoFieldsToEpochMilli(fields),
    )
  }

  // workhorse for converting to ZonedDateTime for other objects
  toZonedDateTime(
    timeZoneArg: TimeZoneArg,
    options?: { disambiguation?: Disambiguation },
  ): ZonedDateTime {
    const timeZone = ensureObj(TimeZone, timeZoneArg)
    const instant = timeZone.getInstantFor(this, options)

    return new ZonedDateTime(
      instant.epochNanoseconds,
      timeZone,
      this.calendar,
    )
  }

  toPlainYearMonth(): PlainYearMonth { return createYearMonth(this.getISOFields()) }
  toPlainMonthDay(): PlainMonthDay { return createMonthDay(this.getISOFields()) }
  toPlainDate(): PlainDate { return createDate(this.getISOFields()) }
  toPlainTime(): PlainTime { return createTime(this.getISOFields()) }
}

// mixin
export interface PlainDateTime extends DateCalendarFields { calendar: Calendar }
export interface PlainDateTime extends TimeFields {}
mixinISOFields(PlainDateTime, timeUnitNames)
mixinCalendarFields(PlainDateTime, dateCalendarFields)
