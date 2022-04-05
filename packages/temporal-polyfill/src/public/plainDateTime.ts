import { getCommonCalendar, getStrangerCalendar } from '../argParse/calendar'
import { parseCalendarDisplayOption } from '../argParse/calendarDisplay'
import { parseDiffOptions } from '../argParse/diffOptions'
import { parseTimeToStringOptions } from '../argParse/isoFormatOptions'
import { OVERFLOW_REJECT, parseOverflowOption } from '../argParse/overflowHandling'
import { parseRoundingOptions } from '../argParse/roundingOptions'
import { timeUnitNames } from '../argParse/unitStr'
import { AbstractISOObj, ensureObj } from '../dateUtils/abstract'
import { compareDateTimes } from '../dateUtils/compare'
import { constrainDateTimeISO } from '../dateUtils/constrain'
import { diffDateTimes } from '../dateUtils/diff'
import { negateDuration } from '../dateUtils/durationFields'
import { processDateTimeFromFields, processDateTimeWithFields } from '../dateUtils/fromAndWith'
import { validateDateTime } from '../dateUtils/isoFieldValidation'
import { formatCalendarID, formatDateTimeISO } from '../dateUtils/isoFormat'
import {
  DateCalendarFields,
  dateCalendarFields,
  mixinCalendarFields,
  mixinISOFields,
} from '../dateUtils/mixins'
import { parseDateTime } from '../dateUtils/parse'
import { refineBaseObj } from '../dateUtils/parseRefine'
import { roundDateTime } from '../dateUtils/rounding'
import { translateDateTime } from '../dateUtils/translate'
import { DurationFields, LocalTimeFields } from '../dateUtils/typesPrivate'
import { DAY, DayTimeUnitInt, NANOSECOND, UnitInt, YEAR } from '../dateUtils/units'
import { createPlainFormatFactoryFactory } from '../native/intlFactory'
import { ToLocaleStringMethods, mixinLocaleStringMethods } from '../native/intlMixins'
import { Calendar, createDefaultCalendar } from './calendar'
import { Duration, createDuration } from './duration'
import { PlainDate, createDate } from './plainDate'
import { PlainMonthDay } from './plainMonthDay'
import { PlainTime, createTime, ensureLooseTime } from './plainTime'
import { PlainYearMonth, createYearMonth } from './plainYearMonth'
import { TimeZone } from './timeZone'
import {
  CalendarArg,
  CompareResult,
  DateArg,
  DateTimeArg,
  DateTimeISOFields,
  DateTimeOverrides,
  DateTimeRoundingOptions,
  DateTimeToStringOptions,
  DayTimeUnit,
  DiffOptions,
  Disambiguation,
  DurationArg,
  OverflowOptions,
  TimeArg,
  TimeZoneArg,
  Unit,
} from './types'
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
    calendarArg: CalendarArg = createDefaultCalendar(),
  ) {
    const constrained = constrainDateTimeISO({
      isoYear,
      isoMonth,
      isoDay,
      isoHour,
      isoMinute,
      isoSecond,
      isoMillisecond,
      isoMicrosecond,
      isoNanosecond,
    }, OVERFLOW_REJECT)
    const calendar = ensureObj(Calendar, calendarArg)

    validateDateTime(constrained, calendar.id)

    super({
      ...constrained,
      calendar,
    })
  }

  static from(arg: DateTimeArg, options?: OverflowOptions): PlainDateTime {
    const overflowHandling = parseOverflowOption(options)

    return createDateTime(
      arg instanceof PlainDateTime
        ? arg.getISOFields() // optimization
        : typeof arg === 'object'
          ? processDateTimeFromFields(arg, overflowHandling, options)
          : refineBaseObj(parseDateTime(String(arg))),
    )
  }

  static compare(a: DateTimeArg, b: DateTimeArg): CompareResult {
    return compareDateTimes(
      ensureObj(PlainDateTime, a),
      ensureObj(PlainDateTime, b),
    )
  }

  with(fields: DateTimeOverrides, options?: OverflowOptions): PlainDateTime {
    const overflowHandling = parseOverflowOption(options)
    return createDateTime(
      processDateTimeWithFields(this, fields, overflowHandling, options),
    )
  }

  withPlainDate(dateArg: DateArg): PlainDateTime {
    const date = ensureObj(PlainDate, dateArg)
    return createDateTime({
      ...this.getISOFields(), // provides time fields
      ...date.getISOFields(),
      calendar: getStrangerCalendar(this, date),
    })
  }

  withPlainTime(timeArg?: TimeArg): PlainDateTime {
    return createDateTime({
      ...this.getISOFields(), // provides date & calendar fields
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
    return translatePlainDateTime(this, ensureObj(Duration, durationArg), options)
  }

  subtract(durationArg: DurationArg, options?: OverflowOptions): PlainDateTime {
    return translatePlainDateTime(this, negateDuration(ensureObj(Duration, durationArg)), options)
  }

  until(other: DateTimeArg, options?: DiffOptions): Duration {
    return diffPlainDateTimes(
      this,
      ensureObj(PlainDateTime, other),
      false,
      options,
    )
  }

  since(other: DateTimeArg, options?: DiffOptions): Duration {
    return diffPlainDateTimes(
      this,
      ensureObj(PlainDateTime, other),
      true,
      options,
    )
  }

  round(options: DateTimeRoundingOptions | DayTimeUnit): PlainDateTime {
    const roundingConfig = parseRoundingOptions<DayTimeUnit, DayTimeUnitInt>(
      options,
      undefined, // no default. required
      NANOSECOND, // minUnit
      DAY, // maxUnit
    )

    return createDateTime({
      ...roundDateTime(this.getISOFields(), roundingConfig),
      calendar: this.calendar,
    })
  }

  equals(other: DateTimeArg): boolean {
    return !compareDateTimes(this, ensureObj(PlainDateTime, other))
  }

  toString(options?: DateTimeToStringOptions): string {
    const formatConfig = parseTimeToStringOptions(options)
    const calendarDisplay = parseCalendarDisplayOption(options)
    const isoFields = roundDateTime(this.getISOFields(), formatConfig)

    return formatDateTimeISO(isoFields, formatConfig) +
      formatCalendarID(this.calendar.toString(), calendarDisplay)
  }

  toZonedDateTime(
    timeZoneArg: TimeZoneArg,
    options?: { disambiguation?: Disambiguation },
  ): ZonedDateTime {
    const timeZone = ensureObj(TimeZone, timeZoneArg)
    const instant = timeZone.getInstantFor(this, options)

    // more succinct than createZonedDateTimeFromFields
    return new ZonedDateTime(instant.epochNanoseconds, timeZone, this.calendar)
  }

  toPlainYearMonth(): PlainYearMonth { return createYearMonth(this.getISOFields()) }
  toPlainMonthDay(): PlainMonthDay { return this.calendar.monthDayFromFields(this) }
  toPlainDate(): PlainDate { return createDate(this.getISOFields()) }
  toPlainTime(): PlainTime { return createTime(this.getISOFields()) }
}

// mixin
export interface PlainDateTime extends DateCalendarFields { calendar: Calendar }
export interface PlainDateTime extends LocalTimeFields {}
export interface PlainDateTime extends ToLocaleStringMethods {}
mixinISOFields(PlainDateTime, timeUnitNames)
mixinCalendarFields(PlainDateTime, dateCalendarFields)
mixinLocaleStringMethods(PlainDateTime, createPlainFormatFactoryFactory({
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  weekday: undefined,
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
}, {}))

// creation
export function createDateTime(isoFields: DateTimeISOFields): PlainDateTime {
  return new PlainDateTime(
    isoFields.isoYear,
    isoFields.isoMonth,
    isoFields.isoDay,
    isoFields.isoHour,
    isoFields.isoMinute,
    isoFields.isoSecond,
    isoFields.isoMillisecond,
    isoFields.isoMicrosecond,
    isoFields.isoNanosecond,
    isoFields.calendar,
  )
}

function translatePlainDateTime(
  pdt0: PlainDateTime,
  dur: DurationFields,
  options: OverflowOptions | undefined,
): PlainDateTime {
  const isoFields = translateDateTime(pdt0.getISOFields(), dur, options)
  return createDateTime({
    ...isoFields,
    calendar: pdt0.calendar,
  })
}

function diffPlainDateTimes(
  pdt0: PlainDateTime,
  pdt1: PlainDateTime,
  flip: boolean,
  options: DiffOptions | undefined,
): Duration {
  const diffConfig = parseDiffOptions<Unit, UnitInt>(
    options,
    DAY, // largestUnitDefault
    NANOSECOND, // smallestUnitDefault
    NANOSECOND, // minUnit
    YEAR, // maxUnit
  )

  return createDuration(
    diffDateTimes(pdt0, pdt1, getCommonCalendar(pdt0, pdt1), flip, diffConfig),
  )
}
