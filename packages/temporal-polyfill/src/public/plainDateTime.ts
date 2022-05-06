import { Temporal } from 'temporal-spec'
import { getCommonCalendar, getStrangerCalendar } from '../argParse/calendar'
import { parseCalendarDisplayOption } from '../argParse/calendarDisplay'
import { parseDiffOptions } from '../argParse/diffOptions'
import { parseDisambigOption } from '../argParse/disambig'
import { parseTimeToStringOptions } from '../argParse/isoFormatOptions'
import { OVERFLOW_REJECT, parseOverflowOption } from '../argParse/overflowHandling'
import { parseRoundingOptions } from '../argParse/roundingOptions'
import { timeUnitNames } from '../argParse/unitStr'
import { AbstractISOObj, ensureObj } from '../dateUtils/abstract'
import { compareDateTimes, dateTimesEqual } from '../dateUtils/compare'
import { constrainDateTimeISO } from '../dateUtils/constrain'
import { DayTimeUnit } from '../dateUtils/dayAndTime'
import { diffDateTimes } from '../dateUtils/diff'
import { DurationFields, negateDuration } from '../dateUtils/durationFields'
import { processDateTimeFromFields, processDateTimeWithFields } from '../dateUtils/fromAndWith'
import { validateDateTime } from '../dateUtils/isoFieldValidation'
import { formatCalendarID, formatDateTimeISO } from '../dateUtils/isoFormat'
import { LocalTimeFields } from '../dateUtils/localFields'
import {
  DateCalendarFields,
  attachStringTag,
  dateCalendarFields,
  mixinCalendarFields,
  mixinISOFields,
} from '../dateUtils/mixins'
import { parseDateTime } from '../dateUtils/parse'
import { refineBaseObj } from '../dateUtils/parseRefine'
import { roundDateTime } from '../dateUtils/rounding'
import { getInstantFor } from '../dateUtils/timeZone'
import { translateDateTime } from '../dateUtils/translate'
import { DAY, DayTimeUnitInt, NANOSECOND, UnitInt, YEAR } from '../dateUtils/units'
import { createPlainFormatFactoryFactory } from '../native/intlFactory'
import { ToLocaleStringMethods, mixinLocaleStringMethods } from '../native/intlMixins'
import { Calendar, createDefaultCalendar } from './calendar'
import { Duration, DurationArg, createDuration } from './duration'
import { PlainDate, PlainDateArg, createDate } from './plainDate'
import { PlainTimeArg, createTime, ensureLooseTime } from './plainTime'
import { createYearMonth } from './plainYearMonth'
import { TimeZone } from './timeZone'
import { ZonedDateTime } from './zonedDateTime'

export type PlainDateTimeArg = Temporal.PlainDateTime | Temporal.PlainDateTimeLike | string

type DiffOptions = Temporal.DifferenceOptions<
'year' | 'month' | 'week' | 'day' |
'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'
>

type RoundOptions = Temporal.RoundTo<
'day' | 'hour' | 'minute' | 'second' |
'millisecond' | 'microsecond' | 'nanosecond'
>

export class PlainDateTime extends AbstractISOObj<Temporal.PlainDateTimeISOFields>
  implements Temporal.PlainDateTime {
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
    calendarArg: Temporal.CalendarLike = createDefaultCalendar(),
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

    validateDateTime(constrained, calendar.toString())

    super({
      ...constrained,
      calendar,
    })
  }

  static from(arg: PlainDateTimeArg, options?: Temporal.AssignmentOptions): Temporal.PlainDateTime {
    const overflowHandling = parseOverflowOption(options)

    return createDateTime(
      arg instanceof PlainDateTime
        ? arg.getISOFields() // optimization
        : typeof arg === 'object'
          ? processDateTimeFromFields(arg, overflowHandling, options)
          : refineBaseObj(parseDateTime(String(arg))),
    )
  }

  static compare(a: PlainDateTimeArg, b: PlainDateTimeArg): Temporal.ComparisonResult {
    return compareDateTimes(
      ensureObj(PlainDateTime, a),
      ensureObj(PlainDateTime, b),
    )
  }

  with(
    fields: Temporal.PlainDateTimeLike,
    options?: Temporal.AssignmentOptions,
  ): Temporal.PlainDateTime {
    const overflowHandling = parseOverflowOption(options)
    return createDateTime(
      processDateTimeWithFields(this, fields, overflowHandling, options),
    )
  }

  withPlainDate(dateArg: PlainDateArg): Temporal.PlainDateTime {
    const date = ensureObj(PlainDate, dateArg)
    return createDateTime({
      ...this.getISOFields(), // provides time fields
      ...date.getISOFields(),
      calendar: getStrangerCalendar(this, date),
    })
  }

  withPlainTime(timeArg?: PlainTimeArg): Temporal.PlainDateTime {
    return createDateTime({
      ...this.getISOFields(), // provides date & calendar fields
      ...ensureLooseTime(timeArg).getISOFields(),
    })
  }

  withCalendar(calendarArg: Temporal.CalendarLike): Temporal.PlainDateTime {
    return createDateTime({
      ...this.getISOFields(),
      calendar: ensureObj(Calendar, calendarArg),
    })
  }

  add(durationArg: DurationArg, options?: Temporal.ArithmeticOptions): Temporal.PlainDateTime {
    return translatePlainDateTime(this, ensureObj(Duration, durationArg), options)
  }

  subtract(durationArg: DurationArg, options?: Temporal.ArithmeticOptions): Temporal.PlainDateTime {
    return translatePlainDateTime(this, negateDuration(ensureObj(Duration, durationArg)), options)
  }

  until(other: PlainDateTimeArg, options?: DiffOptions): Temporal.Duration {
    return diffPlainDateTimes(
      this,
      ensureObj(PlainDateTime, other),
      false,
      options,
    )
  }

  since(other: PlainDateTimeArg, options?: DiffOptions): Temporal.Duration {
    return diffPlainDateTimes(
      this,
      ensureObj(PlainDateTime, other),
      true,
      options,
    )
  }

  round(options: RoundOptions): Temporal.PlainDateTime {
    const roundingConfig = parseRoundingOptions<DayTimeUnit, DayTimeUnitInt>(
      options,
      NANOSECOND, // minUnit
      DAY, // maxUnit
    )

    return createDateTime({
      ...roundDateTime(this.getISOFields(), roundingConfig),
      calendar: this.calendar,
    })
  }

  equals(other: PlainDateTimeArg): boolean {
    return dateTimesEqual(this, ensureObj(PlainDateTime, other))
  }

  toString(options?: Temporal.CalendarTypeToStringOptions): string {
    const formatConfig = parseTimeToStringOptions(options)
    const calendarDisplay = parseCalendarDisplayOption(options)
    const isoFields = roundDateTime(this.getISOFields(), formatConfig)

    return formatDateTimeISO(isoFields, formatConfig) +
      formatCalendarID(this.calendar.toString(), calendarDisplay)
  }

  toZonedDateTime(
    timeZoneArg: Temporal.TimeZoneLike,
    options?: Temporal.ToInstantOptions,
  ): Temporal.ZonedDateTime {
    const timeZone = ensureObj(TimeZone, timeZoneArg)
    const instant = getInstantFor(timeZone, this, parseDisambigOption(options))

    // more succinct than createZonedDateTimeFromFields
    return new ZonedDateTime(instant.epochNanoseconds, timeZone, this.calendar)
  }

  toPlainYearMonth(): Temporal.PlainYearMonth { return createYearMonth(this.getISOFields()) }
  toPlainMonthDay(): Temporal.PlainMonthDay { return this.calendar.monthDayFromFields(this) }
  toPlainDate(): Temporal.PlainDate { return createDate(this.getISOFields()) }
  toPlainTime(): Temporal.PlainTime { return createTime(this.getISOFields()) }
}

// mixin
export interface PlainDateTime { [Symbol.toStringTag]: 'Temporal.PlainDateTime' }
export interface PlainDateTime extends DateCalendarFields { calendar: Temporal.CalendarProtocol }
export interface PlainDateTime extends LocalTimeFields {}
export interface PlainDateTime extends ToLocaleStringMethods {}
attachStringTag(PlainDateTime, 'PlainDateTime')
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
export function createDateTime(isoFields: Temporal.PlainDateTimeISOFields): PlainDateTime {
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
  options: Temporal.ArithmeticOptions | undefined,
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
  const diffConfig = parseDiffOptions<Temporal.DateTimeUnit, UnitInt>(
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
