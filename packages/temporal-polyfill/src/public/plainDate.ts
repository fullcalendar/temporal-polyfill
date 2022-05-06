import { Temporal } from 'temporal-spec'
import { getCommonCalendar } from '../argParse/calendar'
import { parseCalendarDisplayOption } from '../argParse/calendarDisplay'
import { parseDiffOptions } from '../argParse/diffOptions'
import { OVERFLOW_REJECT, parseOverflowOption } from '../argParse/overflowHandling'
import { AbstractISOObj, ensureObj } from '../dateUtils/abstract'
import { compareDateTimes } from '../dateUtils/compare'
import { constrainDateISO } from '../dateUtils/constrain'
import { zeroISOTimeFields } from '../dateUtils/dayAndTime'
import { diffDates } from '../dateUtils/diff'
import { processDateFromFields, processDateWithFields } from '../dateUtils/fromAndWith'
import { validateDate } from '../dateUtils/isoFieldValidation'
import { formatCalendarID, formatDateISO } from '../dateUtils/isoFormat'
import {
  DateCalendarFields,
  attachStringTag,
  dateCalendarFields,
  mixinCalendarFields,
  mixinISOFields,
} from '../dateUtils/mixins'
import { parseDateTime } from '../dateUtils/parse'
import { refineBaseObj } from '../dateUtils/parseRefine'
import { DAY, DateUnitInt, YEAR } from '../dateUtils/units'
import { createPlainFormatFactoryFactory } from '../native/intlFactory'
import { ToLocaleStringMethods, mixinLocaleStringMethods } from '../native/intlMixins'
import { Calendar, createDefaultCalendar } from './calendar'
import { Duration, DurationArg, createDuration } from './duration'
import { createDateTime } from './plainDateTime'
import { PlainTime, PlainTimeArg, ensureLooseTime } from './plainTime'
import { createYearMonth } from './plainYearMonth'
import { TimeZone } from './timeZone'
import { createZonedDateTimeFromFields } from './zonedDateTime'

export type PlainDateArg = Temporal.PlainDate | Temporal.PlainDateLike | string

// inlined in the spec. not easy to get out
type ToZonedDateTimeOptions = Temporal.TimeZoneProtocol | string | {
  timeZone: Temporal.TimeZoneLike
  plainTime?: Temporal.PlainTime | Temporal.PlainTimeLike | string
}

type DiffOptions = Temporal.DifferenceOptions<'year' | 'month' | 'week' | 'day'>

export class PlainDate extends AbstractISOObj<Temporal.PlainDateISOFields>
  implements Temporal.PlainDate {
  constructor(
    isoYear: number,
    isoMonth: number,
    isoDay: number,
    calendarArg: Temporal.CalendarLike = createDefaultCalendar(),
  ) {
    const constrained = constrainDateISO({ isoYear, isoMonth, isoDay }, OVERFLOW_REJECT)
    const calendar = ensureObj(Calendar, calendarArg)

    validateDate(constrained, calendar.toString())

    super({
      ...constrained,
      calendar,
    })
  }

  static from(arg: PlainDateArg, options?: Temporal.AssignmentOptions): Temporal.PlainDate {
    parseOverflowOption(options) // unused, but need to validate, regardless of input type

    if (arg instanceof PlainDate) {
      return createDate(arg.getISOFields()) // optimization
    }

    if (typeof arg === 'object') {
      return processDateFromFields(arg, options)
    }

    return createDate(refineBaseObj(parseDateTime(String(arg))))
  }

  static compare(a: PlainDateArg, b: PlainDateArg): Temporal.ComparisonResult {
    return compareDateTimes(
      ensureObj(PlainDate, a),
      ensureObj(PlainDate, b),
    )
  }

  with(fields: Temporal.PlainDateLike, options?: Temporal.AssignmentOptions): Temporal.PlainDate {
    return processDateWithFields(this, fields, options)
  }

  withCalendar(calendarArg: Temporal.CalendarLike): Temporal.PlainDate {
    const isoFields = this.getISOFields()
    return new PlainDate(
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
      calendarArg,
    )
  }

  add(durationArg: DurationArg, options?: Temporal.ArithmeticOptions): Temporal.PlainDate {
    return this.calendar.dateAdd(this, durationArg, options)
  }

  subtract(durationArg: DurationArg, options?: Temporal.ArithmeticOptions): Temporal.PlainDate {
    return this.calendar.dateAdd(this, ensureObj(Duration, durationArg).negated(), options)
  }

  until(other: PlainDateArg, options?: DiffOptions): Temporal.Duration {
    return diffPlainDates(
      this,
      ensureObj(PlainDate, other),
      false,
      options,
    )
  }

  since(other: PlainDateArg, options?: DiffOptions): Temporal.Duration {
    return diffPlainDates(
      this,
      ensureObj(PlainDate, other),
      true,
      options,
    )
  }

  equals(other: PlainDateArg): boolean {
    return !compareDateTimes(this, ensureObj(PlainDate, other))
  }

  toString(options?: Temporal.ShowCalendarOption): string {
    const calendarDisplay = parseCalendarDisplayOption(options)
    const fields = this.getISOFields()

    return formatDateISO(fields) +
      formatCalendarID(fields.calendar.toString(), calendarDisplay)
  }

  toZonedDateTime(options: ToZonedDateTimeOptions): Temporal.ZonedDateTime {
    const refinedOptions = processToZonedDateTimeOptions(options)
    const timeZone = ensureObj(TimeZone, refinedOptions.timeZone)
    const plainTime = refinedOptions.plainTime === undefined
      ? undefined
      : ensureObj(PlainTime, refinedOptions.plainTime)

    return createZonedDateTimeFromFields({
      ...this.getISOFields(),
      ...(plainTime ? plainTime.getISOFields() : zeroISOTimeFields),
      timeZone,
    })
  }

  toPlainDateTime(timeArg?: PlainTimeArg): Temporal.PlainDateTime {
    return createDateTime({
      ...this.getISOFields(),
      ...ensureLooseTime(timeArg).getISOFields(),
    })
  }

  toPlainYearMonth(): Temporal.PlainYearMonth {
    return createYearMonth(this.getISOFields())
  }

  toPlainMonthDay(): Temporal.PlainMonthDay {
    return this.calendar.monthDayFromFields(this)
  }
}

// mixin
export interface PlainDate { [Symbol.toStringTag]: 'Temporal.PlainDate' }
export interface PlainDate extends DateCalendarFields { calendar: Temporal.CalendarProtocol }
export interface PlainDate extends ToLocaleStringMethods {}
attachStringTag(PlainDate, 'PlainDate')
mixinISOFields(PlainDate)
mixinCalendarFields(PlainDate, dateCalendarFields)
mixinLocaleStringMethods(PlainDate, createPlainFormatFactoryFactory({
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  weekday: undefined,
}, {
  hour: undefined,
  minute: undefined,
  second: undefined,
}))

// creation
export function createDate(isoFields: Temporal.PlainDateISOFields): PlainDate {
  return new PlainDate(
    isoFields.isoYear,
    isoFields.isoMonth,
    isoFields.isoDay,
    isoFields.calendar,
  )
}

// argument processing
function processToZonedDateTimeOptions(
  options?: ToZonedDateTimeOptions,
): {
    plainTime?: PlainTimeArg,
    timeZone: Temporal.TimeZoneLike,
  } {
  let plainTime: PlainTimeArg | undefined
  let timeZone: Temporal.TimeZoneLike | undefined

  if (typeof options === 'string') {
    timeZone = options
  } else if (typeof options === 'object') {
    if ((options as Temporal.TimeZoneProtocol).id !== undefined) {
      timeZone = options as Temporal.TimeZoneProtocol
    } else {
      timeZone = options.timeZone
      plainTime = (options as { plainTime?: PlainTimeArg }).plainTime
    }
    if (timeZone === undefined) {
      throw new TypeError('Invalid timeZone argument')
    }
  } else {
    throw new TypeError('Invalid options/timeZone argument')
  }

  return { plainTime, timeZone }
}

function diffPlainDates(
  pd0: PlainDate,
  pd1: PlainDate,
  flip: boolean,
  options: DiffOptions | undefined,
): Duration {
  return createDuration(
    diffDates(
      pd0,
      pd1,
      getCommonCalendar(pd0, pd1),
      flip,
      parseDiffOptions<Temporal.DateUnit, DateUnitInt>(options, DAY, DAY, DAY, YEAR),
    ),
  )
}
